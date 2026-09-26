import { Request, Response } from 'express';
import { Course } from '../models/Course';

// Initial curated starter courses if database has 0
const INITIAL_COURSES = [
  {
    title: 'Full Stack MERN Architecture & Next.js 15 Mastery',
    slug: 'full-stack-mern-nextjs-15-mastery',
    description: 'Master production-ready web applications from ground up using React 19, Next.js App Router, Node.js, Express, and MongoDB Atlas with advanced authentication.',
    category: 'Web Development',
    level: 'Intermediate',
    duration: '12 Weeks',
    price: 4999,
    instructor: 'Nitin Arya (Lead Architect)',
    thumbnail: '',
    tags: ['Next.js', 'React', 'Node.js', 'MongoDB', 'TypeScript'],
    chapters: [
      {
        title: 'Chapter 1: Modern JavaScript & TypeScript Foundations',
        description: 'Deep dive into asynchronous paradigms, generics, and strict types',
        lessons: [
          { title: 'Lesson 1.1: Event Loop, Microtasks & Promises', videoUrl: 'https://www.youtube.com/watch?v=8aGhZQkoFbQ', duration: '22 Mins' },
          { title: 'Lesson 1.2: TypeScript Interfaces, Generics & Type Guards', videoUrl: 'https://www.youtube.com/watch?v=ahCwqrYpIuM', duration: '28 Mins' },
        ],
      },
      {
        title: 'Chapter 2: React 19 & Next.js App Router',
        description: 'Server Components, Server Actions, and dynamic routing architectures',
        lessons: [
          { title: 'Lesson 2.1: Server vs Client Components Explained', videoUrl: 'https://www.youtube.com/watch?v=Rgw_1K6jW64', duration: '35 Mins' },
          { title: 'Lesson 2.2: Data Fetching, Suspense & Streaming UI', videoUrl: 'https://www.youtube.com/watch?v=gSsmU1vKj2Y', duration: '40 Mins' },
        ],
      },
      {
        title: 'Chapter 3: Production Backend API & Cloud Database Design',
        description: 'Express, Mongoose ODM schemas, indexing, and JWT 2FA authentication',
        lessons: [
          { title: 'Lesson 3.1: RESTful API Engineering with Express & TypeScript', videoUrl: 'https://www.youtube.com/watch?v=Oe421EPjeBE', duration: '30 Mins' },
          { title: 'Lesson 3.2: MongoDB Atlas Schema Modeling & Indexes', videoUrl: 'https://www.youtube.com/watch?v=ofme2o29ngU', duration: '45 Mins' },
        ],
      },
    ],
    modules: [
      { title: 'Core Modern JS & TypeScript Fundamentals', lecturesCount: 8, duration: '4 Hours' },
      { title: 'React 19, Server Components & State Management', lecturesCount: 12, duration: '6 Hours' },
      { title: 'Backend REST API & Database Schema Engineering', lecturesCount: 14, duration: '8 Hours' },
      { title: 'Production Deployment, CI/CD & Cloud Hosting', lecturesCount: 6, duration: '3 Hours' },
    ],
    status: 'active',
    enrolledCount: 1420,
    rating: 4.95,
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
    thumbnail: '',
    tags: ['AI/ML', 'Python', 'LangChain', 'RAG', 'VectorDB'],
    chapters: [
      {
        title: 'Chapter 1: LLM Fundamentals & Prompt Engineering',
        description: 'Transformers, embeddings, and token mechanics',
        lessons: [
          { title: 'Lesson 1.1: Attention Mechanism & Transformer Internals', videoUrl: 'https://www.youtube.com/watch?v=wjZofJX0v4U', duration: '30 Mins' },
          { title: 'Lesson 1.2: System Prompting, Few-Shot & Chain-of-Thought', videoUrl: 'https://www.youtube.com/watch?v=jC4v5AS4RIM', duration: '25 Mins' },
        ],
      },
      {
        title: 'Chapter 2: Vector Databases & Semantic Search',
        description: 'Dense vector embeddings, cosine similarity, and indexing',
        lessons: [
          { title: 'Lesson 2.1: Generating and Storing Embeddings with Pinecone', videoUrl: 'https://www.youtube.com/watch?v=ySus5ZS0b94', duration: '35 Mins' },
        ],
      },
      {
        title: 'Chapter 3: Building Production RAG Architectures',
        description: 'Document loaders, chunking strategies, and hybrid retrieval',
        lessons: [
          { title: 'Lesson 3.1: Chunking, Reranking & Context Injection', videoUrl: 'https://www.youtube.com/watch?v=tcqEUSNCn8I', duration: '40 Mins' },
        ],
      },
    ],
    modules: [
      { title: 'LLM Architectures & Transformers Deep Dive', lecturesCount: 10, duration: '5 Hours' },
      { title: 'Vector Embeddings & Semantic Search Pipelines', lecturesCount: 8, duration: '4 Hours' },
      { title: 'RAG Systems (Retrieval-Augmented Generation)', lecturesCount: 12, duration: '7 Hours' },
      { title: 'Fine-Tuning & Multi-Agent Orchestration', lecturesCount: 10, duration: '6 Hours' },
    ],
    status: 'active',
    enrolledCount: 980,
    rating: 4.92,
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
    thumbnail: '',
    tags: ['DevOps', 'Docker', 'Kubernetes', 'AWS', 'CI/CD'],
    chapters: [
      {
        title: 'Chapter 1: Containerization with Docker',
        description: 'Building lean container images with multi-stage builds',
        lessons: [
          { title: 'Lesson 1.1: Docker Architecture & Namespaces', videoUrl: 'https://www.youtube.com/watch?v=fqMOX6JJhGo', duration: '25 Mins' },
          { title: 'Lesson 1.2: Multi-stage Builds & Security Best Practices', videoUrl: 'https://www.youtube.com/watch?v=gAkwW2tuIqE', duration: '30 Mins' },
        ],
      },
      {
        title: 'Chapter 2: Kubernetes Cluster Orchestration',
        description: 'Deployments, Services, ConfigMaps, and Ingress routing',
        lessons: [
          { title: 'Lesson 2.1: Pods, ReplicaSets & Rolling Deployments', videoUrl: 'https://www.youtube.com/watch?v=X48VuDVv0do', duration: '40 Mins' },
        ],
      },
    ],
    modules: [
      { title: 'Linux System Internals & Shell Automation', lecturesCount: 6, duration: '3 Hours' },
      { title: 'Containerization with Docker & Multi-stage Builds', lecturesCount: 10, duration: '5 Hours' },
      { title: 'Kubernetes Pods, Services & Ingress Deployment', lecturesCount: 12, duration: '6 Hours' },
      { title: 'Terraform IaC & AWS Cloud Infrastructure', lecturesCount: 8, duration: '4 Hours' },
    ],
    status: 'active',
    enrolledCount: 1150,
    rating: 4.88,
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
    thumbnail: '',
    tags: ['DSA', 'Algorithms', 'C++', 'Java', 'FAANG'],
    chapters: [
      {
        title: 'Chapter 1: Algorithmic Complexity & Arrays',
        description: 'Big-O notation, sliding window, two-pointer techniques',
        lessons: [
          { title: 'Lesson 1.1: Asymptotic Analysis & Space-Time Tradeoffs', videoUrl: 'https://www.youtube.com/watch?v=__vX2sjlpXU', duration: '30 Mins' },
          { title: 'Lesson 1.2: Two Pointer & Sliding Window Invariant Patterns', videoUrl: 'https://www.youtube.com/watch?v=4i6Qz23o_h4', duration: '35 Mins' },
        ],
      },
      {
        title: 'Chapter 2: Dynamic Programming Patterns',
        description: 'Memoization, tabulation, 0/1 Knapsack, and state transitions',
        lessons: [
          { title: 'Lesson 2.1: Top-down vs Bottom-up Dynamic Programming', videoUrl: 'https://www.youtube.com/watch?v=oBt53YbR9Kk', duration: '45 Mins' },
        ],
      },
    ],
    modules: [
      { title: 'Time Complexity & Array Manipulation', lecturesCount: 12, duration: '6 Hours' },
      { title: 'Trees, BST & Segment Trees', lecturesCount: 14, duration: '7 Hours' },
      { title: 'Dynamic Programming & Memoization Patterns', lecturesCount: 18, duration: '10 Hours' },
      { title: 'Graph Theory, Shortest Paths & Topological Sort', lecturesCount: 15, duration: '8 Hours' },
    ],
    status: 'active',
    enrolledCount: 2300,
    rating: 4.96,
  },
];

/**
 * GET /api/courses
 * Public endpoint to list all available active courses
 */
export const getAllCourses = async (req: Request, res: Response) => {
  try {
    const { category, level, search, limit, status } = req.query;

    const query: any = {};

    // Filter by published status by default for students
    if (status) {
      if (status !== 'all') query.status = status;
    } else {
      query.status = 'active';
    }

    if (category && category !== 'all') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (level && level !== 'all') {
      query.level = level;
    }

    if (search && typeof search === 'string') {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { instructor: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    let courseQuery = Course.find(query).sort({ createdAt: -1 });
    if (limit) {
      courseQuery = courseQuery.limit(Number(limit));
    }

    const courses = await courseQuery.lean();

    // Map courses with computed summary counts
    const formatted = courses.map((c: any) => {
      const chapters = Array.isArray(c.chapters) ? c.chapters : [];
      let totalLessons = 0;
      chapters.forEach((ch: any) => {
        if (Array.isArray(ch.lessons)) {
          totalLessons += ch.lessons.length;
        }
      });

      // fallback to modules count if 0 lessons
      if (totalLessons === 0 && Array.isArray(c.modules)) {
        totalLessons = c.modules.reduce((sum: number, m: any) => sum + (m.lecturesCount || 0), 0);
      }

      return {
        id: c._id.toString(),
        title: c.title,
        slug: c.slug,
        description: c.description,
        category: c.category,
        level: c.level,
        duration: c.duration,
        price: c.price,
        instructor: c.instructor,
        thumbnail: c.thumbnail || '',
        tags: c.tags || [],
        chapters: chapters,
        chaptersCount: chapters.length,
        totalLessons: totalLessons || 20,
        modules: c.modules || [],
        status: c.status,
        enrolledCount: c.enrolledCount || 0,
        rating: c.rating || 4.8,
        createdAt: c.createdAt,
      };
    });

    const categoriesList = await Course.distinct('category', { status: 'active' });

    res.json({
      success: true,
      count: formatted.length,
      categories: categoriesList,
      courses: formatted,
    });
  } catch (error: any) {
    console.error('[getAllCourses Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch courses from backend',
    });
  }
};

/**
 * GET /api/courses/:slugOrId
 * Public endpoint to fetch single course details with complete chapters and video lessons
 */
export const getCourseBySlug = async (req: Request, res: Response) => {
  try {
    const { slugOrId } = req.params;

    let course: any = await Course.findOne({ slug: slugOrId }).lean();
    if (!course && slugOrId.match(/^[0-9a-fA-F]{24}$/)) {
      course = await Course.findById(slugOrId).lean();
    }
    if (!course) {
      course = await Course.findOne({ title: { $regex: new RegExp(`^${slugOrId.replace(/-/g, ' ')}$`, 'i') } }).lean();
    }
    if (!course) {
      course = await Course.findOne({ slug: { $regex: new RegExp(slugOrId, 'i') } }).lean();
    }

    if (!course) {
      return res.status(404).json({
        success: false,
        message: `Course with identifier "${slugOrId}" not found`,
      });
    }

    const chapters = Array.isArray(course.chapters) ? course.chapters : [];
    let totalLessons = 0;
    chapters.forEach((ch: any) => {
      if (Array.isArray(ch.lessons)) {
        totalLessons += ch.lessons.length;
      }
    });

    res.json({
      success: true,
      course: {
        id: course._id.toString(),
        title: course.title,
        slug: course.slug,
        description: course.description,
        category: course.category,
        level: course.level,
        duration: course.duration,
        price: course.price,
        instructor: course.instructor,
        thumbnail: course.thumbnail || '',
        tags: course.tags || [],
        chapters: chapters,
        chaptersCount: chapters.length,
        totalLessons: totalLessons || 20,
        modules: course.modules || [],
        status: course.status,
        enrolledCount: course.enrolledCount || 0,
        rating: course.rating || 4.8,
        createdAt: course.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[getCourseBySlug Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch course details',
    });
  }
};
