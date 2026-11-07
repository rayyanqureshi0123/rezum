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
          content: "You are an experienced, balanced, and constructive ATS Auditor and Senior Technical Recruiter. You evaluate resumes fairly based on industry ATS standards, recognizing strong technical skills and project experience while offering clear, practical guidance for improvement."
        },
        {
          role: "user",
          content: `
            BALANCED ATS AUDIT: Evaluate this resume fairly and realistically against standard Applicant Tracking System (ATS) criteria.
            
            SCORING TIERS (BALANCED & REALISTIC):
            - **85-100 (EXCELLENT MATCH)**: Clear structure, strong relevant keywords, well-defined experience, and quantified achievements.
            - **70-84 (COMPETITIVE / GOOD)**: Solid technical foundation and skills, clean formatting, and clear experience, with potential to add more measurable metrics.
            - **55-69 (MODERATE / DEVELOPING)**: Good core skills or projects, but bullet points could be more action-oriented or lack sufficient technical detail.
            - **BELOW 55 (NEEDS SIGNIFICANT WORK)**: Missing critical sections (like Skills or Education), or very sparse content.

            BALANCED DEDUCTIONS:
            - Deduct 5-10 points if bullet points lack measurable metrics or impact numbers.
            - Deduct 5 points if section headers are non-standard.
            - Deduct 5-10 points if layout elements could hinder standard parsing.
            - Reward relevant tech stack keywords, education, and clear project/work descriptions fairly.

            ANALYTICS:
            - **quantificationScore**: Evaluate the overall level of quantified data (0-100). Check for metrics, numbers, percentages (%), version numbers, scale indicators (users, requests, databases, projects), and academic scores (GPA/CGPA). If the candidate specifies technical versions and projects, give appropriate partial credit (e.g., 30-50) rather than 0.
            - **verbAnalysis**: Always select 3-4 common action verbs found in the resume (such as 'Developed', 'Built', 'Managed', 'Worked on', 'Maintained', 'Designed') and provide higher-impact, executive alternatives (such as 'Engineered', 'Architected', 'Spearheaded', 'Optimized', 'Orchestrated'). Never return an empty array.
            - **keywordGap**: Provide 4-6 industry-standard technical keywords/skills for their target role, marking whether each is found in the resume: [{ "keyword": "string", "found": boolean }].

            RUBRIC:
            1. **atsScore**: (0-100) Fair and objective score reflecting realistic ATS compatibility and recruiter appeal.
            2. **interviewProbability**: (0-100) Realistic probability of securing an interview based on the resume's competitiveness.
            
            Return strictly as a JSON object with this structure:
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
              "quantificationScore": number, 
              "verbAnalysis": {
                "weakVerbs": ["string"],
                "strongAlternatives": ["string"]
              },
              "keywordGap": [{ "keyword": "string", "found": boolean }],
              "contentSuggestions": ["string"],
              "jobRoleSuggestions": ["string"]
              ${jobDescription ? ',\n              "jdMatchScore": number,\n              "jdInsights": ["string"]' : ''}
            }

            Resume Text:
            ---
            ${resumeText}
            ---
            ${jobDescription ? `\n\n            Target Job Description (JD):\n            ---\n            ${jobDescription}\n            ---` : ''}
          `,
        },
      ],
      model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      temperature: 0.4, 
      response_format: { type: "json_object" },
    });

    const aiResponse = completion.choices[0].message.content;
    const analysisResult = JSON.parse(aiResponse);

    // Guardrail: Fix rogue decimal probabilities
    if (analysisResult.interviewProbability > 0 && analysisResult.interviewProbability < 1) {
      analysisResult.interviewProbability = Math.round(analysisResult.interviewProbability * 100);
    }

    // Guardrail: Ensure realistic quantification score
    if (!analysisResult.quantificationScore || analysisResult.quantificationScore < 10) {
      const numbersFound = (resumeText.match(/\b\d+(\.\d+)?%?(\+)?\b/g) || []).length;
      analysisResult.quantificationScore = Math.max(30, Math.min(75, 25 + (numbersFound * 4)));
    }

    // Guardrail: Ensure verbAnalysis is never empty
    if (!analysisResult.verbAnalysis?.weakVerbs?.length) {
      analysisResult.verbAnalysis = {
        weakVerbs: ['Developed', 'Built', 'Maintained', 'Designed'],
        strongAlternatives: ['Engineered', 'Architected', 'Optimized', 'Spearheaded']
      };
    }

    // Guardrail: Ensure keywordGap is always populated
    if (!analysisResult.keywordGap || !analysisResult.keywordGap.length) {
      const textLower = (resumeText || '').toLowerCase();
      const standardKeywords = ['Docker', 'CI/CD Pipelines', 'TypeScript', 'Unit Testing', 'Redis', 'Microservices'];
      analysisResult.keywordGap = standardKeywords.map(kw => ({
        keyword: kw,
        found: textLower.includes(kw.toLowerCase())
      }));
    }

    const originalName = req.file.originalname;

    const newResume = await Resume.create({
      userId: req.user._id,
      fileUrl: fileUrl,
      publicId: publicId,
      fileName: originalName,
      resumeText: resumeText,
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

// Fetch single resume analysis
export const getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ message: 'Resume analysis not found' });
    }
    if (resume.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this record' });
    }
    res.json({ success: true, resume });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch resume analysis', error: error.message });
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
      model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
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
      model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
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
