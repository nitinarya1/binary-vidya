# Binary Vidya - Complete Website & System Architecture Document

> **Platform**: Binary Vidya Technical Learning & EduTech Platform  
> **Version**: 2.0 (Production Ready)  
> **Primary Stack**: Next.js 14 (App Router, Serverless Routes, TypeScript), Express.js Backend, MongoDB Atlas (Mongoose), Razorpay Payment Gateway, Nodemailer SMTP.  
> **Document Last Updated**: September 2026

---

## 📑 Table of Contents

1. [Executive Overview](#1-executive-overview)
2. [High-Level Architecture Diagram](#2-high-level-architecture-diagram)
3. [Complete Repository Directory Structure](#3-complete-repository-directory-structure)
4. [Frontend Application Structure (`frontend/src/app`)](#4-frontend-application-structure)
   - [Public Learner Pages](#41-public-learner-pages)
   - [Learning & Student Dashboard](#42-learning--student-dashboard)
   - [Super Admin Portal](#43-super-admin-portal)
   - [CRM & Sales Console](#44-crm--sales-console)
5. [Frontend Reusable Components (`frontend/src/components`)](#5-frontend-reusable-components)
6. [Frontend API Routes Layer (`frontend/src/app/api`)](#6-frontend-api-routes-layer)
7. [Backend Express API Architecture (`backend/src`)](#7-backend-express-api-architecture)
8. [Database Schemas & Data Models](#8-database-schemas--data-models)
9. [Authentication, Authorization & Role-Based Access Control (RBAC)](#9-authentication-authorization--rbac)
10. [Payment Flow (Razorpay)](#10-payment-flow-razorpay)
11. [Email & Notification Engine (Nodemailer)](#11-email--notification-engine-nodemailer)
12. [Environment Configuration Reference](#12-environment-configuration-reference)
13. [Deployment & Production Setup](#13-deployment--production-setup)

---

## 1. Executive Overview

**Binary Vidya** is a full-featured, enterprise-grade educational technology and sales platform designed for students, administrators, and sales/counseling teams. It provides an end-to-end ecosystem:

- **Students**: Browse curated tech courses, register/login with Email or Mobile Number, purchase courses via Razorpay with promotional coupons, watch interactive video lectures with playback speed/progress memory, and receive verifiable cryptographic completion certificates with QR verification.
- **Super Administrators**: Manage all courses, training & internship programs, career job postings, platform discount coupons, student enrollments, system users, and staff team assignments with granular permission toggles.
- **Sales & CRM Team (BDA / CSM / Lead Gen)**: Complete outbound/inbound sales management system with lead capture, lead claiming, call disposition logging, follow-up scheduling, today's callbacks reminders, performance leaderboards, and direct payment link generation.

---

## 2. High-Level Architecture Diagram

```
                                  ┌───────────────────────────┐
                                  │      Client Browsers      │
                                  │ (Mobile / Tablet / Desktop│
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
                         ┌─────────────────────────────────────────────┐
                         │              Next.js 14 Frontend            │
                         │    (React 18, App Router, SSR, CSS Modules)  │
                         └──────┬───────────────────────────────┬──────┘
                                │                               │
                     (Client / SSR Requests)             (Server Actions / Proxies)
                                │                               │
                                ▼                               ▼
┌──────────────────────────────────────────────┐ ┌──────────────────────────────────────────────┐
│       Next.js Serverless API Routes          │ │       Standalone Express API Backend         │
│         (`frontend/src/app/api/*`)           │ │              (`backend/src/*`)               │
└──────────────────────┬───────────────────────┘ └──────────────────────┬───────────────────────┘
                       │                                                │
                       ├──────────────────────┬─────────────────────────┤
                       │                      │                         │
                       ▼                      ▼                         ▼
            ┌────────────────────┐ ┌────────────────────┐   ┌───────────────────────┐
            │   MongoDB Atlas    │ │  Razorpay Payment  │   │     Gmail SMTP Pool   │
            │  (Database Engine) │ │  (Orders & Verify) │   │ (Transactional Mails) │
            └────────────────────┘ └────────────────────┘   └───────────────────────┘
```

---

## 3. Complete Repository Directory Structure

```
d:\binary vidya\
├── README.md                      # Project introduction and quick-start guide
├── WEBSITE_STRUCTURE.md           # Master system & architecture specification
├── vercel.json                    # Vercel deployment root routing configuration
├── run-dev.bat                    # Windows batch script to launch frontend and backend
│
├── frontend/                      # Next.js 14 Frontend Application
│   ├── next.config.js             # Next.js configuration (images, rewrites, headers)
│   ├── package.json               # Frontend dependencies and scripts
│   ├── tsconfig.json              # TypeScript compilation configuration
│   ├── public/                    # Static assets (logos, icons, illustrations)
│   │   ├── favicon.ico
│   │   ├── images/
│   │   └── ...
│   └── src/
│       ├── app/                   # App Router pages and API routes
│       │   ├── layout.tsx         # Root HTML layout with AuthProvider & Toast
│       │   ├── page.tsx           # Home / Landing Page
│       │   ├── globals.css        # Global CSS design tokens and variables
│       │   ├── home.module.css    # Landing page styles
│       │   ├── robots.ts          # Search engine indexing configuration
│       │   ├── sitemap.ts         # Dynamic XML sitemap generator
│       │   │
│       │   ├── (crm)/             # CRM Route Group
│       │   │   └── crm/
│       │   │       ├── leads/     # CRM Leads management
│       │   │       └── leaderboard/ # CRM Sales Leaderboard
│       │   │
│       │   ├── admin/             # General Admin dashboard
│       │   ├── careers/           # Careers & job openings page
│       │   ├── certificates/      # Certificate public dynamic route
│       │   ├── courses/           # Course catalog & Course detail
│       │   ├── get-counselling/   # Lead capture counselling page
│       │   ├── login/             # Unified student / staff login page
│       │   ├── my-learning/       # Student dashboard & lecture video player
│       │   ├── profile/           # User profile & credentials manager
│       │   ├── sales/             # CRM & Sales console pages
│       │   ├── super-admin/       # Super Admin master dashboard
│       │   ├── training-and-internship/ # Internship programs & checkout
│       │   ├── verify-certificate/ # Certificate validation lookup
│       │   │
│       │   └── api/               # Next.js Serverless API Endpoints (50+ routes)
│       │       ├── admin/         # Super Admin CRUD endpoints
│       │       ├── auth/          # Authentication & verification endpoints
│       │       ├── careers/       # Careers public and apply endpoints
│       │       ├── certificates/  # Certificate verification and issuing
│       │       ├── coupons/       # Promo coupon validation & listing
│       │       ├── courses/       # Course catalog & slug queries
│       │       ├── crm/           # CRM auth, leads, stats, team
│       │       ├── enrollments/   # Student progress & enrollments
│       │       ├── payment/       # Razorpay orders and verification
│       │       ├── public/        # Public lead intake
│       │       └── training-internship/ # Training application endpoints
│       │
│       ├── components/            # Reusable UI Components
│       │   ├── AuthModal.tsx      # Sign in / Sign up popup modal
│       │   ├── ClientProviders.tsx # Context & notification wrapper
│       │   ├── ConfirmNameModal.tsx # Certificate name confirmation modal
│       │   ├── CouponAdminModal.tsx # Super Admin coupon creation modal
│       │   ├── CouponModal.tsx    # Checkout coupon selection modal
│       │   ├── ForgotPasswordModal.tsx # OTP-based password recovery modal
│       │   ├── GoogleLoginBtn.tsx # Google OAuth button component
│       │   ├── PaymentModal.tsx   # Razorpay checkout wrapper modal
│       │   ├── VideoPlayer.tsx    # Custom HTML5/YouTube responsive player
│       │   └── crm/               # CRM Specific UI Components
│       │       ├── BulkActionBar.tsx
│       │       ├── CallbacksBadgeTab.tsx
│       │       ├── ClaimOrReassignCell.tsx
│       │       ├── CrmSidebar.tsx
│       │       ├── DispositionModal.tsx
│       │       ├── FollowUpSchedulerModal.tsx
│       │       ├── LeadActivityDrawer.tsx
│       │       ├── LeadFormModal.tsx
│       │       ├── LeaderboardStats.tsx
│       │       ├── SendLinkModal.tsx
│       │       └── TemperatureBadge.tsx
│       │
│       ├── context/               # React Context Providers
│       │   ├── AuthContext.tsx    # User session, JWT token, login/logout
│       │   └── CrmContext.tsx     # CRM agent session, role, active leads
│       │
│       └── lib/                   # Shared Frontend Utilities & Core Logic
│           ├── api.ts             # Axios/fetch API helper with interceptors
│           ├── auth-helpers.ts    # Token storage and role verification
│           ├── coupon-helpers.ts  # Price discount calculation algorithms
│           ├── db.ts              # Mongoose cached connection with pooling
│           ├── imageCompressor.ts # Client-side image compression
│           ├── models.ts          # Frontend Mongoose schemas and models
│           ├── serverMailer.ts    # Nodemailer pooled transporter (Frontend)
│           └── trainingProgramData.ts # Static catalog of training programs
│
├── backend/                       # Standalone Node.js + Express API Server
│   ├── package.json               # Backend dependencies
│   ├── tsconfig.json              # TypeScript configuration
│   └── src/
│       ├── app.ts                 # Express app initialization & middleware
│       ├── server.ts              # Server startup & DB connection listener
│       ├── assets/                # Logos & image attachments for emails
│       ├── config/
│       │   ├── db.ts              # MongoDB Atlas connection with pool settings
│       │   └── mailer.ts          # Pooled SMTP Nodemailer configuration
│       ├── controllers/           # Business Logic Handlers
│       │   ├── auth.controller.ts # Login, Register, Google, OTP, Profile
│       │   ├── certificate.controller.ts # Issue & verify certificates
│       │   ├── coupon.controller.ts # Coupon CRUD & apply
│       │   ├── course.controller.ts # Course management
│       │   ├── crm.controller.ts  # CRM leads, team, stats, disposition
│       │   ├── enrollment.controller.ts # Enrollments & video progress
│       │   ├── payment.controller.ts # Razorpay order creation & signature verify
│       │   └── training.controller.ts # Training applications & status
│       ├── middleware/
│       │   └── auth.middleware.ts # JWT verification & role authorization
│       ├── models/                # Mongoose Database Models
│       │   ├── Certificate.ts     # Certificate schema
│       │   ├── Coupon.ts          # Coupon discount schema
│       │   ├── Course.ts          # Course & syllabus schema
│       │   ├── Enrollment.ts      # Student enrolled courses schema
│       │   ├── Lead.ts            # Sales lead & disposition schema
│       │   ├── Order.ts           # Payment order schema
│       │   ├── Otp.ts             # 6-digit OTP verification schema (TTL)
│       │   └── User.ts            # User & staff accounts schema
│       ├── routes/                # Express API Route Declarations
│       │   ├── auth.routes.ts
│       │   ├── certificate.routes.ts
│       │   ├── coupon.routes.ts
│       │   ├── course.routes.ts
│       │   ├── crm.routes.ts
│       │   ├── enrollment.routes.ts
│       │   ├── payment.routes.ts
│       │   ├── training.routes.ts
│       │   └── upload.routes.ts
│       └── utils/
│           └── phone.ts           # Mobile number normalization helper
│
└── scripts/                       # Maintenance & Automation Scripts
    ├── send-welcome-emails.js     # Batch welcome email sender
    └── set-superadmin-password.js # Emergency Super Admin password reset
```

---

## 4. Frontend Application Structure

The Next.js 14 App Router organizes the application into distinct functional zones:

### 4.1 Public Learner Pages

| Route | File Path | Description |
|---|---|---|
| `/` | `src/app/page.tsx` | Landing page featuring top hero, statistics counter, popular courses, learning journey, testimonials, FAQ, and lead consultation form. |
| `/courses` | `src/app/courses/page.tsx` | Course directory with search bar, domain filter tags (Web Dev, AI, Cloud), price tags, and direct links to syllabus details. |
| `/courses/[slug]` | `src/app/courses/[slug]/page.tsx` | Dynamic course detail page showing complete syllabus modules, instructor profile, course features, and "Enroll Now" CTA. |
| `/courses/[slug]/checkout` | `src/app/courses/[slug]/checkout/page.tsx` | Course checkout page integrating Razorpay modal, coupon discount engine, and invoice summary. |
| `/training-and-internship` | `src/app/training-and-internship/page.tsx` | Flagship industrial training & internship programs page with curriculum details, projects list, and application flow. |
| `/training-and-internship/checkout` | `src/app/training-and-internship/checkout/page.tsx` | Training program checkout with payment gateway and immediate seat reservation. |
| `/careers` | `src/app/careers/page.tsx` | Career recruitment page displaying open job roles at Binary Vidya with application submission form. |
| `/get-counselling` | `src/app/get-counselling/page.tsx` | Lead capture page where prospective students request free educational guidance from counselors. |
| `/verify-certificate` | `src/app/verify-certificate/page.tsx` | Public certificate authentication portal. Enter Certificate ID or student roll number to view authenticity. |
| `/certificates/[certificateId]` | `src/app/certificates/[certificateId]/page.tsx` | Official verified certificate page with security watermark, student name, course name, issue date, and PDF download. |
| `/login` | `src/app/login/page.tsx` | Unified login & registration page supporting Email or Phone login, Google Instant Sign-In, and Forgot Password OTP. |

### 4.2 Learning & Student Dashboard

| Route | File Path | Description |
|---|---|---|
| `/my-learning` | `src/app/my-learning/page.tsx` | Enrolled student hub displaying all purchased courses, real-time completion percentages, resume video button, and direct certificate claim. |
| `/profile` | `src/app/profile/page.tsx` | Account management page allowing students to update their name, avatar, phone number, and review earned certificates. |

### 4.3 Super Admin Portal

| Route | File Path | Description |
|---|---|---|
| `/super-admin` | `src/app/super-admin/page.tsx` | **Master Control Center**: <br>• **Analytics**: Gross revenue, enrolled learners, active courses, conversion rates.<br>• **Course Management**: Add/edit/delete courses, chapters, video links, pricing.<br>• **Internship Programs**: Manage industrial internship batches and curriculum.<br>• **User Management**: View all registered users, roles, and status.<br>• **Team Management**: Invite staff members (BDA, CSM, Lead Gen), generate login credentials, set custom permissions.<br>• **Coupons**: Create flat/percent promo codes with expiry dates and usage limits.<br>• **Careers**: Post open vacancies and view applicant submissions. |
| `/admin` | `src/app/admin/page.tsx` | Role-restricted admin view for course creators and instructors. |

### 4.4 CRM & Sales Console

| Route | File Path | Description |
|---|---|---|
| `/sales/login` | `src/app/sales/login/page.tsx` | Dedicated Sales login interface supporting password sign-in or instant 6-digit OTP sent to registered agent email. |
| `/sales` | `src/app/sales/page.tsx` | Sales representative cockpit with daily targets, assigned leads count, conversion percentage, and quick dialer buttons. |
| `/sales/leads` | `src/app/sales/leads/page.tsx` | Interactive leads table with stage filters (New, Contacted, Interested, Callback, Won, Lost), lead temperature badges (Hot, Warm, Cold), and bulk reassign. |
| `/sales/generate` | `src/app/sales/generate/page.tsx` | Manual lead generation form for outbound outreach and counseling walk-ins. |
| `/sales/team` | `src/app/sales/team/page.tsx` | Sales team hierarchy view showing agents across BDA, CSM, and Lead Gen departments. |
| `/sales/leaderboard` | `src/app/sales/leaderboard/page.tsx` | Gamified sales performance board ranking agents by revenue closed and admissions converted. |

---

## 5. Frontend Reusable Components

Located in `frontend/src/components/`:

### Core Components
- **`AuthModal.tsx`**: Lightweight modal for logging in or signing up without leaving the current course page.
- **`ClientProviders.tsx`**: Wraps the root layout with `AuthProvider`, `CrmProvider`, and toaster notifications.
- **`ConfirmNameModal.tsx`**: Prompts students to confirm their official name spelling before generating a non-modifiable certificate.
- **`CouponModal.tsx`**: Modal for students to browse and apply promo codes during checkout.
- **`CouponAdminModal.tsx`**: Super Admin modal for creating, configuring, and toggling discount codes.
- **`ForgotPasswordModal.tsx`**: 3-step modal (Send OTP -> Verify 6-digit code -> Enter new password).
- **`GoogleLoginBtn.tsx`**: One-click Google Sign-In button utilizing Google Identity Services (GIS).
- **`PaymentModal.tsx`**: Bridges the checkout UI with Razorpay Checkout.js client library.
- **`VideoPlayer.tsx`**: Feature-rich HTML5/YouTube video player with:
  - Playback speed selection (0.75x, 1x, 1.25x, 1.5x, 2x)
  - Auto-resume playback from last saved timestamp
  - Auto-mark video completion when reaching 90% duration
  - Custom brand controls and theater mode

### CRM Specialized Components (`frontend/src/components/crm/`)
- **`BulkActionBar.tsx`**: Floating action bar when multiple leads are selected (Bulk Status Change, Bulk Delete, Bulk Reassign).
- **`CallbacksBadgeTab.tsx`**: Live pill counter displaying callbacks scheduled for today.
- **`ClaimOrReassignCell.tsx`**: Table action to instantly claim an unassigned lead or transfer to a peer.
- **`CrmSidebar.tsx`**: Persistent dark-navigation sidebar with active route indicator.
- **`DispositionModal.tsx`**: Post-call logger for recording outcome (Interested, Busy, Wrong Number, Not Interested) and internal remarks.
- **`FollowUpSchedulerModal.tsx`**: Date & time picker to schedule a reminder callback.
- **`LeadActivityDrawer.tsx`**: Slide-out drawer showing complete timeline history of all calls, notes, and status changes for a lead.
- **`LeadFormModal.tsx`**: Modal for creating or editing lead contact details and course interests.
- **`LeaderboardStats.tsx`**: Visual bar charts and trophies for top sales performers.
- **`SendLinkModal.tsx`**: Generates and emails a direct Razorpay payment link with embedded coupon code to the prospect.
- **`TemperatureBadge.tsx`**: Visual priority indicators (`HOT` - Red, `WARM` - Orange, `COLD` - Blue).

---

## 6. Frontend API Routes Layer

Located in `frontend/src/app/api/`:

```
frontend/src/app/api/
├── admin/
│   ├── careers/               # GET all applicants, POST new job posting, DELETE posting
│   ├── coupons/               # GET all coupons, POST new coupon, DELETE coupon
│   ├── courses/               # POST create course, PUT edit course, DELETE course
│   ├── team/                  # GET staff members, POST invite team member, PUT permissions
│   ├── training-internships/  # CRUD operations for training programs
│   └── users/                 # GET paginated users list, PUT update user status/role
│
├── auth/
│   ├── change-first-password/ # Enforce password update on first staff login
│   ├── check-email/           # Instant validation if email is already registered
│   ├── forgot-password/
│   │   ├── reset/             # Reset password with verified OTP token
│   │   ├── send-otp/          # Send 6-digit recovery OTP to email
│   │   └── verify-otp/        # Validate OTP without consuming it
│   ├── google/                # Exchange Google OAuth credential for session JWT
│   ├── login/                 # Primary login handler (supports Email, Phone, Password)
│   ├── login/verify-otp/      # Verify 2FA OTP for staff / admin logins
│   ├── me/                    # Retrieve current authenticated user profile
│   ├── profile/               # Update user name, phone, bio, avatar
│   ├── register/              # Create new student account
│   └── system-google-accounts/# Detect active local Google accounts for 1-click login
│
├── careers/                   # Public career listings & applicant resume submission
├── certificates/
│   ├── [id]/                  # Public API to fetch verified certificate metadata
│   └── issue/                 # Auto-generate unique certificate on 100% course completion
├── coupons/
│   ├── available/             # List active promo codes visible to learners
│   └── validate/              # Validate code against course ID and return discount amount
├── courses/
│   ├── route.ts               # GET all public published courses
│   └── [slug]/                # GET single course detail by URL slug
│
├── crm/
│   ├── auth/
│   │   ├── login/             # Agent email + password login
│   │   ├── me/                # Verify agent session cookie
│   │   ├── send-otp/          # Send passwordless 6-digit OTP to agent's email
│   │   └── verify-otp/        # Verify agent OTP and set secure httpOnly cookie
│   ├── dashboard/             # Aggregated stats (total leads, contacted, today's closures)
│   ├── leads/
│   │   ├── route.ts           # GET filtered leads, POST new lead
│   │   ├── bulk-assign/       # Bulk assign leads to a specific agent
│   │   ├── bulk-delete/       # Bulk archive/delete leads
│   │   ├── bulk-status/       # Bulk update lead status
│   │   ├── callbacks-today/   # Fetch all leads with follow-up scheduled today
│   │   └── [leadId]/
│   │       ├── route.ts       # GET, PUT, DELETE single lead
│   │       ├── claim/         # Claim an unassigned lead for current agent
│   │       ├── disposition/   # Log call disposition note and update stage
│   │       ├── history/       # Fetch audit timeline of notes and updates
│   │       ├── reassign/      # Transfer lead to another agent
│   │       ├── send-link/     # Send direct payment checkout link to lead
│   │       └── status/        # Update lead temperature and status
│   ├── stats/leaderboard/     # Sales leaderboard ranking by conversions and revenue
│   └── team/
│       ├── route.ts           # List all team members by department (BDA, CSM, Lead Gen)
│       └── [agentId]/         # Update or suspend specific agent
│
├── enrollments/
│   ├── my-learning/           # List all courses enrolled by the authenticated user
│   └── update-progress/       # Save last watched lecture video timestamp and progress
├── payment/
│   ├── create-order/          # Initialize Razorpay order with course price & discount
│   └── verify/                # Cryptographically verify Razorpay signature and enroll user
├── public/leads/              # Ingest leads submitted from website contact forms
└── training-internship/       # Fetch industrial training programs and submit applications
```

---

## 7. Backend Express API Architecture

Located in `backend/src/`:

- **`server.ts`**: Entry point that connects to MongoDB Atlas via connection pool and listens on `PORT` (default 5000).
- **`app.ts`**: Configures Express middleware:
  - `cors`: Cross-Origin Resource Sharing with allowed origins.
  - `helmet`: Security headers.
  - `express.json()` & `express.urlencoded()`: Body parsing.
  - Rate limiting to protect authentication routes against brute-force attacks.
- **`config/db.ts`**: Mongoose connection configured with:
  - `maxPoolSize: 10`
  - `minPoolSize: 2`
  - `family: 4` (IPv4 enforcement for minimal DNS latency)
- **`config/mailer.ts`**: Nodemailer transporter with connection pooling (`pool: true`, `maxConnections: 3`) and anti-spam deliverability-optimized templates.
- **`middleware/auth.middleware.ts`**:
  - `protect`: Extracts Bearer token from header or cookie, verifies JWT, and attaches user document to `req.user`.
  - `authorizeRoles`: Restricts route access to specified roles (`admin`, `instructor`, etc.).

---

## 8. Database Schemas & Data Models

### 8.1 User Model (`User.ts`)
| Field | Type | Attributes | Description |
|---|---|---|---|
| `name` | String | Required, Trim | Full name of the user |
| `email` | String | Unique, Sparse, Indexed, Lowercase | User email address |
| `phone` | String | Unique, Sparse, Indexed | 10-digit mobile number |
| `password` | String | Select: false | Bcrypt hashed password |
| `avatar` | String | Default: '' | Profile image URL |
| `role` | String | Enum: `student`, `instructor`, `admin` | Platform authorization role |
| `authProvider` | String | Enum: `local`, `google` | Sign-in method |
| `isVerified` | Boolean | Default: false | Email verification status |
| `isTeamMember` | Boolean | Default: false | Staff / CRM access indicator |
| `department` | String | Optional | Department (e.g. `BDA`, `CSM`, `Lead Generation`) |
| `salesTeam` | String | Optional | Exact assigned sales division |
| `permissions` | Object | Nested Booleans | `manageCourses`, `manageTraining`, `manageCareers`, `viewAnalytics`, `manageCertificates`, `manageTeam` |
| `teamStatus` | String | Enum: `active`, `suspended` | Staff account status |
| `mustChangePassword` | Boolean | Default: false | Forces password change on initial login |

### 8.2 Course Model (`Course.ts`)
| Field | Type | Attributes | Description |
|---|---|---|---|
| `title` | String | Required, Trim | Course display title |
| `slug` | String | Required, Unique, Indexed | URL-friendly slug identifier |
| `description` | String | Required | Full course overview |
| `category` | String | Required, Indexed | Domain (e.g., `Web Development`, `Cybersecurity`) |
| `price` | Number | Required | Original base price in INR |
| `discountPrice` | Number | Optional | Discounted promotional price |
| `thumbnail` | String | Required | Course card cover image URL |
| `instructor` | Schema.Types.ObjectId | Ref: `User` | Assigned course creator |
| `modules` | Array | Nested Schema | List of chapters, each containing lecture videos, duration, and resources |
| `isPublished` | Boolean | Default: false, Indexed | Visibility toggle |

### 8.3 Lead Model (`Lead.ts` - CRM Engine)
| Field | Type | Attributes | Description |
|---|---|---|---|
| `name` | String | Required, Trim | Prospect's name |
| `email` | String | Indexed | Prospect's email |
| `phone` | String | Required, Indexed | Prospect's contact number |
| `course` | String | Optional | Course or training program of interest |
| `source` | String | Default: `Website Form` | Inflow source (Facebook, Google Ads, Organic, Walk-in) |
| `status` | String | Indexed | `New`, `Contacted`, `Interested`, `Callback`, `Enrolled`, `Closed - Lost` |
| `temperature` | String | Enum: `HOT`, `WARM`, `COLD` | Lead conversion likelihood |
| `assignedTo` | Schema.Types.ObjectId | Ref: `User`, Indexed | Sales agent currently handling this lead |
| `followUpDate` | Date | Indexed | Scheduled callback date and time |
| `notes` | Array of Objects | Timestamps, Agent | Audit log of counseling notes and call dispositions |

### 8.4 Certificate Model (`Certificate.ts`)
| Field | Type | Attributes | Description |
|---|---|---|---|
| `certificateId` | String | Required, Unique, Indexed | Unique code (e.g., `BV-2026-XXXXX`) |
| `userId` | Schema.Types.ObjectId | Ref: `User`, Indexed | Learner who earned the credential |
| `courseId` | Schema.Types.ObjectId | Ref: `Course`, Indexed | Course completed |
| `studentName` | String | Required | Name as confirmed for official print |
| `courseName` | String | Required | Official title of completed course |
| `issueDate` | Date | Default: `Date.now` | Date of completion |
| `verificationUrl`| String | Required | URL to public certificate authenticity page |

### 8.5 Otp Model (`Otp.ts`)
| Field | Type | Attributes | Description |
|---|---|---|---|
| `email` | String | Sparse, Indexed | Recipient email |
| `phone` | String | Sparse, Indexed | Recipient phone |
| `otp` | String | Required | 6-digit numeric verification code |
| `purpose` | String | Enum | `FORGOT_PASSWORD`, `EMAIL_VERIFICATION`, `SUPER_ADMIN_LOGIN`, `ADMIN_LOGIN`, `CRM_AGENT_LOGIN` |
| `expiresAt` | Date | Required, TTL Index (`expires: 0`) | Automatically deleted by MongoDB after 10 minutes |

### 8.6 Coupon Model (`Coupon.ts`)
| Field | Type | Attributes | Description |
|---|---|---|---|
| `code` | String | Required, Unique, Uppercase | Coupon code (e.g., `BINARY50`, `WELCOME100`) |
| `discountType` | String | Enum: `percentage`, `fixed` | Percentage off or flat rupee discount |
| `discountValue`| Number | Required | Discount percentage or amount |
| `minPurchase` | Number | Default: 0 | Minimum cart value required to apply |
| `maxDiscount` | Number | Optional | Maximum discount cap for percentage codes |
| `expiryDate` | Date | Required | Expiration timestamp |
| `usageLimit` | Number | Optional | Total times this coupon can be redeemed |
| `usedCount` | Number | Default: 0 | Counter of successful redemptions |
| `isActive` | Boolean | Default: true | Admin on/off toggle |

---

## 9. Authentication, Authorization & RBAC

Binary Vidya implements an enterprise multi-tier identity architecture:

```
                          ┌───────────────────────────┐
                          │   Login Request Received  │
                          └─────────────┬─────────────┘
                                        │
                         Identifier contains '@' symbol?
                                ├── Yes ──► Lookup by email (Indexed)
                                └── No  ──► Normalize to 10 digits & lookup by phone (Indexed)
                                        │
                                        ▼
                                 User Discovered?
                                ├── No  ──► Return 401 Invalid Credentials
                                └── Yes ──► Check Bcrypt Hash Match
                                        │
                         ┌──────────────┴──────────────┐
                         ▼                             ▼
                  Standard Student             Staff / Admin Member
                         │                             │
               Generate Standard JWT                   │
                         │                   Generate 6-digit OTP
                         │                             │
                         │                   Send OTP via Nodemailer
                         │                             │
                         ▼                             ▼
              Redirect to /my-learning      Prompt for 6-Digit OTP Modal
                                                       │
                                            Verify OTP & Issue Admin JWT
                                                       │
                                                       ▼
                                            Redirect to /super-admin or /sales
```

### Role Permissions Matrix:

| Feature / Page | Student | Instructor | BDA / CSM Agent | Super Admin |
|---|:---:|:---:|:---:|:---:|
| Browse Courses & Checkout | ✅ | ✅ | ✅ | ✅ |
| Watch Enrolled Lectures | ✅ | ✅ | ✅ | ✅ |
| Earn Certificates | ✅ | ✅ | ❌ | ✅ |
| Access Sales Console (`/sales`) | ❌ | ❌ | ✅ | ✅ |
| Claim & Dispose Leads | ❌ | ❌ | ✅ | ✅ |
| Send Payment Links | ❌ | ❌ | ✅ | ✅ |
| Course Management | ❌ | ✅ | ❌ | ✅ |
| Super Admin Portal (`/super-admin`)| ❌ | ❌ | ❌ | ✅ |
| Manage Team & Permissions | ❌ | ❌ | ❌ | ✅ |
| Coupon Generation | ❌ | ❌ | ❌ | ✅ |

---

## 10. Payment Flow (Razorpay)

Binary Vidya uses official Razorpay APIs for PCI-DSS compliant transactions:

```
[Student on Checkout Page]
        │
        ├── 1. Click "Proceed to Payment"
        ▼
[POST /api/payment/create-order]
        │
        ├── 2. Validate course price in database (never trust client price)
        ├── 3. Apply validated coupon discount (if any)
        ├── 4. Call Razorpay API: `razorpay.orders.create({ amount, currency: 'INR', receipt })`
        ├── 5. Save pending `Order` record in MongoDB
        ▼
[Return { orderId, amount, currency, key } to Client]
        │
        ├── 6. Open Razorpay Checkout modal in browser
        ├── 7. Student completes payment (UPI / Card / Netbanking)
        ▼
[Razorpay returns { razorpay_order_id, razorpay_payment_id, razorpay_signature }]
        │
        ├── 8. Client sends credentials to [POST /api/payment/verify]
        ▼
[Cryptographic Signature Verification]
        │
        ├── 9. Compute HMAC-SHA256(order_id + "|" + payment_id, RAZORPAY_KEY_SECRET)
        ├── 10. Compare computed digest with razorpay_signature
        ├── 11. If match:
        │       ├── Update Order status to 'paid'
        │       ├── Create Enrollment document for user + course
        │       └── Send confirmation email with receipt
        ▼
[Return success -> Redirect to /my-learning]
```

---

## 11. Email & Notification Engine (Nodemailer)

The mailing engine is optimized for high deliverability and zero blocking latency:

- **SMTP Connection Pooling**: `pool: true` with `maxConnections: 3` keeps TCP sockets warm to Google SMTP servers, eliminating the 2–5 second TLS handshake on individual emails.
- **Fire-and-Forget Architecture**: OTP generation and lead notification routes save data to MongoDB and reply to the HTTP request in **<80ms**, while the email transmits in the background.
- **Anti-Spam Deliverability**: Templates are crafted with a high text-to-code ratio, inline CSS, CAN-SPAM compliant footers with physical headquarters addresses, and absence of external spam-triggering links.

---

## 12. Environment Configuration Reference

### Frontend Configuration (`frontend/.env.local`):
```env
# MongoDB Connection
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/binaryvidya?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_2025_987654321

# Razorpay Payment Gateway
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx

# Google OAuth 2.0
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx

# Nodemailer SMTP Configuration
EMAIL_USER=binaryvidyaadmin@gmail.com
EMAIL_PASS=your_16_char_google_app_password

# Application URLs
NEXT_PUBLIC_APP_URL=https://binaryvidya.vercel.app
NEXT_PUBLIC_API_URL=https://binaryvidya.vercel.app/api
```

### Backend Configuration (`backend/.env`):
```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/binaryvidya?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_2024
EMAIL_USER=binaryvidyaadmin@gmail.com
EMAIL_PASS=your_16_char_google_app_password
FRONTEND_URL=https://binaryvidya.vercel.app
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
```

---

## 13. Deployment & Production Setup

### Frontend Deployment (Vercel):
1. Connect GitHub repository to Vercel.
2. Set **Root Directory** to `frontend`.
3. Vercel automatically detects Next.js 14.
4. Input Environment Variables under **Settings > Environment Variables**.
5. Deploy.

### Backend Deployment (VPS / Railway / Render):
1. Navigate to `/backend`.
2. Run `npm install` followed by `npm run build`.
3. Start production daemon: `npm start` (or managed via PM2: `pm2 start dist/server.js --name "bv-backend"`).

---

*Document compiled and maintained by the Binary Vidya Engineering Team.*
