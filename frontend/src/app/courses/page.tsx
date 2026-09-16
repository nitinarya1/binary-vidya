'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import styles from './courses.module.css';
import {
  Search,
  BookOpen,
  Layers,
  Video,
  Clock,
  Star,
  ArrowRight,
  Sparkles,
  Filter,
  X,
  PlayCircle,
  Film,
  CheckCircle2,
  ChevronRight,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

interface VideoLesson {
  id?: string;
  title: string;
  videoUrl: string;
  duration: string;
  thumbnail?: string;
  description?: string;
}

interface Chapter {
  id?: string;
  title: string;
  description?: string;
  lessons: VideoLesson[];
}

interface CourseItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  price: number;
  instructor: string;
  thumbnail?: string;
  tags?: string[];
  chapters?: Chapter[];
  chaptersCount?: number;
  totalLessons?: number;
  rating?: number;
  enrolledCount?: number;
}

export default function CoursesCatalogPage() {
  const { user, logout, isLoading: authLoading, isAdmin } = useAuth();

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [previewCourse, setPreviewCourse] = useState<CourseItem | null>(null);

  // Fetch courses from backend
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedLevel !== 'all') params.append('level', selectedLevel);
      if (search.trim()) params.append('search', search.trim());

      const url = `/api/courses?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.courses)) {
        setCourses(data.courses);
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
        }
      }
    } catch (err) {
      console.error('Failed to fetch courses catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCourses();
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedCategory, selectedLevel, search]);

  return (
    <div className={styles.pageContainer}>
      {/* Navigation Bar */}
      <nav className={styles.navbar}>
        <div className={styles.navWrapper}>
          <Link href="/" className={styles.brandLink}>
            <div className={styles.brandLogo}>BV</div>
            <div>
              <div className={styles.brandName}>Binary Vidya</div>
              <div className={styles.brandTagline}>Technical Academy</div>
            </div>
          </Link>

          <div className={styles.navLinks}>
            <Link href="/" className={styles.navLink}>
              Home
            </Link>
            <Link href="/courses" className={`${styles.navLink} ${styles.navLinkActive}`}>
              Courses
            </Link>
            <a href="/#features" className={styles.navLink}>
              Features
            </a>
            <a href="/#about" className={styles.navLink}>
              About Us
            </a>
          </div>

          <div className={styles.navActions}>
            {authLoading ? (
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>Loading...</div>
            ) : user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link
                  href="/my-learning"
                  id="nav-my-learning-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    background: 'rgba(37, 99, 235, 0.1)',
                    color: '#2563eb',
                    border: '1px solid rgba(147, 197, 253, 0.5)',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <BookOpen size={15} /> My Learning
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin/dashboard"
                    id="nav-admin-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      background: 'rgba(15, 23, 42, 0.06)',
                      color: '#0f172a',
                      border: '1px solid #cbd5e1',
                      textDecoration: 'none',
                    }}
                  >
                    Admin
                  </Link>
                )}
                <div className={styles.userPill}>
                  <Link
                    href="/profile"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit' }}
                    title="View & Edit Profile"
                  >
                    <div className={styles.userAvatar}>
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      ) : (
                        user.name ? user.name.charAt(0).toUpperCase() : 'U'
                      )}
                    </div>
                    <div className={styles.userName}>{user.name}</div>
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link href="/login" className={styles.signInBtn}>
                  Sign In
                </Link>
                <Link href="/login" className={styles.signUpBtn}>
                  Get Started <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Catalog Hero Banner */}
      <header className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <Sparkles size={14} color="#60a5fa" /> Verified Engineering Curricula
          </div>
          <h1 className={styles.heroTitle}>Master In-Demand Technical Specializations</h1>
          <p className={styles.heroSubtitle}>
            Browse our complete collection of industry-designed masterclasses with multi-chapter video tracks, hands-on architectural codebases, and verified certifications.
          </p>

          {/* Search & Filter Control Bar */}
          <div className={styles.searchBarWrapper}>
            <div className={styles.searchInputBox}>
              <Search size={18} color="#94a3b8" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses by title, topic, or instructor (e.g. Next.js, Docker, DSA)..."
                className={styles.searchInput}
              />
              {search && (
                <button onClick={() => setSearch('')} className={styles.clearSearchBtn}>
                  <X size={16} />
                </button>
              )}
            </div>

            <div className={styles.filterDropdownWrapper}>
              <Filter size={16} color="#64748b" />
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Difficulty Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className={styles.mainContainer}>
        {/* Category Pills Bar */}
        <div className={styles.categoryPillsRow}>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`${styles.catPill} ${selectedCategory === 'all' ? styles.catPillActive : ''}`}
          >
            All Tracks
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`${styles.catPill} ${selectedCategory === cat ? styles.catPillActive : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results Header */}
        <div className={styles.resultsMetaRow}>
          <div>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
              Showing {courses.length} {courses.length === 1 ? 'Masterclass' : 'Masterclasses'}
            </span>
            {selectedCategory !== 'all' && (
              <span style={{ fontSize: '13px', color: '#64748b', marginLeft: '6px' }}>
                in {selectedCategory}
              </span>
            )}
          </div>

          {(selectedCategory !== 'all' || selectedLevel !== 'all' || search) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedLevel('all');
                setSearch('');
              }}
              className={styles.resetFiltersBtn}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className={styles.coursesGrid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={styles.courseCard} style={{ opacity: 0.6 }}>
                <div style={{ height: '180px', background: '#f1f5f9' }} />
                <div style={{ padding: '24px' }}>
                  <div style={{ height: '14px', width: '35%', background: '#e2e8f0', borderRadius: '4px', marginBottom: '12px' }} />
                  <div style={{ height: '22px', width: '85%', background: '#e2e8f0', borderRadius: '4px', marginBottom: '12px' }} />
                  <div style={{ height: '48px', width: '100%', background: '#f8fafc', borderRadius: '4px', marginBottom: '16px' }} />
                  <div style={{ height: '18px', width: '50%', background: '#e2e8f0', borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className={styles.emptyStateCard}>
            <BookOpen size={48} color="#94a3b8" style={{ marginBottom: '14px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>
              No matching courses found
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '440px', margin: '0 auto 20px' }}>
              We couldn&apos;t find any masterclasses matching your search criteria. Try adjusting your query or filters.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedLevel('all');
                setSearch('');
              }}
              className={styles.catPillActive}
              style={{ padding: '10px 24px', borderRadius: '10px', cursor: 'pointer', border: 'none' }}
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className={styles.coursesGrid}>
            {courses.map((course) => (
              <div key={course.id} className={styles.courseCard}>
                {/* Course Thumbnail */}
                {course.thumbnail ? (
                  <div className={styles.thumbnailWrapper}>
                    <img src={course.thumbnail} alt={course.title} className={styles.thumbnailImg} />
                    <div className={styles.thumbnailOverlay}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className={styles.levelBadge}>{course.level || 'All Levels'}</span>
                        <span style={{ fontSize: '11px', color: '#ffffff', fontWeight: 700, background: 'rgba(0,0,0,0.65)', padding: '2px 8px', borderRadius: '4px' }}>
                          {course.duration}
                        </span>
                      </div>
                      <div className={styles.categoryTrackBadge}>{course.category}</div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.courseBanner}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className={styles.categoryTrackBadge}>{course.category}</div>
                      <span className={styles.levelBadge}>{course.level || 'All Levels'}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#dbeafe', fontWeight: 600 }}>
                      {course.duration} • {course.totalLessons || 15} Lessons
                    </div>
                  </div>
                )}

                {/* Course Body */}
                <div className={styles.courseBody}>
                  <div className={styles.courseRating}>
                    <Star size={15} fill="#f59e0b" color="#f59e0b" />
                    <span>{course.rating || 4.9}</span>
                    <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 500 }}>
                      ({(course.enrolledCount || 150).toLocaleString()} students)
                    </span>
                  </div>

                  <h3 className={styles.courseTitle}>{course.title}</h3>
                  <p className={styles.courseDesc}>{course.description}</p>

                  <div className={styles.instructorInfo}>
                    By <strong>{course.instructor || 'Binary Vidya Faculty'}</strong>
                  </div>

                  {/* Modules & Chapters Metadata */}
                  <div className={styles.metaRow}>
                    <span className={styles.metaItem}>
                      <Layers size={14} color="#2563eb" />
                      <strong>{course.chaptersCount || course.chapters?.length || 1}</strong> Chapters
                    </span>
                    <span>•</span>
                    <span className={styles.metaItem}>
                      <Video size={14} color="#2563eb" />
                      <strong>{course.totalLessons || 15}</strong> Video Lectures
                    </span>
                  </div>

                  {/* View Syllabus CTA */}
                  {course.chapters && course.chapters.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPreviewCourse(course)}
                      className={styles.viewSyllabusBtn}
                    >
                      <PlayCircle size={14} /> View Syllabus &amp; Video Lessons
                    </button>
                  )}

                  {/* Footer Action */}
                  <div className={styles.courseFooter}>
                    <div>
                      <span className={styles.priceLabel}>Price</span>
                      <div className={styles.priceAmount}>
                        {course.price && course.price > 0 ? `₹${course.price.toLocaleString('en-IN')}` : 'Free Access'}
                      </div>
                    </div>
                    <Link href={`/courses/${course.slug || course.id}`} className={styles.enrollBtn}>
                      Enroll Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Interactive Syllabus Preview Modal */}
      {previewCourse && (
        <div className={styles.modalOverlay} onClick={() => setPreviewCourse(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.levelBadge} style={{ marginBottom: '6px' }}>
                  {previewCourse.category}
                </span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {previewCourse.title}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  Curriculum Structure • {previewCourse.chapters?.length || 0} Chapters • {previewCourse.totalLessons || 0} Lectures • Instructor: {previewCourse.instructor}
                </p>
              </div>
              <button onClick={() => setPreviewCourse(null)} className={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {previewCourse.chapters && previewCourse.chapters.length > 0 ? (
                previewCourse.chapters.map((ch, chIdx) => (
                  <div key={ch.id || chIdx} className={styles.chapterCard}>
                    <div className={styles.chapterHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, background: '#2563eb', color: '#fff', padding: '3px 8px', borderRadius: '4px' }}>
                          CH {chIdx + 1}
                        </span>
                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>{ch.title}</strong>
                      </div>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                        {ch.lessons?.length || 0} Video Lessons
                      </span>
                    </div>

                    {ch.description && (
                      <p style={{ margin: '8px 16px', fontSize: '12px', color: '#64748b' }}>
                        {ch.description}
                      </p>
                    )}

                    <div>
                      {ch.lessons && ch.lessons.map((les, lIdx) => (
                        <div key={les.id || lIdx} className={styles.lessonRow}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                            {les.thumbnail ? (
                              <img src={les.thumbnail} alt={les.title} className={styles.lessonThumb} />
                            ) : (
                              <div className={styles.lessonThumb} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                <Film size={16} />
                              </div>
                            )}
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                                {les.title}
                              </div>
                              {les.description && (
                                <div style={{ fontSize: '11px', color: '#64748b' }}>{les.description}</div>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                            <Clock size={12} /> {les.duration || '15 Mins'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No syllabus uploaded yet for this course.
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '12px' }}>
                <button onClick={() => setPreviewCourse(null)} className={styles.modalCancelBtn}>
                  Close
                </button>
                <Link href={`/courses/${previewCourse.slug || previewCourse.id}`} className={styles.modalEnrollBtn}>
                  Enroll in this Masterclass <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
