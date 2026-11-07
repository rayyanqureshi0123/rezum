# Rezum — AI Resume Analyzer

An intelligent, MERN-stack resume analyzer powered by Google Generative AI and Groq. Rezum evaluates, scores, and provides actionable feedback on resumes to help candidates land their dream jobs.

<div align="center">
  <a href="https://rezum-mu.vercel.app"><strong>🌐 Live Demo (Vercel)</strong></a> | 
  <a href="https://rezum-backend.onrender.com"><strong>⚙️ Backend API (Render)</strong></a>
</div>

<br />

## ✨ Features
- **Advanced AI Analysis** — Parse and evaluate resumes using Google Generative AI and Groq for ATS scoring and skill gap analysis
- **Interactive Data Visualization** — Visual breakdowns of resume metrics and keyword matching using Recharts and Chart.js
- **Secure Authentication System** — Traditional Email/Password Auth alongside Google OAuth integration
- **Enterprise-Grade Rate Limiting** — Dedicated limiters for general APIs, auth routes, and expensive AI API calls
- **Robust Document Processing** — Extract text directly from PDFs and generate downloadable reports
- **Modern, Fluid UI** — Beautifully styled with TailwindCSS and animated using Framer Motion

## 🛠️ Tech Stack
| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, TailwindCSS, Framer Motion, Recharts |
| **Backend** | Node.js, Express.js, Google Generative AI, Groq SDK |
| **Database** | MongoDB (Mongoose) |
| **Storage/Upload** | Cloudinary, Multer |
| **Security** | Helmet, express-rate-limit, JWT, bcryptjs |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local instance or Atlas URI)
- API Keys for Google Gemini, Groq, and Cloudinary

### Backend
```bash
cd server
npm install
cp .env.example .env    # Fill in your keys
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

## 📁 Project Structure
```text
├── server/
│   ├── controllers/        # Route logic (Auth, Resume processing)
│   ├── middleware/         # Auth, file upload (Multer), Rate limiters
│   ├── models/             # Mongoose schemas (User, Resume)
│   ├── routes/             # REST API endpoint definitions
│   └── server.js           # Express app assembly
└── client/
    ├── src/
    │   ├── components/     # Reusable UI components & charts
    │   ├── pages/          # Application views (Dashboard, Analysis)
    │   └── ...
```

## 🔒 Environment Variables
**Required Keys (Backend):**
- `MONGO_URI`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GROQ_API_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLIENT_URL`

## 📄 License
MIT
