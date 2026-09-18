'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { isSuperAdminEmail } from '../../lib/auth-helpers';
import styles from './super-admin.module.css';
import {
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Layers,
  BookOpen,
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  X,
  Clock,
  Award,
  MapPin,
  Check,
  TrendingUp,
  Upload,
  Image as ImageIcon,
  Video,
  Film,
  Zap,
  Trash,
} from 'lucide-react';
import { compressThumbnail, formatBytes } from '../../lib/imageCompressor';

// Data Interfaces
export interface VideoLessonItem {
  id?: string;
  title: string;
  videoUrl: string;
  duration: string;
  thumbnail?: string;
  description?: string;
  _stats?: { orig: string; comp: string; saved: number };
}

export interface ChapterItem {
  id?: string;
  title: string;
  description?: string;
  lessons: VideoLessonItem[];
}

interface CourseItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  duration: string;
  price: number;
  instructor: string;
  thumbnail?: string;
  tags: string[];
  chapters?: ChapterItem[];
  modules: { title: string; lecturesCount: number; duration: string }[];
  status: 'active' | 'draft' | 'archived';
  enrolledCount: number;
  rating: number;
}

interface TrainingItem {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  track?: string;
  domain: string;
  type: 'internship' | 'training' | 'bootcamp';
  duration: string;
  mode: string;
  stipendOrFee: string;
  trainingPrice?: number;
  originalPrice?: number;
  internshipPrice?: number;
  schedule?: {
    badge?: string;
    days?: string;
    timings?: string;
    flexibility?: string;
  };
  durations?: {
    total?: string;
    trainingWeeks?: string;
    internshipWeeks?: string;
  };
  sections?: any[];
  credentials?: any[];
  eligibility: string;
  perks: string[];
  deadline: string;
  status: 'open' | 'ongoing' | 'closed';
  applicantsCount: number;
}

interface CareerItem {
  id: string;
  title: string;
  slug: string;
  department: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'remote';
  location: string;
  experience: string;
  salary: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  deadline: string;
  status: 'active' | 'closed';
  applicantsCount: number;
}

type TabType = 'overview' | 'courses' | 'training' | 'careers';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { user, token, isLoading, isAdmin, logout } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Data States
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [trainingPrograms, setTrainingPrograms] = useState<TrainingItem[]>([]);
  const [careers, setCareers] = useState<CareerItem[]>([]);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Feedback Notification
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals States
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);

  const [trainingModalOpen, setTrainingModalOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<TrainingItem | null>(null);

  const [careerModalOpen, setCareerModalOpen] = useState(false);
  const [editingCareer, setEditingCareer] = useState<CareerItem | null>(null);

  // Auto-hide toast notification after 4s
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  // Protect Super Admin route: Only the main Super Admin account can access
  useEffect(() => {
    if (!isLoading) {
      if (!user || !isSuperAdminEmail(user.email)) {
        router.push('/login');
      }
    }
  }, [isLoading, user, router]);

  // Fetch all data
  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      const [coursesRes, trainingRes, careersRes] = await Promise.all([
        fetch('/api/admin/courses', { headers }).then((r) => r.json()),
        fetch('/api/admin/training-internships', { headers }).then((r) => r.json()),
        fetch('/api/admin/careers', { headers }).then((r) => r.json()),
      ]);

      if (coursesRes.success) setCourses(coursesRes.courses || []);
      if (trainingRes.success) setTrainingPrograms(trainingRes.programs || []);
      if (careersRes.success) setCareers(careersRes.careers || []);
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Failed to fetch dashboard data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && isAdmin) {
      fetchData();
    }
  }, [token, isAdmin]);

  // Metric Computations
  const metrics = useMemo(() => {
    const totalCourses = courses.length;
    const activeCourses = courses.filter((c) => c.status === 'active').length;
    const totalStudentsEnrolled = courses.reduce((acc, c) => acc + (c.enrolledCount || 0), 0);

    const totalPrograms = trainingPrograms.length;
    const activeInternships = trainingPrograms.filter((t) => t.type === 'internship' && t.status === 'open').length;
    const totalTrainingApplicants = trainingPrograms.reduce((acc, t) => acc + (t.applicantsCount || 0), 0);

    const totalJobs = careers.length;
    const activeJobs = careers.filter((c) => c.status === 'active').length;
    const totalCareerApplicants = careers.reduce((acc, c) => acc + (c.applicantsCount || 0), 0);

    return {
      totalCourses,
      activeCourses,
      totalStudentsEnrolled,
      totalPrograms,
      activeInternships,
      totalTrainingApplicants,
      totalJobs,
      activeJobs,
      totalCareerApplicants,
    };
  }, [courses, trainingPrograms, careers]);

  // Filtered Course Records
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = filterCategory === 'all' || c.category === filterCategory;
      const matchStat = filterStatus === 'all' || c.status === filterStatus;
      return matchSearch && matchCat && matchStat;
    });
  }, [courses, searchQuery, filterCategory, filterStatus]);

  // Filtered Training Programs
  const filteredTraining = useMemo(() => {
    return trainingPrograms.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.domain.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = filterCategory === 'all' || t.type === filterCategory;
      const matchStat = filterStatus === 'all' || t.status === filterStatus;
      return matchSearch && matchType && matchStat;
    });
  }, [trainingPrograms, searchQuery, filterCategory, filterStatus]);

  // Filtered Career Openings
  const filteredCareers = useMemo(() => {
    return careers.filter((c) => {
      const matchSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = filterCategory === 'all' || c.department === filterCategory;
      const matchStat = filterStatus === 'all' || c.status === filterStatus;
      return matchSearch && matchDept && matchStat;
    });
  }, [careers, searchQuery, filterCategory, filterStatus]);

  // Course Actions
  const handleSaveCourse = async (courseData: Partial<CourseItem>) => {
    if (!token) return;
    try {
      const method = editingCourse ? 'PUT' : 'POST';
      const body = editingCourse ? { id: editingCourse.id, ...courseData } : courseData;

      const res = await fetch('/api/admin/courses', {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', text: data.message || 'Course saved successfully!' });
        setCourseModalOpen(false);
        setEditingCourse(null);
        fetchData();
      } else {
        setNotice({ type: 'error', text: data.message || 'Failed to save course' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  const handleDeleteCourse = async (id: string, title: string) => {
    if (!token || !confirm(`Are you sure you want to delete course "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/courses?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', text: 'Course deleted successfully' });
        fetchData();
      } else {
        setNotice({ type: 'error', text: data.message });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  // Training & Internship Actions
  const handleSaveTraining = async (progData: Partial<TrainingItem>) => {
    if (!token) return;
    try {
      const method = editingTraining ? 'PUT' : 'POST';
      const body = editingTraining ? { id: editingTraining.id, ...progData } : progData;

      const res = await fetch('/api/admin/training-internships', {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', text: data.message || 'Program saved successfully!' });
        setTrainingModalOpen(false);
        setEditingTraining(null);
        fetchData();
      } else {
        setNotice({ type: 'error', text: data.message || 'Failed to save program' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  const handleDeleteTraining = async (id: string, title: string) => {
    if (!token || !confirm(`Are you sure you want to delete program "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/training-internships?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', text: 'Program deleted successfully' });
        fetchData();
      } else {
        setNotice({ type: 'error', text: data.message });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  // Career Actions
  const handleSaveCareer = async (careerData: Partial<CareerItem>) => {
    if (!token) return;
    try {
      const method = editingCareer ? 'PUT' : 'POST';
      const body = editingCareer ? { id: editingCareer.id, ...careerData } : careerData;

      const res = await fetch('/api/admin/careers', {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', text: data.message || 'Career opening saved successfully!' });
        setCareerModalOpen(false);
        setEditingCareer(null);
        fetchData();
      } else {
        setNotice({ type: 'error', text: data.message || 'Failed to save career' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  const handleDeleteCareer = async (id: string, title: string) => {
    if (!token || !confirm(`Are you sure you want to delete job opening "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/careers?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', text: 'Job opening deleted successfully' });
        fetchData();
      } else {
        setNotice({ type: 'error', text: data.message });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RefreshCw className="animate-spin" size={32} color="#2563eb" />
      </div>
    );
  }

  if (!user || !isSuperAdminEmail(user.email)) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: '#0f172a', color: '#f8fafc', padding: '24px', textAlign: 'center' }}>
        <AlertCircle size={48} color="#ef4444" />
        <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Super Admin Access Denied</h2>
        <p style={{ color: '#94a3b8', maxWidth: '440px' }}>
          This console is strictly restricted to <strong>aryar0779@gmail.com</strong>. Other accounts do not have permission to view or manage Super Admin resources.
        </p>
        <Link href="/login" style={{ padding: '10px 22px', borderRadius: '8px', background: '#2563eb', color: '#fff', textDecoration: 'none', fontWeight: 600, marginTop: '8px' }}>
          Return to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.superAdminContainer}>
      {/* Top Navigation Bar */}
      <header className={styles.topNav}>
        <div className={styles.topNavInner}>
          <div className={styles.brandGroup}>
            <div className={styles.brandLogo}>
              <Layers size={22} />
            </div>
            <div>
              <div className={styles.brandTextTitle}>
                Binary Vidya
                <span className={styles.superBadge}>Super Admin</span>
              </div>
              <div className={styles.brandTextSubtitle}>Curriculum, Internships & Careers Control</div>
            </div>
          </div>

          <div className={styles.navActions}>
            <button
              onClick={() => {
                setActiveTab('training');
                setEditingTraining(null);
                setTrainingModalOpen(true);
              }}
              className={styles.addTrainingHeaderBtn}
              title="Add New Training & Internship Program"
            >
              <Plus size={15} />
              <span>Add Training &amp; Internship</span>
            </button>

            <Link href="/" className={styles.switchAdminBtn} target="_blank" title="View Public Portal">
              <ExternalLink size={15} />
              <span>Live Site</span>
            </Link>

            <div className={styles.userProfilePill}>
              <div className={styles.userAvatar}>
                {user?.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              <span className={styles.userName}>{user?.name || 'Administrator'}</span>
            </div>

            <button onClick={logout} className={styles.logoutBtn} title="Sign Out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className={styles.pageBody}>
        {/* Header Hero Banner */}
        <section className={styles.headerBanner}>
          <div>
            <h1 className={styles.headerTitle}>
              <Sparkles size={28} color="#60a5fa" />
              Super Admin Control Console
            </h1>
            <p className={styles.headerSubtitle}>
              Centralized command center for managing high-impact technical courses, verified training & internship drives, and career hiring pipelines.
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              onClick={() => {
                setEditingCourse(null);
                setCourseModalOpen(true);
              }}
              className={styles.primaryActionBtn}
            >
              <Plus size={16} /> Add New Course
            </button>

            <button
              onClick={() => {
                setEditingTraining(null);
                setTrainingModalOpen(true);
              }}
              className={styles.secondaryActionBtn}
            >
              <Plus size={16} /> Add Internship
            </button>

            <button
              onClick={() => {
                setEditingCareer(null);
                setCareerModalOpen(true);
              }}
              className={styles.secondaryActionBtn}
            >
              <Plus size={16} /> Post Career
            </button>
          </div>
        </section>

        {/* Global Key Metrics Grid */}
        <section className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Total Courses</span>
              <span className={styles.metricValue}>{metrics.totalCourses}</span>
              <span className={styles.metricSubtext}>
                {metrics.activeCourses} Active • {metrics.totalStudentsEnrolled} Enrolled
              </span>
            </div>
            <div className={styles.metricIconWrapper} style={{ background: '#eff6ff', color: '#2563eb' }}>
              <BookOpen size={24} />
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Training & Internships</span>
              <span className={styles.metricValue}>{metrics.totalPrograms}</span>
              <span className={styles.metricSubtext}>
                {metrics.activeInternships} Open • {metrics.totalTrainingApplicants} Applicants
              </span>
            </div>
            <div className={styles.metricIconWrapper} style={{ background: '#ecfdf5', color: '#059669' }}>
              <GraduationCap size={24} />
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Career Openings</span>
              <span className={styles.metricValue}>{metrics.totalJobs}</span>
              <span className={styles.metricSubtext}>
                {metrics.activeJobs} Active • {metrics.totalCareerApplicants} Applications
              </span>
            </div>
            <div className={styles.metricIconWrapper} style={{ background: '#faf5ff', color: '#7c3aed' }}>
              <Briefcase size={24} />
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Platform Status</span>
              <span className={styles.metricValue} style={{ color: '#10b981', fontSize: '24px' }}>
                Operational
              </span>
              <span className={styles.metricSubtext} style={{ color: '#64748b' }}>
                Mongo Atlas Connected
              </span>
            </div>
            <div className={styles.metricIconWrapper} style={{ background: '#f0fdf4', color: '#10b981' }}>
              <ShieldCheck size={24} />
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <nav className={styles.tabsContainer}>
          <button
            onClick={() => {
              setActiveTab('overview');
              setSearchQuery('');
              setFilterCategory('all');
              setFilterStatus('all');
            }}
            className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabBtnActive : ''}`}
          >
            <TrendingUp size={16} />
            <span>Overview & Activity</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('courses');
              setSearchQuery('');
              setFilterCategory('all');
              setFilterStatus('all');
            }}
            className={`${styles.tabBtn} ${activeTab === 'courses' ? styles.tabBtnActive : ''}`}
          >
            <BookOpen size={16} />
            <span>Courses</span>
            <span className={styles.tabCountPill}>{courses.length}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('training');
              setSearchQuery('');
              setFilterCategory('all');
              setFilterStatus('all');
            }}
            className={`${styles.tabBtn} ${activeTab === 'training' ? styles.tabBtnActive : ''}`}
          >
            <GraduationCap size={16} />
            <span>Training & Internship</span>
            <span className={styles.tabCountPill}>{trainingPrograms.length}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('careers');
              setSearchQuery('');
              setFilterCategory('all');
              setFilterStatus('all');
            }}
            className={`${styles.tabBtn} ${activeTab === 'careers' ? styles.tabBtnActive : ''}`}
          >
            <Briefcase size={16} />
            <span>Careers</span>
            <span className={styles.tabCountPill}>{careers.length}</span>
          </button>
        </nav>

        {/* TAB 1: OVERVIEW & RECENT ACTIVITY */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
              {/* Courses Snapshot */}
              <div className={styles.tableContainer} style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={18} color="#2563eb" /> Active Courses Snapshot
                  </h3>
                  <button
                    onClick={() => setActiveTab('courses')}
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    View All ({courses.length}) &rarr;
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {courses.slice(0, 4).map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '12px 14px',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{c.title}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          {c.category} • {c.duration} • ₹{c.price.toLocaleString()}
                        </div>
                      </div>
                      <span className={`${styles.statusBadge} ${c.status === 'active' ? styles.statusActive : styles.statusDraft}`}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Training & Internship Snapshot */}
              <div className={styles.tableContainer} style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GraduationCap size={18} color="#059669" /> Internships & Training Drives
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setActiveTab('training');
                        setEditingTraining(null);
                        setTrainingModalOpen(true);
                      }}
                      className={styles.quickAddMiniBtn}
                      title="Add New Program"
                    >
                      <Plus size={13} /> Add Program
                    </button>
                    <button
                      onClick={() => setActiveTab('training')}
                      style={{ background: 'none', border: 'none', color: '#059669', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      View All ({trainingPrograms.length}) &rarr;
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {trainingPrograms.slice(0, 4).map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: '12px 14px',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{t.title}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          {t.domain} • {t.mode.toUpperCase()} • {t.duration}
                        </div>
                      </div>
                      <span className={`${styles.statusBadge} ${t.status === 'open' ? styles.statusActive : styles.statusClosed}`}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Careers Openings Snapshot */}
              <div className={styles.tableContainer} style={{ padding: '24px', gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Briefcase size={18} color="#7c3aed" /> Current Job & Mentor Openings
                  </h3>
                  <button
                    onClick={() => setActiveTab('careers')}
                    style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    View All ({careers.length}) &rarr;
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                  {careers.slice(0, 4).map((job) => (
                    <div
                      key={job.id}
                      style={{
                        padding: '14px 16px',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{job.title}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', margin: '4px 0' }}>
                          {job.department} • {job.location}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#10b981' }}>{job.salary}</div>
                      </div>
                      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{job.applicantsCount} Applicants</span>
                        <span className={`${styles.statusBadge} ${job.status === 'active' ? styles.statusActive : styles.statusClosed}`}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COURSES MANAGEMENT */}
        {activeTab === 'courses' && (
          <div>
            {/* Filter & Search Toolbar */}
            <div className={styles.controlBar}>
              <div className={styles.searchBox}>
                <Search size={18} color="#64748b" />
                <input
                  type="text"
                  placeholder="Search courses by title, instructor, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className={styles.filterGroup}>
                <select
                  className={styles.filterSelect}
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Cloud & DevOps">Cloud & DevOps</option>
                  <option value="Computer Science Core">Computer Science Core</option>
                </select>

                <select
                  className={styles.filterSelect}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active (Published)</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>

                <button
                  onClick={() => {
                    setEditingCourse(null);
                    setCourseModalOpen(true);
                  }}
                  className={styles.primaryActionBtn}
                >
                  <Plus size={16} /> New Course
                </button>
              </div>
            </div>

            {/* Courses Table */}
            <div className={styles.tableContainer}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Course Title & Overview</th>
                    <th>Category</th>
                    <th>Level</th>
                    <th>Duration</th>
                    <th>Price</th>
                    <th>Enrolled</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div className={styles.emptyState}>
                          <BookOpen size={40} color="#94a3b8" />
                          <div className={styles.emptyStateTitle}>No courses found</div>
                          <p>Try refining your search terms or add a new course.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCourses.map((c) => (
                      <tr key={c.id}>
                        <td style={{ maxWidth: '300px' }}>
                          <div className={styles.titleCol}>
                            <span>{c.title}</span>
                            <span className={styles.subDesc}>{c.description}</span>
                            <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 600 }}>
                              Instructor: {c.instructor}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={styles.categoryPill}>{c.category}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>{c.level}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{c.duration}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>
                            {c.price === 0 ? 'FREE' : `₹${c.price.toLocaleString()}`}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#2563eb' }}>{c.enrolledCount} students</span>
                        </td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              c.status === 'active'
                                ? styles.statusActive
                                : c.status === 'draft'
                                ? styles.statusDraft
                                : styles.statusClosed
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className={styles.actionBtnGroup} style={{ justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => {
                                setEditingCourse(c);
                                setCourseModalOpen(true);
                              }}
                              className={styles.editRowBtn}
                              title="Edit Course"
                            >
                              <Edit2 size={13} /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(c.id, c.title)}
                              className={styles.deleteRowBtn}
                              title="Delete Course"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TRAINING & INTERNSHIP MANAGEMENT */}
        {activeTab === 'training' && (
          <div>
            {/* Filter & Search Toolbar */}
            <div className={styles.controlBar}>
              <div className={styles.searchBox}>
                <Search size={18} color="#64748b" />
                <input
                  type="text"
                  placeholder="Search training & internship by domain, title, eligibility..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className={styles.filterGroup}>
                <select
                  className={styles.filterSelect}
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="internship">Internship</option>
                  <option value="training">Industrial Training</option>
                  <option value="bootcamp">Bootcamp</option>
                </select>

                <select
                  className={styles.filterStatus}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open (Accepting)</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="closed">Closed</option>
                </select>

                <button
                  onClick={() => {
                    setEditingTraining(null);
                    setTrainingModalOpen(true);
                  }}
                  className={styles.primaryActionBtn}
                  style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}
                >
                  <Plus size={16} /> Add Training &amp; Internship
                </button>
              </div>
            </div>

            {/* Programs Table */}
            <div className={styles.tableContainer}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Program Title &amp; Track</th>
                    <th>Type</th>
                    <th>Mode &amp; Schedule</th>
                    <th>Duration</th>
                    <th>Tuition &amp; Internship Fee</th>
                    <th>Eligibility</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTraining.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div className={styles.emptyState}>
                          <GraduationCap size={40} color="#94a3b8" />
                          <div className={styles.emptyStateTitle}>No training or internships found</div>
                          <p>Try refining your search terms or create a new program.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTraining.map((t) => (
                      <tr key={t.id}>
                        <td style={{ maxWidth: '300px' }}>
                          <div className={styles.titleCol}>
                            <span>{t.title}</span>
                            {t.subtitle && (
                              <span style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.3 }}>
                                {t.subtitle}
                              </span>
                            )}
                            <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>
                              Track: {t.track || t.domain}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={styles.typeBadge}>{t.type}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: 800, background: '#ecfdf5', color: '#065f46', padding: '2px 6px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                              {t.schedule?.badge || 'Weekend Batches'}
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                              {t.mode}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: '#334155', fontWeight: 600 }}>{t.duration}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>
                              ₹{t.trainingPrice ? t.trainingPrice.toLocaleString('en-IN') : '2,400'}
                              {t.originalPrice ? (
                                <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '11px', marginLeft: '6px' }}>
                                  ₹{t.originalPrice.toLocaleString('en-IN')}
                                </span>
                              ) : null}
                            </span>
                            <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>
                              2-Mo Internship: FREE (₹0)
                            </span>
                          </div>
                        </td>
                        <td style={{ maxWidth: '180px' }}>
                          <span style={{ fontSize: '11px', color: '#475569', lineHeight: 1.3, display: 'block' }}>
                            {t.eligibility}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              t.status === 'open'
                                ? styles.statusActive
                                : t.status === 'ongoing'
                                ? styles.statusDraft
                                : styles.statusClosed
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className={styles.actionBtnGroup} style={{ justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => {
                                setEditingTraining(t);
                                setTrainingModalOpen(true);
                              }}
                              className={styles.editRowBtn}
                              title="Edit Program Details"
                            >
                              <Edit2 size={13} /> Edit
                            </button>

                            <Link
                              href="/training-and-internship"
                              target="_blank"
                              className={styles.editRowBtn}
                              style={{ color: '#2563eb', textDecoration: 'none' }}
                              title="View Student Live Page"
                            >
                              <ExternalLink size={13} /> View
                            </Link>

                            <button
                              onClick={() => handleDeleteTraining(t.id, t.title)}
                              className={styles.deleteRowBtn}
                              title="Delete Program"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: CAREERS MANAGEMENT */}
        {activeTab === 'careers' && (
          <div>
            {/* Filter & Search Toolbar */}
            <div className={styles.controlBar}>
              <div className={styles.searchBox}>
                <Search size={18} color="#64748b" />
                <input
                  type="text"
                  placeholder="Search careers by title, department, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className={styles.filterGroup}>
                <select
                  className={styles.filterSelect}
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">All Departments</option>
                  <option value="Curriculum & Instruction">Curriculum & Instruction</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Student Operations">Student Operations</option>
                </select>

                <select
                  className={styles.filterSelect}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active (Open)</option>
                  <option value="closed">Closed</option>
                </select>

                <button
                  onClick={() => {
                    setEditingCareer(null);
                    setCareerModalOpen(true);
                  }}
                  className={styles.primaryActionBtn}
                >
                  <Plus size={16} /> Post Career
                </button>
              </div>
            </div>

            {/* Careers Table */}
            <div className={styles.tableContainer}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Job Title & Department</th>
                    <th>Type & Location</th>
                    <th>Experience</th>
                    <th>Compensation</th>
                    <th>Applicants</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCareers.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className={styles.emptyState}>
                          <Briefcase size={40} color="#94a3b8" />
                          <div className={styles.emptyStateTitle}>No career openings found</div>
                          <p>Try refining your search terms or post a new job opportunity.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCareers.map((job) => (
                      <tr key={job.id}>
                        <td style={{ maxWidth: '320px' }}>
                          <div className={styles.titleCol}>
                            <span>{job.title}</span>
                            <span style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 600 }}>
                              {job.department}
                            </span>
                            <span className={styles.subDesc}>{job.description}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontWeight: 600, fontSize: '13px', textTransform: 'capitalize' }}>
                              {job.employmentType}
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>{job.location}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: '#475569' }}>{job.experience}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: '#10b981', fontSize: '13px' }}>
                            {job.salary}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#2563eb' }}>{job.applicantsCount} applied</span>
                        </td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              job.status === 'active' ? styles.statusActive : styles.statusClosed
                            }`}
                          >
                            {job.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className={styles.actionBtnGroup} style={{ justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => {
                                setEditingCareer(job);
                                setCareerModalOpen(true);
                              }}
                              className={styles.editRowBtn}
                              title="Edit Job"
                            >
                              <Edit2 size={13} /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCareer(job.id, job.title)}
                              className={styles.deleteRowBtn}
                              title="Delete Job"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* COURSE CREATE/EDIT MODAL */}
      {courseModalOpen && (
        <CourseFormModal
          course={editingCourse}
          onClose={() => {
            setCourseModalOpen(false);
            setEditingCourse(null);
          }}
          onSave={handleSaveCourse}
        />
      )}

      {/* TRAINING CREATE/EDIT MODAL */}
      {trainingModalOpen && (
        <TrainingFormModal
          program={editingTraining}
          onClose={() => {
            setTrainingModalOpen(false);
            setEditingTraining(null);
          }}
          onSave={handleSaveTraining}
        />
      )}

      {/* CAREER CREATE/EDIT MODAL */}
      {careerModalOpen && (
        <CareerFormModal
          career={editingCareer}
          onClose={() => {
            setCareerModalOpen(false);
            setEditingCareer(null);
          }}
          onSave={handleSaveCareer}
        />
      )}

      {/* Toast Notice */}
      {notice && (
        <div
          className={`${styles.toastNotice} ${
            notice.type === 'success' ? styles.toastSuccess : styles.toastError
          }`}
        >
          {notice.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notice.text}</span>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// COURSE FORM MODAL COMPONENT
// -------------------------------------------------------------
function CourseFormModal({
  course,
  onClose,
  onSave,
}: {
  course: CourseItem | null;
  onClose: () => void;
  onSave: (data: Partial<CourseItem>) => void;
}) {
  const [title, setTitle] = useState(course?.title || '');
  const [category, setCategory] = useState(course?.category || 'Web Development');
  const [level, setLevel] = useState<CourseItem['level']>(course?.level || 'Beginner');
  const [duration, setDuration] = useState(course?.duration || '10 Weeks');
  const [price, setPrice] = useState(course?.price !== undefined ? course.price : 4999);
  const [instructor, setInstructor] = useState(course?.instructor || 'Binary Vidya Lead');
  const [description, setDescription] = useState(course?.description || '');
  const [status, setStatus] = useState<CourseItem['status']>(course?.status || 'active');
  const [tags, setTags] = useState(course?.tags?.join(', ') || 'React, Next.js, Node.js');

  // Course Thumbnail States
  const [thumbnail, setThumbnail] = useState(course?.thumbnail || '');
  const [thumbnailStats, setThumbnailStats] = useState<{ orig: string; comp: string; saved: number } | null>(null);
  const [isCompressingMain, setIsCompressingMain] = useState(false);

  // Chapters & Video Lessons States
  const [chapters, setChapters] = useState<ChapterItem[]>(
    course?.chapters && course.chapters.length > 0
      ? course.chapters
      : [
          {
            id: 'ch_1',
            title: 'Chapter 1: Foundations & Architecture',
            description: 'Core concepts, setup, and engineering fundamentals',
            lessons: [
              {
                id: 'les_1',
                title: 'Lesson 1.1: Platform Introduction & Course Overview',
                videoUrl: '',
                duration: '12 Mins',
                thumbnail: '',
                description: '',
              },
            ],
          },
        ]
  );

  // Compress and set main course thumbnail
  const handleMainThumbnailFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressingMain(true);
      const res = await compressThumbnail(file, { maxWidth: 1280, maxHeight: 720, quality: 0.82 });
      setThumbnail(res.dataUrl);
      setThumbnailStats({
        orig: formatBytes(res.originalSize),
        comp: formatBytes(res.compressedSize),
        saved: res.reductionPercentage,
      });
    } catch (err: any) {
      alert(err.message || 'Image compression failed');
    } finally {
      setIsCompressingMain(false);
    }
  };

  // Add Chapter
  const handleAddChapter = () => {
    setChapters([
      ...chapters,
      {
        id: `ch_${Date.now()}`,
        title: `Chapter ${chapters.length + 1}: `,
        description: '',
        lessons: [
          {
            id: `les_${Date.now()}_1`,
            title: `Lesson ${chapters.length + 1}.1: `,
            videoUrl: '',
            duration: '15 Mins',
            thumbnail: '',
            description: '',
          },
        ],
      },
    ]);
  };

  // Remove Chapter
  const handleRemoveChapter = (chIdx: number) => {
    if (chapters.length <= 1) {
      alert('A course must have at least 1 chapter.');
      return;
    }
    setChapters(chapters.filter((_, idx) => idx !== chIdx));
  };

  // Update Chapter Title/Description
  const handleChapterChange = (chIdx: number, field: 'title' | 'description', val: string) => {
    const updated = [...chapters];
    updated[chIdx][field] = val;
    setChapters(updated);
  };

  // Add Video Lesson to Chapter
  const handleAddLesson = (chIdx: number) => {
    const updated = [...chapters];
    const lessonNum = updated[chIdx].lessons.length + 1;
    updated[chIdx].lessons.push({
      id: `les_${Date.now()}`,
      title: `Lesson ${chIdx + 1}.${lessonNum}: `,
      videoUrl: '',
      duration: '15 Mins',
      thumbnail: '',
      description: '',
    });
    setChapters(updated);
  };

  // Remove Video Lesson
  const handleRemoveLesson = (chIdx: number, lesIdx: number) => {
    const updated = [...chapters];
    if (updated[chIdx].lessons.length <= 1) {
      alert('A chapter must have at least 1 video lesson.');
      return;
    }
    updated[chIdx].lessons = updated[chIdx].lessons.filter((_, idx) => idx !== lesIdx);
    setChapters(updated);
  };

  // Update Lesson Field
  const handleLessonChange = (
    chIdx: number,
    lesIdx: number,
    field: 'title' | 'videoUrl' | 'duration' | 'thumbnail' | 'description',
    val: string
  ) => {
    const updated = [...chapters];
    updated[chIdx].lessons[lesIdx][field] = val;
    setChapters(updated);
  };

  // Compress & set individual video thumbnail
  const handleLessonThumbnailFile = async (chIdx: number, lesIdx: number, file: File) => {
    try {
      const res = await compressThumbnail(file, { maxWidth: 640, maxHeight: 360, quality: 0.8 });
      const updated = [...chapters];
      updated[chIdx].lessons[lesIdx].thumbnail = res.dataUrl;
      updated[chIdx].lessons[lesIdx]._stats = {
        orig: formatBytes(res.originalSize),
        comp: formatBytes(res.compressedSize),
        saved: res.reductionPercentage,
      };
      setChapters(updated);
    } catch (err: any) {
      alert(err.message || 'Video thumbnail compression failed');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      category,
      level,
      duration,
      price: Number(price),
      instructor,
      description,
      status,
      thumbnail,
      chapters,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '880px' }}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>{course ? 'Edit Course Curriculum' : 'Create & Upload Course'}</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
              Upload course media with automatic thumbnail compression for instant, lightweight delivery.
            </p>
          </div>
          <button onClick={onClose} className={styles.closeModalBtn}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {/* 1. BASIC INFORMATION */}
            <div style={{ marginBottom: '22px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={16} color="#2563eb" /> 1. General Course Details
              </h4>
              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.formFullWidth}`}>
                  <label className={styles.formLabel}>Course Title *</label>
                  <input
                    type="text"
                    required
                    className={styles.formInput}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Full Stack Next.js 15 & Cloud Architecture Mastery"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category</label>
                  <select
                    className={styles.formSelect}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Web Development">Web Development</option>
                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                    <option value="Cloud & DevOps">Cloud & DevOps</option>
                    <option value="Computer Science Core">Computer Science Core</option>
                    <option value="Data Science & ML">Data Science & ML</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Difficulty Level</label>
                  <select
                    className={styles.formSelect}
                    value={level}
                    onChange={(e) => setLevel(e.target.value as any)}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="All Levels">All Levels</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Course Duration</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 12 Weeks"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Price (INR)</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    placeholder="0 for Free"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Lead Instructor</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    placeholder="e.g. Nitin Arya"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Status</label>
                  <select
                    className={styles.formSelect}
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                  >
                    <option value="active">Active (Published)</option>
                    <option value="draft">Draft (Hidden)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className={`${styles.formGroup} ${styles.formFullWidth}`}>
                  <label className={styles.formLabel}>Tags (comma separated)</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="React, Next.js, Node.js, MongoDB, TypeScript"
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.formFullWidth}`}>
                  <label className={styles.formLabel}>Description *</label>
                  <textarea
                    required
                    rows={3}
                    className={styles.formTextarea}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Comprehensive overview of syllabus and hands-on deliverables..."
                  />
                </div>
              </div>
            </div>

            {/* 2. COURSE THUMBNAIL (AUTO-COMPRESSED) */}
            <div
              style={{
                marginBottom: '26px',
                padding: '18px 20px',
                background: '#f8fafc',
                borderRadius: '14px',
                border: '1.5px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ImageIcon size={16} color="#2563eb" /> 2. Course Thumbnail (Auto-Compressed for Ultra-Fast UI)
                  </h4>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Upload any high-res image (PNG/JPG); it will automatically be optimized to ~40KB WebP.
                  </span>
                </div>
                {thumbnail && (
                  <button
                    type="button"
                    onClick={() => {
                      setThumbnail('');
                      setThumbnailStats(null);
                    }}
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Remove Thumbnail
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {thumbnail ? (
                  <div style={{ position: 'relative', width: '220px', height: '124px', borderRadius: '10px', overflow: 'hidden', border: '2px solid #2563eb', flexShrink: 0, background: '#0f172a' }}>
                    <img src={thumbnail} alt="Course Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ width: '220px', height: '124px', borderRadius: '10px', border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: '6px', flexShrink: 0, background: '#ffffff' }}>
                    <ImageIcon size={28} color="#cbd5e1" />
                    <span style={{ fontSize: '11px', fontWeight: 600 }}>16:9 Thumbnail</span>
                  </div>
                )}

                <div style={{ flex: 1, minWidth: '240px' }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '9px 16px',
                      borderRadius: '10px',
                      background: '#2563eb',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                    }}
                  >
                    <Upload size={15} />
                    {isCompressingMain ? 'Compressing...' : 'Upload Image File'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMainThumbnailFile}
                      style={{ display: 'none' }}
                      disabled={isCompressingMain}
                    />
                  </label>

                  {thumbnailStats && (
                    <div
                      style={{
                        marginTop: '10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 10px',
                        borderRadius: '8px',
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        color: '#065f46',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      <Zap size={13} color="#059669" />
                      Auto-Optimized: {thumbnailStats.orig} &rarr; {thumbnailStats.comp} ({thumbnailStats.saved}% smaller)
                    </div>
                  )}

                  <div style={{ marginTop: '10px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                      Or paste an external thumbnail image URL:
                    </span>
                    <input
                      type="url"
                      value={thumbnail}
                      onChange={(e) => setThumbnail(e.target.value)}
                      placeholder="https://images.unsplash.com/... or CDN link"
                      className={styles.formInput}
                      style={{ padding: '8px 12px', fontSize: '12px' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. CHAPTERS & VIDEO LESSONS (WITH PER-VIDEO AUTO-COMPRESSED THUMBNAILS) */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Film size={18} color="#2563eb" /> 3. Chapters & Video Lessons
                  </h4>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Organize multi-chapter courses. Every video lesson can have its own auto-compressed thumbnail.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddChapter}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1d4ed8',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={14} /> Add Chapter
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {chapters.map((ch, chIdx) => (
                  <div
                    key={ch.id || chIdx}
                    style={{
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '14px',
                      background: '#ffffff',
                      overflow: 'hidden',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    }}
                  >
                    {/* Chapter Header */}
                    <div
                      style={{
                        padding: '12px 18px',
                        background: '#f1f5f9',
                        borderBottom: '1.5px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <span style={{ fontWeight: 800, fontSize: '12px', color: '#475569', background: '#ffffff', padding: '3px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                          CH {chIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={ch.title}
                          onChange={(e) => handleChapterChange(chIdx, 'title', e.target.value)}
                          placeholder={`Chapter ${chIdx + 1} Title`}
                          style={{
                            flex: 1,
                            fontWeight: 700,
                            fontSize: '14px',
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: '#0f172a',
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => handleAddLesson(chIdx)}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            color: '#2563eb',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Plus size={12} /> Add Video
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveChapter(chIdx)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          title="Delete Chapter"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Chapter Description input */}
                    <div style={{ padding: '10px 18px 0 18px' }}>
                      <input
                        type="text"
                        value={ch.description || ''}
                        onChange={(e) => handleChapterChange(chIdx, 'description', e.target.value)}
                        placeholder="Chapter summary (optional, e.g. Core architectural principles)"
                        style={{
                          width: '100%',
                          fontSize: '12px',
                          color: '#64748b',
                          background: 'transparent',
                          border: 'none',
                          borderBottom: '1px dashed #e2e8f0',
                          paddingBottom: '6px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    {/* Lessons list */}
                    <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {ch.lessons.map((les, lesIdx) => (
                        <div
                          key={les.id || lesIdx}
                          style={{
                            padding: '12px',
                            borderRadius: '10px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Video size={14} color="#2563eb" />
                              <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                                Video Lesson {chIdx + 1}.{lesIdx + 1}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveLesson(chIdx, lesIdx)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Delete
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr 90px', gap: '10px', marginBottom: '10px' }}>
                            <input
                              type="text"
                              value={les.title}
                              onChange={(e) => handleLessonChange(chIdx, lesIdx, 'title', e.target.value)}
                              placeholder="Lesson Title"
                              className={styles.formInput}
                              style={{ fontSize: '12px', padding: '6px 10px' }}
                            />
                            <input
                              type="text"
                              value={les.videoUrl}
                              onChange={(e) => handleLessonChange(chIdx, lesIdx, 'videoUrl', e.target.value)}
                              placeholder="Video URL (YouTube/Vimeo/MP4)"
                              className={styles.formInput}
                              style={{ fontSize: '12px', padding: '6px 10px' }}
                            />
                            <input
                              type="text"
                              value={les.duration}
                              onChange={(e) => handleLessonChange(chIdx, lesIdx, 'duration', e.target.value)}
                              placeholder="15 Mins"
                              className={styles.formInput}
                              style={{ fontSize: '12px', padding: '6px 10px' }}
                            />
                          </div>

                          {/* Video Thumbnail Upload Row */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            {les.thumbnail ? (
                              <div style={{ width: '80px', height: '46px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #2563eb', flexShrink: 0, background: '#000' }}>
                                <img src={les.thumbnail} alt="Lesson Thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ) : (
                              <div style={{ width: '80px', height: '46px', borderRadius: '6px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexShrink: 0, background: '#fff' }}>
                                <ImageIcon size={16} />
                              </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
                              <label
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  background: '#ffffff',
                                  border: '1px solid #cbd5e1',
                                  color: '#1e293b',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                <Upload size={12} /> Auto-Compress Thumb
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleLessonThumbnailFile(chIdx, lesIdx, file);
                                  }}
                                />
                              </label>

                              <input
                                type="text"
                                value={les.thumbnail || ''}
                                onChange={(e) => handleLessonChange(chIdx, lesIdx, 'thumbnail', e.target.value)}
                                placeholder="or image URL"
                                className={styles.formInput}
                                style={{ fontSize: '11px', padding: '4px 8px', flex: 1 }}
                              />
                            </div>

                            {les._stats && (
                              <span style={{ fontSize: '10px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '3px 6px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                                ⚡ {les._stats.orig} &rarr; {les._stats.comp} ({les._stats.saved}% saved)
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn}>
              <Check size={16} /> Save Course & Curriculum
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// TRAINING / INTERNSHIP FORM MODAL COMPONENT (FULL CRUD)
// -------------------------------------------------------------
function TrainingFormModal({
  program,
  onClose,
  onSave,
}: {
  program: TrainingItem | null;
  onClose: () => void;
  onSave: (data: Partial<TrainingItem>) => void;
}) {
  const [modalTab, setModalTab] = useState<'basic' | 'pricing' | 'curriculum' | 'credentials'>('basic');

  // Basic Info
  const [title, setTitle] = useState(program?.title || '');
  const [subtitle, setSubtitle] = useState(program?.subtitle || '');
  const [track, setTrack] = useState(program?.track || 'Frontend Developer');
  const [domain, setDomain] = useState(program?.domain || 'Frontend Web Engineering & Next.js 14');
  const [type, setType] = useState<TrainingItem['type']>(program?.type || 'internship');
  const [mode, setMode] = useState(program?.mode || 'Live Online • Weekend Classes');
  const [status, setStatus] = useState<TrainingItem['status']>(program?.status || 'open');

  // Pricing & Schedule
  const [trainingPrice, setTrainingPrice] = useState(program?.trainingPrice !== undefined ? program.trainingPrice : 2400);
  const [originalPrice, setOriginalPrice] = useState(program?.originalPrice !== undefined ? program.originalPrice : 7999);
  const [internshipPrice, setInternshipPrice] = useState(program?.internshipPrice !== undefined ? program.internshipPrice : 0);
  const [stipendOrFee, setStipendOrFee] = useState(program?.stipendOrFee || '₹2,400 Tuition • Free 2-Month Internship');
  const [scheduleBadge, setScheduleBadge] = useState(program?.schedule?.badge || 'Weekend Live Batches');
  const [scheduleDays, setScheduleDays] = useState(program?.schedule?.days || 'Every Saturday & Sunday');
  const [scheduleTimings, setScheduleTimings] = useState(
    program?.schedule?.timings || 'Live Interactive Sessions + 24/7 Session Recordings'
  );
  const [duration, setDuration] = useState(program?.duration || '2 Months Internship + Training');
  const [trainingWeeks, setTrainingWeeks] = useState(program?.durations?.trainingWeeks || '4 Weeks Intensive Live Training');
  const [internshipWeeks, setInternshipWeeks] = useState(program?.durations?.internshipWeeks || '2 Months Hands-on Industrial Internship');
  const [deadline, setDeadline] = useState(program?.deadline || 'Rolling Admissions');

  // Curriculum & Projects
  const [sec1Title, setSec1Title] = useState(
    program?.sections?.[0]?.title || 'Section 1: Intensive Frontend Engineering Training'
  );
  const [sec1Tagline, setSec1Tagline] = useState(
    program?.sections?.[0]?.tagline || 'From Foundational Web Standards to Modern React 18+ & Next.js 14 Production Architectures'
  );
  const [minorProjectTitle, setMinorProjectTitle] = useState(
    program?.sections?.[1]?.title || 'SaaS Pulse • Modern Analytics & Productivity Dashboard'
  );
  const [minorProjectDesc, setMinorProjectDesc] = useState(
    program?.sections?.[1]?.description ||
      'Production-grade dashboard with reusable component architecture, theme switching, interactive charts, and responsive layouts.'
  );
  const [majorProjectTitle, setMajorProjectTitle] = useState(
    program?.sections?.[2]?.title || 'Binary Studio • Enterprise E-Learning & Collaborative Platform'
  );
  const [majorProjectDesc, setMajorProjectDesc] = useState(
    program?.sections?.[2]?.description ||
      'Commercial-grade web application featuring JWT auth, catalog browsing, video streaming with progress tracking, and Razorpay checkout integration.'
  );

  // Eligibility, Credentials & Perks
  const [eligibility, setEligibility] = useState(program?.eligibility || 'College Students, Freshers & Working Professionals');
  const [perks, setPerks] = useState(
    program?.perks?.join('\n') ||
      'Official Internship Certificate with unique verification ID\nLetter of Recommendation (LOR) signed by Lead Architect\n100% Free 2-Month Industrial Internship (₹0)\nWeekend Live Interactive Classes + 24/7 Recordings\nMinor Project (SaaS Pulse) & Major Project (Binary Studio)\nResume & LinkedIn profile optimization workshop'
  );

  // Auto-Fill Frontend Developer Standard Template
  const handleLoadFrontendTemplate = () => {
    setTitle('Frontend Developer Training & 2-Month Internship');
    setSubtitle(
      'Master Modern Web Development, Build Production Projects, and Complete a 2-Month Industrial Internship with 4 Verified Credentials'
    );
    setTrack('Frontend Developer');
    setDomain('Frontend Web Engineering & Next.js 14');
    setType('internship');
    setMode('Live Online • Weekend Classes');
    setStatus('open');
    setTrainingPrice(2400);
    setOriginalPrice(7999);
    setInternshipPrice(0);
    setStipendOrFee('₹2,400 Tuition • Free 2-Month Internship');
    setScheduleBadge('Weekend Live Batches');
    setScheduleDays('Every Saturday & Sunday');
    setScheduleTimings('Live Interactive Sessions + 24/7 Session Recordings');
    setDuration('2 Months Internship + Training');
    setTrainingWeeks('4 Weeks Intensive Live Training');
    setInternshipWeeks('2 Months Hands-on Industrial Internship');
    setDeadline('Rolling Admissions');
    setSec1Title('Section 1: Intensive Frontend Engineering Training');
    setSec1Tagline('From Foundational Web Standards to Modern React 18+ & Next.js 14 Production Architectures');
    setMinorProjectTitle('SaaS Pulse • Modern Analytics & Productivity Dashboard');
    setMinorProjectDesc(
      'Production-grade dashboard with reusable component architecture, theme switching, interactive charts, and responsive layouts.'
    );
    setMajorProjectTitle('Binary Studio • Enterprise E-Learning & Collaborative Platform');
    setMajorProjectDesc(
      'Commercial-grade web application featuring JWT auth, catalog browsing, video streaming with progress tracking, and Razorpay checkout integration.'
    );
    setEligibility('College Students, Freshers & Working Professionals');
    setPerks(
      'Official Internship Certificate with unique verification ID\nLetter of Recommendation (LOR) signed by Lead Architect\n100% Free 2-Month Industrial Internship (₹0)\nWeekend Live Interactive Classes + 24/7 Recordings\nMinor Project (SaaS Pulse) & Major Project (Binary Studio)\nResume & LinkedIn profile optimization workshop'
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formattedSections = [
      {
        id: 'section-1-training',
        number: 1,
        title: sec1Title,
        tagline: sec1Tagline,
        description: 'Comprehensive, mentor-led weekend live classes with hands-on code walkthroughs and assignments.',
        modules: program?.sections?.[0]?.modules || [
          { moduleNumber: '1.1', title: 'Semantic HTML5, Modern CSS3 & Responsive Architecture' },
          { moduleNumber: '1.2', title: 'Modern JavaScript (ES6+) & Asynchronous Mastery' },
          { moduleNumber: '1.3', title: 'TypeScript for Scalable Frontend Systems' },
          { moduleNumber: '1.4', title: 'React 18+ Deep Dive & State Architecture' },
          { moduleNumber: '1.5', title: 'Next.js 14 App Router & Full-Stack Capabilities' },
          { moduleNumber: '1.6', title: 'Developer Tooling, Git & Deployment Pipelines' },
        ],
      },
      {
        id: 'section-2-minor-project',
        number: 2,
        title: minorProjectTitle,
        description: minorProjectDesc,
      },
      {
        id: 'section-3-major-project',
        number: 3,
        title: majorProjectTitle,
        description: majorProjectDesc,
      },
    ];

    const formattedCredentials = [
      { id: 'cred-1', title: 'Letter of Recommendation (LOR)', issuedBy: 'Binary Vidya Technical Board' },
      { id: 'cred-2', title: 'Internship Completion Certificate', issuedBy: 'Binary Vidya Technical Academy' },
      { id: 'cred-3', title: 'Training Certificate', issuedBy: 'Binary Vidya Faculty' },
      { id: 'cred-4', title: 'Outstanding & Excellence Certificate', issuedBy: 'Honors Committee' },
    ];

    onSave({
      title,
      subtitle,
      track,
      domain,
      type,
      duration,
      mode,
      stipendOrFee: stipendOrFee || `₹${trainingPrice} Tuition • Free Internship`,
      trainingPrice: Number(trainingPrice),
      originalPrice: Number(originalPrice),
      internshipPrice: Number(internshipPrice),
      schedule: {
        badge: scheduleBadge,
        days: scheduleDays,
        timings: scheduleTimings,
        flexibility: eligibility,
      },
      durations: {
        total: duration,
        trainingWeeks,
        internshipWeeks,
      },
      sections: formattedSections,
      credentials: formattedCredentials,
      eligibility,
      deadline,
      status,
      perks: perks.split('\n').map((p) => p.trim()).filter(Boolean),
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} style={{ maxWidth: '840px', maxHeight: '92vh' }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GraduationCap size={20} />
            </div>
            <div>
              <h3 className={styles.modalTitle} style={{ margin: 0 }}>
                {program ? 'Edit Training & Internship Program' : 'Add New Training & Internship Program'}
              </h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Manage track, weekend schedules, curriculum sections, and completion credentials.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {!program && (
              <button
                type="button"
                onClick={handleLoadFrontendTemplate}
                className={styles.templateLoadBtn}
                title="Populate with Frontend Developer standard curriculum"
              >
                <Zap size={14} color="#2563eb" /> Auto-Fill Frontend Template
              </button>
            )}
            <button onClick={onClose} className={styles.closeModalBtn}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Subnavigation */}
        <div className={styles.modalSubNav}>
          <button
            type="button"
            onClick={() => setModalTab('basic')}
            className={`${styles.modalSubNavBtn} ${modalTab === 'basic' ? styles.modalSubNavBtnActive : ''}`}
          >
            1. Track &amp; Overview
          </button>
          <button
            type="button"
            onClick={() => setModalTab('pricing')}
            className={`${styles.modalSubNavBtn} ${modalTab === 'pricing' ? styles.modalSubNavBtnActive : ''}`}
          >
            2. Tuition &amp; Schedule
          </button>
          <button
            type="button"
            onClick={() => setModalTab('curriculum')}
            className={`${styles.modalSubNavBtn} ${modalTab === 'curriculum' ? styles.modalSubNavBtnActive : ''}`}
          >
            3. 3 Curriculum Sections &amp; Projects
          </button>
          <button
            type="button"
            onClick={() => setModalTab('credentials')}
            className={`${styles.modalSubNavBtn} ${modalTab === 'credentials' ? styles.modalSubNavBtnActive : ''}`}
          >
            4. Credentials &amp; Perks
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody} style={{ padding: '24px' }}>
            {/* TAB 1: BASIC INFO & TRACK */}
            {modalTab === 'basic' && (
              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.formFullWidth}`}>
                  <label className={styles.formLabel}>Program Title *</label>
                  <input
                    type="text"
                    required
                    className={styles.formInput}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Frontend Developer Training & 2-Month Internship"
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.formFullWidth}`}>
                  <label className={styles.formLabel}>Subtitle / Program Overview</label>
                  <textarea
                    rows={2}
                    className={styles.formTextarea}
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. Master Modern Web Development, Build Production Projects, and Complete a 2-Month Industrial Internship..."
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Role / Track *</label>
                  <input
                    type="text"
                    required
                    className={styles.formInput}
                    value={track}
                    onChange={(e) => setTrack(e.target.value)}
                    placeholder="e.g. Frontend Developer"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Domain / Core Technologies *</label>
                  <input
                    type="text"
                    required
                    className={styles.formInput}
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="e.g. Frontend Web Engineering & Next.js 14"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Program Type</label>
                  <select
                    className={styles.formSelect}
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                  >
                    <option value="internship">Internship + Training</option>
                    <option value="training">Industrial Training Only</option>
                    <option value="bootcamp">Bootcamp</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Work &amp; Class Mode</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    placeholder="e.g. Live Online • Weekend Classes"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Enrollment Status</label>
                  <select
                    className={styles.formSelect}
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                  >
                    <option value="open">Open (Accepting Enrollments)</option>
                    <option value="ongoing">Ongoing (In Progress)</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            )}

            {/* TAB 2: PRICING & SCHEDULE */}
            {modalTab === 'pricing' && (
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Training Tuition Fee (INR) *</label>
                  <input
                    type="number"
                    required
                    className={styles.formInput}
                    value={trainingPrice}
                    onChange={(e) => setTrainingPrice(Number(e.target.value))}
                    placeholder="e.g. 2400"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Original Tuition Price (Strikethrough)</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(Number(e.target.value))}
                    placeholder="e.g. 7999"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>2-Month Internship Fee (INR)</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={internshipPrice}
                    onChange={(e) => setInternshipPrice(Number(e.target.value))}
                    placeholder="0 for 100% Free Bundled"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Stipend / Fee Label Display</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={stipendOrFee}
                    onChange={(e) => setStipendOrFee(e.target.value)}
                    placeholder="e.g. ₹2,400 Tuition • Free 2-Month Internship"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Schedule Badge</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={scheduleBadge}
                    onChange={(e) => setScheduleBadge(e.target.value)}
                    placeholder="e.g. Weekend Live Batches"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Class Days</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={scheduleDays}
                    onChange={(e) => setScheduleDays(e.target.value)}
                    placeholder="e.g. Every Saturday & Sunday"
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.formFullWidth}`}>
                  <label className={styles.formLabel}>Session Timings &amp; Recordings Info</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={scheduleTimings}
                    onChange={(e) => setScheduleTimings(e.target.value)}
                    placeholder="e.g. Live Interactive Sessions + 24/7 Session Recordings"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Total Duration</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 2 Months Internship + Training"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Application Deadline</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    placeholder="e.g. Rolling Admissions"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: CURRICULUM SECTIONS & PROJECTS */}
            {modalTab === 'curriculum' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Section 1 */}
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={18} color="#2563eb" /> Section 1: Intensive Engineering Training
                  </div>
                  <div className={styles.formGrid}>
                    <div className={`${styles.formGroup} ${styles.formFullWidth}`}>
                      <label className={styles.formLabel}>Section 1 Title</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={sec1Title}
                        onChange={(e) => setSec1Title(e.target.value)}
                      />
                    </div>
                    <div className={`${styles.formGroup} ${styles.formFullWidth}`}>
                      <label className={styles.formLabel}>Section 1 Tagline</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={sec1Tagline}
                        onChange={(e) => setSec1Tagline(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Minor Project */}
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={18} color="#059669" /> Section 2: Minor Project
                  </div>
                  <div className={styles.formGrid}>
                    <div className={`${styles.formGroup} ${styles.formFullWidth}`}>
                      <label className={styles.formLabel}>Minor Project Title</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={minorProjectTitle}
                        onChange={(e) => setMinorProjectTitle(e.target.value)}
                      />
                    </div>
                    <div className={`${styles.formGroup} ${styles.formFullWidth}`}>
                      <label className={styles.formLabel}>Minor Project Scope &amp; Architecture</label>
                      <textarea
                        rows={2}
                        className={styles.formTextarea}
                        value={minorProjectDesc}
                        onChange={(e) => setMinorProjectDesc(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Major Project */}
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={18} color="#7c3aed" /> Section 3: Major Project
                  </div>
                  <div className={styles.formGrid}>
                    <div className={`${styles.formGroup} ${styles.formFullWidth}`}>
                      <label className={styles.formLabel}>Major Project Title</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={majorProjectTitle}
                        onChange={(e) => setMajorProjectTitle(e.target.value)}
                      />
                    </div>
                    <div className={`${styles.formGroup} ${styles.formFullWidth}`}>
                      <label className={styles.formLabel}>Major Project Scope &amp; Deliverables</label>
                      <textarea
                        rows={2}
                        className={styles.formTextarea}
                        value={majorProjectDesc}
                        onChange={(e) => setMajorProjectDesc(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: CREDENTIALS & PERKS */}
            {modalTab === 'credentials' && (
              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.formFullWidth}`}>
                  <label className={styles.formLabel}>Eligibility Criteria</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={eligibility}
                    onChange={(e) => setEligibility(e.target.value)}
                    placeholder="e.g. College Students, Freshers & Working Professionals"
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.formFullWidth}`}>
                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: '#065f46', marginBottom: '4px' }}>
                      4 Official Completion Credentials Automatically Bundled:
                    </div>
                    <div style={{ fontSize: '12px', color: '#047857', lineHeight: 1.5 }}>
                      1. Letter of Recommendation (LOR) • 2. Industrial Internship Certificate • 3. Framework Mastery Certificate • 4. Outstanding Honors Certificate
                    </div>
                  </div>
                </div>

                <div className={`${styles.formGroup} ${styles.formFullWidth}`}>
                  <label className={styles.formLabel}>Program Highlights &amp; Perks (one per line)</label>
                  <textarea
                    rows={6}
                    className={styles.formTextarea}
                    value={perks}
                    onChange={(e) => setPerks(e.target.value)}
                    placeholder="Official Internship Certificate&#10;Letter of Recommendation&#10;PPO Opportunity"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}>
              <Check size={16} /> Save Program &amp; Publish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// CAREER FORM MODAL COMPONENT
// -------------------------------------------------------------
function CareerFormModal({
  career,
  onClose,
  onSave,
}: {
  career: CareerItem | null;
  onClose: () => void;
  onSave: (data: Partial<CareerItem>) => void;
}) {
  const [title, setTitle] = useState(career?.title || '');
  const [department, setDepartment] = useState(career?.department || 'Curriculum & Instruction');
  const [employmentType, setEmploymentType] = useState<CareerItem['employmentType']>(
    career?.employmentType || 'full-time'
  );
  const [location, setLocation] = useState(career?.location || 'Remote (India)');
  const [experience, setExperience] = useState(career?.experience || '2-5 Years');
  const [salary, setSalary] = useState(career?.salary || 'Competitive (Market Standard)');
  const [description, setDescription] = useState(career?.description || '');
  const [status, setStatus] = useState<CareerItem['status']>(career?.status || 'active');
  const [requirements, setRequirements] = useState(
    career?.requirements?.join('\n') ||
      'Solid hands-on software development expertise\nStrong communication & mentoring skills'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      department,
      employmentType,
      location,
      experience,
      salary,
      description,
      status,
      requirements: requirements.split('\n').map((r) => r.trim()).filter(Boolean),
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {career ? 'Edit Career Opening' : 'Post New Career Opportunity'}
          </h3>
          <button onClick={onClose} className={styles.closeModalBtn}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGrid}>
              <div className={`${styles.formGroup} ${styles.formFullWidth}`}>
                <label className={styles.formLabel}>Job Title *</label>
                <input
                  type="text"
                  required
                  className={styles.formInput}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Lead Full Stack Instructor"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Department *</label>
                <select
                  className={styles.formSelect}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="Curriculum & Instruction">Curriculum & Instruction</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Student Operations">Student Operations</option>
                  <option value="Marketing & Growth">Marketing & Growth</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Employment Type</label>
                <select
                  className={styles.formSelect}
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as any)}
                >
                  <option value="full-time">Full-Time</option>
                  <option value="part-time">Part-Time</option>
                  <option value="contract">Contract</option>
                  <option value="remote">Remote</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Location</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Remote (India) / Bangalore"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Experience Required</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="e.g. 2-4 Years"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Compensation / Salary</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="e.g. ₹12,00,000 - ₹18,00,000 PA"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Hiring Status</label>
                <select
                  className={styles.formSelect}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="active">Active (Open)</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className={`${styles.formGroup} ${styles.formFullWidth}`}>
                <label className={styles.formLabel}>Job Summary & Description *</label>
                <textarea
                  required
                  className={styles.formTextarea}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Overview of the role and key impact..."
                />
              </div>

              <div className={`${styles.formGroup} ${styles.formFullWidth}`}>
                <label className={styles.formLabel}>Key Requirements (one per line)</label>
                <textarea
                  className={styles.formTextarea}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="3+ years production Next.js experience&#10;Excellent communication skills"
                />
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn}>
              <Check size={16} /> Post Opening
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
