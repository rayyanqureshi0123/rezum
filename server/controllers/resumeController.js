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

    // FEATURE 3: PDF "Health" Check
    // If the PDF doesn't have enough text, it's likely a scan/image or corrupted.
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
          role: "user",
          content: `
            You are an expert ATS (Applicant Tracking System) simulator and elite tech recruiter. 
            Analyze the following resume text. Focus on these specific 7 features:

            1. **Overall AI Analysis**: Provide a high-level overview of the resume's quality.
            2. **Content Suggestions**: Give actionable advice to improve writing and phrasing.
            3. **Error Detector**: Catch typos, formatting issues, bad dates, and elements that might break an ATS.
            4. **Key Skill Identifier**: List both Technical and Soft skills found.
            5. **Job Role Suggestions**: Suggest 3-5 specific job titles the user should apply for based on their skills.
            6. **Missing Section Alert**: Detect if crucial sections like Contact, Experience, Skills, Education, or Projects are missing or poorly defined.
            7. **ATS Score**: An overall match score out of 100.

            Format the response strictly as a JSON object WITH NO MARKDOWN (just the JSON) with the following structure:
            {
              "atsScore": 85,
              "overallAnalysis": "string",
              "missingSections": ["string"],
              "errors": ["string"],
              "skills": { "technical": ["string"], "soft": ["string"] },
              "contentSuggestions": ["string"],
              "jobRoleSuggestions": ["string"]
            }
            
            Resume Text:
            ${resumeText}
          `,
        },
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });

    const aiResponse = completion.choices[0].message.content;
    const analysisResult = JSON.parse(aiResponse);

    // FEATURE 2: Privacy First Cleanup
    // We actively delete the raw PDF from Cloudinary after extraction so personal data isn't exposed online.
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });

    const newResume = await Resume.create({
      userId: req.user._id,
      fileUrl: "deleted-for-privacy", // Overwrite standard FileURL
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
