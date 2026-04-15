import Groq from 'groq-sdk';
import pdfParse from 'pdf-parse';
import Resume from '../models/Resume.js';
import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

export const analyzeResume = async (req, res) => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No resume uploaded' });
    }

    const fileUrl = req.file.path;
    const publicId = req.file.filename;

    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    const pdfData = await pdfParse(buffer);
    const resumeText = pdfData.text.trim();
    
    const jobDescription = req.body.jobDescription || "";

    // Manual check for contact info to prevent AI hallucinations
    const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(resumeText);
    const hasPhone = /[\d\s-]{7,}/.test(resumeText);
    const contactHint = (hasEmail || hasPhone) ? "PRESENT (Confirmed by parser)" : "MISSING";

    if (resumeText.length < 50) {
       // Delete the bad file immediately
       await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
       return res.status(400).json({ 
         message: 'PDF appears to be empty or is a scanned image. Please upload a text-based PDF for ATS analysis.' 
       });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an elite Tech Recruiter and ATS Optimization Expert. Your goal is to provide deep, brutally honest, and highly specific resume feedback. Never give the same generic advice twice. Be extremely critical about quantifiable results and skill relevance."
        },
        {
          role: "user",
          content: `
            Analyze the following unique resume text. You MUST avoid generic placeholders. 
            Provide feedback that is ONLY relevant to this specific candidate.

            Tasks:
            1. **Evidence-Based AI Analysis**: Analyze the candidate's specific background. No generic fluff.
            2. **Quantifiable Content Suggestions**: Point to specific parts of THIS resume that need more data.
            3. **Structural Formatting Warnings**: Note only TRULY problematic formatting like jumbled text or overlapping lines. IMPORTANT: Common icons/symbols (like phone, email, or LinkedIn icons) are EXCELLENT for modern resumes - do NOT flag them as errors or non-standard characters.
            4. **Extracted Skills**: List only the skills actually found in the text.
            5. **Adaptive Career Path**: Suggest 3-5 job titles that specifically match this candidate's history.
            6. **Missing Section Alert**: Check for standard sections. 
               - CONTACT INFO STATUS: ${contactHint}. If this says PRESENT, do NOT list "Contact" as missing under any circumstances.
               - If the resume has a strong "Projects" section, do NOT flag "Experience" as missing.
            7. **ATS Score Calculation**: Derive an honest score (0-100).
            8. **Interview Probability**: Provide a percentage (0-100) based on how competitive this resume is for top-tier tech roles.
            9. **Section Ratings**: Provide a rating (1-10) for these 5 areas: ["Format", "Keywords", "Quantifiable", "Structure", "Impact"].
            10. **Market Readiness Insight**: A 1-sentence punchy insight about the candidate's market value.
            ${jobDescription ? `
            11. **JD Match Evaluation**: Compare the resume against the provided Job Description. Assign an objective match score (0-100) based on how well the candidate's skills and experience fit the JD.
            12. **JD Insights**: Provide 2-3 specific, actionable insights explaining the match score—what aligns well and what critical requirements from the JD are missing.
            13. **Keyword Gap Analysis**: Extract the top 10-15 important keywords/skills from the Job Description. For each keyword, mark whether it is FOUND or MISSING in the resume. Return as an array of objects.
            ` : `
            Do NOT include "jdMatchScore", "jdInsights", or "keywordGap" in the JSON output, as no job description was provided.`}

            Format strictly as a JSON object with this structure:
            {
              "atsScore": number,
              "interviewProbability": number,
              "sectionRatings": {
                "format": number,
                "keywords": number,
                "quantifiable": number,
                "structure": number,
                "impact": number
              },
              "marketReadinessInsight": "string",
              "overallAnalysis": "string",
              "missingSections": ["string"],
              "errors": ["string"],
              "skills": { "technical": ["string"], "soft": ["string"] },
              "contentSuggestions": ["string"],
              "jobRoleSuggestions": ["string"]
              ${jobDescription ? ',\n              "jdMatchScore": number,\n              "jdInsights": ["string"],\n              "keywordGap": [{ "keyword": "string", "found": true/false }]' : ''}
            }
            
            Resume Text for Analysis:
            ---
            ${resumeText}
            ---
            ${jobDescription ? `\n\n            Job Description Target:\n            ---\n            ${jobDescription}\n            ---` : ''}
          `,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7, 
      response_format: { type: "json_object" },
    });

    const aiResponse = completion.choices[0].message.content;
    const analysisResult = JSON.parse(aiResponse);

    const originalName = req.file.originalname;

    // We now keep the file in Cloudinary to allow the user to view it on the dashboard.
    // It will be deleted when the user deletes the analysis record.

    const newResume = await Resume.create({
      userId: req.user._id,
      fileUrl: fileUrl,
      publicId: publicId,
      fileName: originalName,
      jobDescription: jobDescription || null,
      analysis: analysisResult,
    });

    res.json({
      success: true,
      resume: newResume,
    });

  } catch (error) {
    if (req.file) {
      await cloudinary.uploader.destroy(req.file.filename, { resource_type: 'raw' }).catch(() => {});
    }
    console.error('SERVER ERROR DURING ANALYSIS:', error);
    res.status(500).json({
      message: 'Failed to analyze resume',
      error: error.message,
    });
  }
};

// FEATURE 1: Resume Management
// Fetch history
export const getResumeHistory = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: resumes.length, resumes });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch resume history', error: error.message });
  }
};

// Delete a past analysis record
export const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    if (resume.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this record' });
    }
    
    if (resume.publicId) {
      await cloudinary.uploader.destroy(resume.publicId, { resource_type: 'raw' }).catch((err) => console.error("Cloudinary cleanup error:", err));
    }
    
    await resume.deleteOne();
    res.json({ success: true, message: 'Resume analysis deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete resume', error: error.message });
  }
};

// ─── FEATURE: AI Bullet Point Rewriter (STAR Method) ───
export const rewriteBullet = async (req, res) => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const { bulletPoint, jobTitle } = req.body;
    if (!bulletPoint) {
      return res.status(400).json({ message: 'No bullet point provided' });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert resume coach. You rewrite weak resume bullet points into powerful, quantified STAR-method statements. Always include specific metrics, technologies, and impact. Return ONLY a JSON object."
        },
        {
          role: "user",
          content: `Rewrite this resume bullet point using the STAR method (Situation, Task, Action, Result). Make it specific, quantified, and impactful for a ${jobTitle || 'tech'} role.

          Original: "${bulletPoint}"

          Return strictly as JSON:
          {
            "improved": "the rewritten bullet point string",
            "explanation": "a brief 1-sentence explanation of what was improved"
          }`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.6,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Bullet rewrite error:', error);
    res.status(500).json({ message: 'Failed to rewrite bullet point', error: error.message });
  }
};

// ─── FEATURE: AI Cover Letter Generator ───
export const generateCoverLetter = async (req, res) => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const { resumeId } = req.body;
    if (!resumeId) {
      return res.status(400).json({ message: 'Resume ID is required' });
    }

    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    if (resume.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const analysis = resume.analysis;
    const jobDesc = resume.jobDescription || '';
    const skills = [...(analysis.skills?.technical || []), ...(analysis.skills?.soft || [])].join(', ');
    const jobRoles = (analysis.jobRoleSuggestions || []).join(', ');

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an elite executive career coach and professional copywriter. Your task is to write a highly compelling, professional, and tailored cover letter. Base the tone on formal business standards. The letter MUST explicitly draw from the candidate's provided skills and match the target role. Return ONLY a JSON object."
        },
        {
          role: "user",
          content: `Write a sophisticated, highly professional cover letter for a candidate. 
          
          Target Role: ${jobRoles ? jobRoles.split(',')[0] : 'the specified position'}
          Candidate's Key Skills: ${skills}
          ${jobDesc ? `Target Job Description to align with:\n---\n${jobDesc}\n---` : 'Write a general but highly tailored cover letter focusing purely on the candidate\'s strengths.'}

          Return strictly as JSON:
          {
            "coverLetter": "the full cover letter text with proper paragraph breaks using \n\n",
            "subject": "a highly professional email subject line"
          }`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Cover letter error:', error);
    res.status(500).json({ message: 'Failed to generate cover letter', error: error.message });
  }
};
