Rezum — AI Resume Analyzer

An AI-powered resume analyzer built with the MERN stack that evaluates resumes using Google Gemini AI and Groq. Upload a PDF resume to receive ATS scoring, skill-gap analysis, keyword optimization, and personalized suggestions through an intuitive dashboard.

---

✨ Features

- AI Resume Analysis — Analyze resumes using Google Gemini AI and Groq
- ATS Score & Feedback — Generate ATS scores with detailed improvement suggestions
- PDF Processing — Extract and analyze resume content from PDF files
- Skill Gap Detection — Identify missing skills based on job readiness
- Keyword Optimization — Improve ATS keyword matching
- Interactive Dashboard — Visualize resume insights with charts
- Authentication — Secure Email/Password and Google OAuth login
- Cloud Storage — Store uploaded resumes using Cloudinary
- **Modern UI — Responsive interface built with React, TailwindCSS, and Framer Motion

---

🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, TailwindCSS, Framer Motion, Recharts, Chart.js |
| Backend | Node.js, Express.js, Google Gemini AI, Groq SDK |
| Database | MongoDB, Mongoose |
| Authentication | JWT, Google OAuth, bcryptjs |
| File Storage | Cloudinary, Multer |
| Security | Helmet, Express Rate Limit |

---

 🚀 Quick Start

Prerequisites

- Node.js 18+
- MongoDB (Local or Atlas)
- Google Gemini API Key
- Groq API Key
- Cloudinary Account

 Backend

```bash
cd server
npm install
cp .env.example .env
npm run dev

```

### Frontend

```bash
cd client
npm install
npm run dev
```

---

## 📁 Project Structure

```text
Rezum/
├── client/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── pages/
│       ├── services/
│       └── App.jsx
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── server.js
│
├── README.md
└── package.json
```

---

## 🔒 Environment Variables

Create a `.env` file inside the **server** directory.

```env
PORT=

MONGO_URI=

JWT_SECRET=

GOOGLE_GEMINI_API_KEY=

GROQ_API_KEY=

CLOUDINARY_CLOUD_NAME=

CLOUDINARY_API_KEY=

CLOUDINARY_API_SECRET=
```

---

## 📄 License

MIT License
