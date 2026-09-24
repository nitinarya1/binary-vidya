# Binary Vidya - Technical Learning Platform

A full-stack, enterprise-grade educational platform built with Next.js 14, Node.js + Express, and MongoDB Atlas.

> 📖 **Complete System Architecture & Directory Map**: For an exhaustive breakdown of all 50+ API routes, pages, CRM workflows, database models, and components, see [WEBSITE_STRUCTURE.md](WEBSITE_STRUCTURE.md).

---

## 🚀 Features

- **Dual-Identifier Authentication**: Log in seamlessly via **Email** or **Mobile Number**.
- **Google Instant OAuth**: Direct Google Sign-In with active system profile discovery.
- **Transactional Password Recovery**: 6-digit OTP delivery directly to verified inboxes via Nodemailer with anti-spam optimization.
- **Modern Light Design System**: Clean, responsive light mode with rich blue shades.
- **Full-Stack Architecture**:
  - `frontend/`: Next.js 14 (App Router), TypeScript, Vanilla CSS Modules.
  - `backend/`: Express.js, TypeScript, Mongoose (MongoDB Atlas), Bcrypt, JWT.

---

## 📁 Repository Structure

```
├── backend/                  # Node.js + Express API server
│   ├── src/
│   │   ├── config/          # Database & Nodemailer config
│   │   ├── controllers/     # Authentication & user controllers
│   │   ├── middleware/      # JWT protection middleware
│   │   ├── models/          # User & Otp Mongoose models
│   │   └── routes/          # Express API route declarations
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # Next.js 14 Web Application
│   ├── src/
│   │   ├── app/             # App Router pages (Home, Login)
│   │   ├── components/      # Google Auth, OTP Modals, Providers
│   │   ├── context/         # AuthContext & state management
│   │   └── lib/             # API client helpers
│   ├── vercel.json          # Vercel deployment configuration
│   └── package.json
└── README.md
```

---

## 🛠️ Local Development Setup

### 1. Backend Setup
```bash
cd backend
npm install
# Configure your .env from .env.example
npm run dev
```
Backend API will start at `http://localhost:5000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
# Configure your .env.local from .env.example
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🌐 Deploying to Vercel

1. Import this repository into [Vercel](https://vercel.com/new).
2. Set **Root Directory** to `frontend`.
3. Framework preset will automatically detect **Next.js**.
4. Configure environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_API_URL`: Your deployed backend API URL.
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.
5. Click **Deploy**!
