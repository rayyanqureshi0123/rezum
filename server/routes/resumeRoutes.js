import express from 'express';
import { analyzeResume, getResumeHistory, deleteResume } from '../controllers/resumeController.js';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';

import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// Debug logs to verify keys (will only show first/last few chars for security)
console.log('Cloudinary Config Check:');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'Present' : 'Missing');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
  api_key: process.env.CLOUDINARY_API_KEY?.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'rezum_resumes',
    resource_type: 'raw',
    public_id: (req, file) => file.originalname.split('.')[0] + '_' + Date.now(),
  },
});

const upload = multer({ storage: storage });

router.post('/analyze', protect, upload.single('resume'), analyzeResume);
router.get('/history', protect, getResumeHistory);
router.delete('/:id', protect, deleteResume);

export default router;
