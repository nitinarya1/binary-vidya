import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { Career } from '../../../lib/models';

export const dynamic = 'force-dynamic';

const CURATED_CAREERS = [
  {
    id: 'career-1',
    title: 'Senior Full Stack Engineering Instructor & Mentor',
    slug: 'senior-full-stack-engineering-instructor-mentor',
    department: 'Curriculum & Instruction',
    employmentType: 'Full-Time / Part-Time',
    location: 'Remote (India)',
    experience: '3-6 Years',
    salary: '₹14,00,000 - ₹22,00,000 PA',
    description: 'Lead high-impact weekend cohorts, architect modern React & Next.js curriculum, conduct interactive code reviews, and mentor aspiring software engineers.',
    requirements: [
      'Strong expertise in TypeScript, React, Next.js, Node.js, and MongoDB',
      'Prior experience teaching, mentoring, or conducting technical workshops',
      'Excellent communication and empathetic leadership skills',
      'Passion for developer education and hands-on project building',
    ],
    status: 'active',
  },
  {
    id: 'career-2',
    title: 'AI & Machine Learning Technical Mentor',
    slug: 'ai-data-science-curriculum-lead',
    department: 'Curriculum & Instruction',
    employmentType: 'Full-Time',
    location: 'Remote / Bangalore',
    experience: '3-5 Years',
    salary: '₹18,00,000 - ₹28,00,000 PA',
    description: 'Design world-class AI/ML programs covering deep learning, LLMs, fine-tuning, and RAG architectures for Binary Vidya learners.',
    requirements: [
      'Deep hands-on experience with Python, PyTorch, LangChain, and Vector Databases',
      'Track record in machine learning systems or AI product development',
      'Strong pedagogy background or technical content creation experience',
    ],
    status: 'active',
  },
  {
    id: 'career-3',
    title: 'Frontend Developer & Platform Engineer',
    slug: 'lead-platform-fullstack-developer',
    department: 'Engineering',
    employmentType: 'Full-Time',
    location: 'Remote (India)',
    experience: '2-4 Years',
    salary: '₹12,00,000 - ₹18,00,000 PA',
    description: 'Build fast, responsive, modern web interfaces for the Binary Vidya LMS platform, interactive quizzes, video streaming, and student dashboards.',
    requirements: [
      'Expert in Next.js, React 18/19, TypeScript, and modern CSS architectures',
      'Eye for sleek UI/UX design, animations, and micro-interactions',
      'Experience with RESTful APIs, JWT authentication, and WebSockets',
    ],
    status: 'active',
  },
  {
    id: 'career-4',
    title: 'Campus Student Ambassador & Community Lead',
    slug: 'campus-student-ambassador-lead',
    department: 'Growth & Community',
    employmentType: 'Internship / Part-Time',
    location: 'Pan-India Colleges (Remote)',
    experience: 'College Students (All Years)',
    salary: '₹10,000 - ₹25,000 / Month + Performance Bonuses',
    description: 'Represent Binary Vidya in your college campus, organize technical hackathons, coding workshops, and help peers access industry internships.',
    requirements: [
      'Currently enrolled in B.Tech, BCA, MCA, or related degree',
      'Active leadership in college tech clubs, coding communities, or student councils',
      'Energetic communicator with enthusiasm for technology and peer learning',
    ],
    status: 'active',
  },
];

export async function GET(req: Request) {
  try {
    try {
      await connectDB();
      const dbCareers = await Career.find({ status: 'active' }).sort({ createdAt: -1 }).lean();
      if (dbCareers && dbCareers.length > 0) {
        return NextResponse.json({
          success: true,
          careers: dbCareers.map((c: any) => ({
            id: c._id?.toString() || c.slug,
            title: c.title,
            slug: c.slug,
            department: c.department || 'Engineering',
            employmentType: c.employmentType || 'Full-Time',
            location: c.location || 'Remote (India)',
            experience: c.experience || '1-3 Years',
            salary: c.salary || 'Competitive Industry Standard',
            description: c.description || '',
            requirements: c.requirements || [],
            responsibilities: c.responsibilities || [],
            deadline: c.deadline || 'Rolling Admissions',
            status: c.status || 'active',
          })),
        });
      }
    } catch (dbErr) {
      console.warn('[Public Careers API] Database fetch error, falling back to curated:', dbErr);
    }

    return NextResponse.json({
      success: true,
      careers: CURATED_CAREERS,
    });
  } catch (error: any) {
    console.error('[Public Careers API Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch careers' },
      { status: 500 }
    );
  }
}
