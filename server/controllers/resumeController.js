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
            ` : `
            Do NOT include "jdMatchScore" or "jdInsights" in the JSON output, as no job description was provided.`}

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
              ${jobDescription ? ',\n              "jdMatchScore": number,\n              "jdInsights": ["string"]' : ''}
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

    // FEATURE 2: Privacy First Cleanup
    // We actively delete the raw PDF from Cloudinary after extraction so personal data isn't exposed online.
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });

    const newResume = await Resume.create({
      userId: req.user._id,
      fileUrl: "deleted-for-privacy", // Overwrite standard FileURL
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
    
    await resume.deleteOne();
    res.json({ success: true, message: 'Resume analysis deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete resume', error: error.message });
  }
};
