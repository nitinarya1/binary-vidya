import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../lib/db';
import { User, Course } from '../../../../lib/models';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'binary_vidya_super_secret_jwt_key_2025_987654321';

async function authenticateAdmin(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Authorization token required', status: 401 };
  }

  const token = authHeader.split(' ')[1];
  let decoded: any;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return { error: 'Invalid or expired session', status: 401 };
  }

  await connectDB();
  const requester: any = await User.findById(decoded.id).lean();
  if (!requester) {
    return { error: 'Administrator account not found', status: 404 };
  }

  const { isSuperAdminEmail } = await import('../../../../lib/auth-helpers');
  const isSuper = isSuperAdminEmail(requester.email) && requester.teamStatus !== 'suspended';
  const hasCoursePerm = requester.isTeamMember && requester.teamStatus !== 'suspended' && requester.permissions?.manageCourses;

  if (!isSuper && !hasCoursePerm) {
    return { error: 'Access denied: Super Administrator or Course Management permission required', status: 403 };
  }

  return { requester };
}

// Initial curated starter courses if database has 0
const INITIAL_COURSES = [
  {
    title: 'Full Stack MERN Architecture & Next.js 15 Mastery',
    slug: 'full-stack-mern-nextjs-15-mastery',
    description: 'Master production-ready web applications from ground up using React, Next.js App Router, Node.js, Express, and MongoDB Atlas with advanced authentication.',
    category: 'Web Development',
    level: 'Intermediate',
    duration: '12 Weeks',
    price: 4999,
    instructor: 'Nitin Arya (Lead Architect)',
    tags: ['Next.js', 'React', 'Node.js', 'MongoDB', 'TypeScript'],
    modules: [
      { title: 'Core Modern JS & TypeScript Fundamentals', lecturesCount: 8, duration: '4 Hours' },
      { title: 'React 19, Server Components & State Management', lecturesCount: 12, duration: '6 Hours' },
      { title: 'Backend REST API & Database Schema Engineering', lecturesCount: 14, duration: '8 Hours' },
      { title: 'Production Deployment, CI/CD & Cloud Hosting', lecturesCount: 6, duration: '3 Hours' },
    ],
    status: 'active',
    enrolledCount: 142,
    rating: 4.9,
  },
  {
    title: 'Generative AI & LLM Systems Engineering',
    slug: 'generative-ai-llm-systems-engineering',
    description: 'Build enterprise-grade AI applications with LangChain, LlamaIndex, OpenAI, Anthropic Claude, Vector Databases (Pinecone/Chroma), and RAG pipelines.',
    category: 'Artificial Intelligence',
    level: 'Advanced',
    duration: '10 Weeks',
    price: 6499,
    instructor: 'Dr. Vivek Sengupta',
    tags: ['AI/ML', 'Python', 'LangChain', 'RAG', 'VectorDB'],
    modules: [
      { title: 'LLM Architectures & Transformers Deep Dive', lecturesCount: 10, duration: '5 Hours' },
      { title: 'Vector Embeddings & Semantic Search Pipelines', lecturesCount: 8, duration: '4 Hours' },
      { title: 'RAG Systems (Retrieval-Augmented Generation)', lecturesCount: 12, duration: '7 Hours' },
      { title: 'Fine-Tuning & Multi-Agent Orchestration', lecturesCount: 10, duration: '6 Hours' },
    ],
    status: 'active',
    enrolledCount: 98,
    rating: 4.95,
  },
  {
    title: 'Cloud DevOps, Docker & Kubernetes Engineering',
    slug: 'cloud-devops-docker-kubernetes-engineering',
    description: 'Automate modern infrastructure from code commit to cloud production using Docker containers, Kubernetes clusters, Helm, Terraform, and GitHub Actions.',
    category: 'Cloud & DevOps',
    level: 'Intermediate',
    duration: '8 Weeks',
    price: 3999,
    instructor: 'Ananya Sharma (Cloud Consultant)',
    tags: ['DevOps', 'Docker', 'Kubernetes', 'AWS', 'CI/CD'],
    modules: [
      { title: 'Linux System Internals & Shell Automation', lecturesCount: 6, duration: '3 Hours' },
      { title: 'Containerization with Docker & Multi-stage Builds', lecturesCount: 10, duration: '5 Hours' },
      { title: 'Kubernetes Pods, Services & Ingress Deployment', lecturesCount: 12, duration: '6 Hours' },
      { title: 'Terraform IaC & AWS Cloud Infrastructure', lecturesCount: 8, duration: '4 Hours' },
    ],
    status: 'active',
    enrolledCount: 115,
    rating: 4.85,
  },
  {
    title: 'Data Structures, Algorithms & Competitive Programming',
    slug: 'dsa-competitive-programming-interview-prep',
    description: 'Complete FAANG interview preparation covering 300+ curated algorithmic problems in C++ and Java, dynamic programming, graphs, and system design.',
    category: 'Computer Science Core',
    level: 'All Levels',
    duration: '16 Weeks',
    price: 2999,
    instructor: 'Rohan Gupta (Ex-SDE Amazon)',
    tags: ['DSA', 'Algorithms', 'C++', 'Java', 'FAANG'],
    modules: [
      { title: 'Time Complexity & Array Manipulation', lecturesCount: 12, duration: '6 Hours' },
      { title: 'Trees, BST & Segment Trees', lecturesCount: 14, duration: '7 Hours' },
      { title: 'Dynamic Programming & Memoization Patterns', lecturesCount: 18, duration: '10 Hours' },
      { title: 'Graph Theory, Shortest Paths & Topological Sort', lecturesCount: 15, duration: '8 Hours' },
    ],
    status: 'active',
    enrolledCount: 230,
    rating: 4.92,
  },
];

// GET: List all courses with metrics
export async function GET(req: Request) {
  try {
    const authResult = await authenticateAdmin(req);
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const query: any = {};
    if (category && category !== 'all') query.category = category;
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { instructor: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const courses = await Course.find(query).sort({ createdAt: -1 }).lean();

    const totalCourses = await Course.countDocuments();
    const activeCourses = await Course.countDocuments({ status: 'active' });
    const draftCourses = await Course.countDocuments({ status: 'draft' });
    const totalEnrolled = (await Course.aggregate([{ $group: { _id: null, total: { $sum: '$enrolledCount' } } }]))[0]?.total || 0;

    return NextResponse.json({
      success: true,
      courses: courses.map((c: any) => ({
        id: c._id.toString(),
        title: c.title,
        slug: c.slug,
        description: c.description,
        category: c.category,
        level: c.level,
        duration: c.duration,
        price: c.price,
        instructor: c.instructor,
        tags: c.tags || [],
        thumbnail: c.thumbnail || '',
        chapters: c.chapters || [],
        modules: c.modules || [],
        status: c.status,
        enrolledCount: c.enrolledCount,
        rating: c.rating,
        createdAt: c.createdAt,
      })),
      metrics: {
        totalCourses,
        activeCourses,
        draftCourses,
        totalEnrolled,
      },
    });
  } catch (error: any) {
    console.error('[Admin Courses GET Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch courses' }, { status: 500 });
  }
}

// POST: Create a new course
export async function POST(req: Request) {
  try {
    const authResult = await authenticateAdmin(req);
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const body = await req.json();
    const { title, description, category, level, duration, price, instructor, tags, modules, chapters, thumbnail, status } = body;

    if (!title || !description) {
      return NextResponse.json({ success: false, message: 'Title and description are required' }, { status: 400 });
    }

    const slug = (body.slug || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + `-${Date.now().toString().slice(-4)}`;

    const computedModules = Array.isArray(chapters) && chapters.length > 0
      ? chapters.map((ch: any) => ({
          title: ch.title || 'Chapter',
          lecturesCount: Array.isArray(ch.lessons) ? ch.lessons.length : 1,
          duration: ch.description || '1 Hour',
        }))
      : Array.isArray(modules) ? modules : [];

    const newCourse = await Course.create({
      title: title.trim(),
      slug,
      description: description.trim(),
      category: category || 'General',
      level: level || 'Beginner',
      duration: duration || '8 Weeks',
      price: Number(price) || 0,
      originalPrice: Number(body.originalPrice) || Number(price) || 0,
      instructor: instructor || 'Binary Vidya Faculty',
      thumbnail: thumbnail || '',
      tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      chapters: Array.isArray(chapters) ? chapters : [],
      modules: computedModules,
      status: status || 'active',
      enrolledCount: 0,
      rating: 5.0,
    });

    return NextResponse.json({
      success: true,
      message: 'Course created successfully!',
      course: newCourse,
    });
  } catch (error: any) {
    console.error('[Admin Courses POST Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to create course' }, { status: 500 });
  }
}

// PUT: Update an existing course
export async function PUT(req: Request) {
  try {
    const authResult = await authenticateAdmin(req);
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Course ID is required for update' }, { status: 400 });
    }

    if (updates.tags && typeof updates.tags === 'string') {
      updates.tags = updates.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    }

    const updated = await Course.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Course updated successfully',
      course: updated,
    });
  } catch (error: any) {
    console.error('[Admin Courses PUT Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to update course' }, { status: 500 });
  }
}

// DELETE: Delete a course
export async function DELETE(req: Request) {
  try {
    const authResult = await authenticateAdmin(req);
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Course ID parameter is required' }, { status: 400 });
    }

    const deleted = await Course.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error: any) {
    console.error('[Admin Courses DELETE Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to delete course' }, { status: 500 });
  }
}
