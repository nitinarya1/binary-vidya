import { Request, Response } from 'express';

export const FRONTEND_INTERNSHIP_PROGRAM = {
  id: 'frontend-developer-training-internship',
  slug: 'frontend-developer-training-internship',
  title: 'Frontend Developer Training & 2-Month Internship',
  subtitle: 'Master Modern Web Development, Build Production Projects, and Complete a 2-Month Industrial Internship with 4 Verified Credentials',
  track: 'Frontend Developer',
  mode: 'Live Online • Weekend Classes',
  schedule: {
    badge: 'Weekend Live Batches',
    days: 'Every Saturday & Sunday',
    timings: 'Live Interactive Sessions + 24/7 Session Recordings',
    flexibility: 'Specially crafted for College Students & Working Professionals',
  },
  duration: {
    total: '2 Months Internship + Training',
    trainingWeeks: '4 Weeks Intensive Live Training',
    internshipWeeks: '2 Months Hands-on Industrial Internship',
  },
  pricing: {
    trainingPrice: 2400,
    originalPrice: 7999,
    discountPercentage: 70,
    internshipPrice: 0,
    internshipStatusText: '100% Free of Cost (Bundled with Training)',
    currency: 'INR',
    currencySymbol: '₹',
  },
  sections: [
    {
      id: 'section-1-training',
      number: 1,
      title: 'Section 1: Intensive Frontend Engineering Training',
      tagline: 'From Foundational Web Standards to Modern React 18+ & Next.js 14 Production Architectures',
      description: 'Comprehensive, mentor-led weekend live classes with hands-on code walkthroughs, assignments, and algorithmic thinking.',
      modules: [
        {
          moduleNumber: '1.1',
          title: 'Semantic HTML5, Modern CSS3 & Responsive Architecture',
          topics: [
            'HTML5 semantic markup, accessible forms, ARIA standards & SEO optimization',
            'Advanced CSS layouts: Flexbox, CSS Grid systems, auto-fit/auto-fill responsive designs',
            'CSS Variables, Glassmorphism design systems, transitions & keyframe micro-animations',
            'CSS Modules, BEM naming conventions, and mobile-first media queries',
          ],
        },
        {
          moduleNumber: '1.2',
          title: 'Modern JavaScript (ES6+) & Asynchronous Mastery',
          topics: [
            'Closures, lexical scoping, hoisting, arrow functions, and destructuring',
            'Asynchronous paradigms: Event Loop, Microtasks queue, Promises, Async/Await',
            'Working with REST APIs, fetch API, handling errors, and JSON transformations',
            'DOM manipulation, event delegation, debounce/throttle techniques, and performance',
          ],
        },
        {
          moduleNumber: '1.3',
          title: 'TypeScript for Scalable Frontend Systems',
          topics: [
            'Strict typing, primitive types, type inference, and union/intersection types',
            'Interfaces, type aliases, generic components, and type guards',
            'Typing React components, event handlers, props, and API response structures',
          ],
        },
        {
          moduleNumber: '1.4',
          title: 'React 18+ Deep Dive & State Architecture',
          topics: [
            'Virtual DOM, reconciliation algorithm, and functional component paradigms',
            'Core Hooks mastery: useState, useEffect, useRef, useMemo, useCallback',
            'Custom Hooks design patterns for reusable business logic',
            'Global state management with Context API and modern reducer patterns',
          ],
        },
        {
          moduleNumber: '1.5',
          title: 'Next.js 14 App Router & Full-Stack Capabilities',
          topics: [
            'App Router architecture: layouts, page routes, loading states, and error boundaries',
            'React Server Components (RSC) vs Client Components: when & how to use them',
            'Data fetching strategies: Server-side rendering (SSR), Static Generation (SSG), dynamic routes',
            'API Route handlers, secure cookie auth handling, and performance optimization (Core Web Vitals)',
          ],
        },
        {
          moduleNumber: '1.6',
          title: 'Developer Tooling, Git & Deployment Pipelines',
          topics: [
            'Git version control, feature branches, pull requests, and merge conflict resolution',
            'Linting with ESLint, code formatting with Prettier, and package management',
            'Continuous deployment to Vercel, custom domain setup, and environment variables',
          ],
        },
      ],
    },
    {
      id: 'section-2-minor-project',
      number: 2,
      title: 'Section 2: Production Minor Project',
      tagline: 'Modern SaaS Analytics Dashboard & Design System Kit',
      description: 'Build and deploy a modular, interactive web application showcasing reusable UI components, real-time analytics graphs, and customizable design themes.',
      projectOverview: {
        name: 'SaaS Pulse - Modern Analytics & Productivity Dashboard',
        type: 'Individual Capstone Minor Project',
        stack: ['React', 'Next.js', 'TypeScript', 'CSS Modules', 'Recharts / Chart.js', 'Lucide Icons'],
        deliverables: [
          'Interactive analytics dashboard with dynamic metrics (revenue, traffic, user conversion)',
          'Light & Dark theme switcher with persistent local storage state',
          'Searchable and filterable data tables with client-side sorting and pagination',
          'Responsive collapsible navigation drawer with active route highlighting',
          'Production build deployed to Vercel with clean GitHub documentation',
        ],
        mentorship: 'Weekly code review and grading by senior frontend mentors during weekend sessions.',
      },
    },
    {
      id: 'section-3-major-project',
      number: 3,
      title: 'Section 3: Enterprise Major Project',
      tagline: 'Enterprise E-Learning & Collaborative Workspace Platform',
      description: 'Develop a comprehensive, full-scale production application simulating an industrial tech product from requirement gathering to launch.',
      projectOverview: {
        name: 'Binary Studio - Enterprise Learning & Collaborative Workspace',
        type: 'Comprehensive Major Project / Industry Capstone',
        stack: ['Next.js 14 App Router', 'TypeScript', 'Tailored CSS Design System', 'REST API Integration', 'Razorpay Gateway', 'Cloud Storage'],
        deliverables: [
          'Full-featured authentication flow with JWT tokens and guest checkout support',
          'Catalog browsing with real-time category filtering, search, and dynamic routing',
          'Video lecture player with dynamic timestamp seeking, playlist sidebar, and auto-progress tracking',
          'Razorpay payment gateway checkout integration with instant UPI QR & card processing',
          'Digital certificate issuance engine with verifiable unique credential IDs and print-ready receipts',
          'Student personalized "My Learning" dashboard with live progress percentage calculators',
        ],
        mentorship: '1-on-1 architecture review, PR evaluation, and portfolio presentation guidance.',
      },
    },
  ],
  credentials: [
    {
      id: 'lor',
      title: 'Letter of Recommendation (LOR)',
      issuer: 'Binary Vidya Academic & Mentorship Council',
      badge: 'Official Recommendation',
      description: 'Personalized, verifiable Letter of Recommendation detailing your project contributions, technical skills, and work ethic—ideal for job applications & higher studies.',
      icon: 'FileText',
      highlight: 'Signed by Lead Technical Architect & Mentor',
    },
    {
      id: 'internship-cert',
      title: 'Internship Completion Certificate',
      issuer: 'Binary Vidya Technologies',
      badge: '2-Month Industrial Experience',
      description: 'Official corporate credential recognizing 2 months of hands-on industrial internship experience on production frontend web architectures.',
      icon: 'Briefcase',
      highlight: 'Verifiable Online with Unique Credential ID & QR',
    },
    {
      id: 'training-cert',
      title: 'Training Certificate',
      issuer: 'Binary Vidya Technical Academy',
      badge: 'Course Completion & Skill Mastery',
      description: 'Recognizes thorough mastery of modern frontend technologies, React, Next.js, and TypeScript, backed by graded module assessments.',
      icon: 'Award',
      highlight: 'Accredited Curriculum Verification',
    },
    {
      id: 'excellence-cert',
      title: 'Outstanding & Excellence Certificate',
      issuer: 'Binary Vidya Board of Honors',
      badge: 'Prestigious Merit Credential',
      description: 'Awarded to students demonstrating exemplary technical quality in Minor and Major project submissions, code cleanliness, and active participation.',
      icon: 'Sparkles',
      highlight: 'Honors Tier Recognition for Standout Portfolios',
    },
  ],
  benefits: [
    'Weekend live classes that never clash with college or weekday work',
    'Full access to 24/7 session recordings and code repositories',
    'Real-time doubt clearance and mentorship from experienced developers',
    'Minor & Major production projects ready to showcase on GitHub and resume',
    '4 career-boosting credentials upon 2-month internship completion',
    'Resume and LinkedIn optimization workshop included',
  ],
};

/**
 * GET /api/training-internship
 * Returns the complete details of the Frontend Developer Training & Internship program
 */
export const getTrainingInternshipProgram = async (req: Request, res: Response) => {
  try {
    return res.json({
      success: true,
      program: FRONTEND_INTERNSHIP_PROGRAM,
    });
  } catch (error: any) {
    console.error('[Get Training Internship Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve program details',
    });
  }
};
