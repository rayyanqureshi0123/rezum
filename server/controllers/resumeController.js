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
          content: "You are a Highly Cynical Senior Executive Recruiter and ATS Auditor for a Fortune 500 company. You have seen thousands of 'good' resumes and you are only impressed by the top 1%. You are extremely strict and look for every reason to disqualify or de-rank a candidate."
        },
        {
          role: "user",
          content: `
            ULTRA-STRICT ATS AUDIT: Evaluate this resume with total professional skepticism.
            
            SCORING MANDATES (CRITICAL):
            - **85-100 (ELITE ONLY)**: Reserved ONLY for resumes with perfect formatting AND high-impact, quantified metrics (%, $, months) in EVERY individual bullet point. If even ONE job block is generic, it CANNOT be Elite.
            - **70-84 (STRONG)**: High-quality technical skills and standard format, but lacks consistent data-driven results. 
            - **50-69 (AVERAGE)**: Meaningful experience but written with generic 'task-based' bullets (e.g., 'Responsible for...', 'Managed...'). 
            - **BELOW 50 (REJECT)**: Any major formatting error (tables, columns, images) OR purely generic text without technical depth.

            STRICT PENALTIES:
            - Deduct 20 points if no specific numbers (%, $, #) are found in the last 2 roles.
            - Deduct 15 points if the summary is 'Objective-based' instead of 'Result-based'.
            - Deduct 30 points if it uses a multi-column layout (ATS-killer).
            - Deduct 10 points for every section header that is non-standard.

            NEW ANALYTICS (MANDATORY):
            - **quantificationScore**: Calculate what % of bullet points contain at least one piece of measurable data (numbers, currency, or percentages). 0-100.
            - **verbAnalysis**: Identify up to 3 'weak' or 'passive' verbs (e.g., 'Helped', 'Handled', 'Managed') and provide 'strong' or 'active' alternatives (e.g., 'Spearheaded', 'Orchestrated', 'Executed').

            RUBRIC:
            1. **atsScore**: (0-100) Be cold. Do not give a 'participation' score. If a resume is just 'okay', it's a 60, not an 80.
            2. **interviewProbability**: (0-100) Reflect the truth: in a pile of 500 resumes, would this specific one realistically get a call?
            
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
              "contentSuggestions": ["string"],
              "jobRoleSuggestions": ["string"]
              ${jobDescription ? ',\n              "jdMatchScore": number,\n              "jdInsights": ["string"],\n              "keywordGap": [{ "keyword": "string", "found": true/false }]' : ''}
            }

            Resume Text:
            ---
            ${resumeText}
            ---
            ${jobDescription ? `\n\n            Target Job Description (JD):\n            ---\n            ${jobDescription}\n            ---` : ''}
          `,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.4, 
      response_format: { type: "json_object" },
    });

    const aiResponse = completion.choices[0].message.content;
    const analysisResult = JSON.parse(aiResponse);

    // Guardrail: Fix rogue decimal probabilities
    if (analysisResult.interviewProbability > 0 && analysisResult.interviewProbability < 1) {
      analysisResult.interviewProbability = Math.round(analysisResult.interviewProbability * 100);
    }

    const originalName = req.file.originalname;

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
