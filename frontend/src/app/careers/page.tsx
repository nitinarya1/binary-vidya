'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  MapPin,
  Clock,
  IndianRupee,
  ArrowRight,
  Sparkles,
  Users,
  Laptop,
  Coffee,
  X,
  Send,
} from 'lucide-react';
import styles from './careers.module.css';

interface JobOpening {
  id: string;
  title: string;
  slug: string;
  department: string;
  employmentType: string;
  location: string;
  experience: string;
  salary: string;
  description: string;
  requirements?: string[];
  status: string;
}

export default function CareersPage() {
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('all');
  const [activeJobModal, setActiveJobModal] = useState<JobOpening | null>(null);
  const [applySubmitted, setApplySubmitted] = useState(false);
  const [applyForm, setApplyForm] = useState({
    name: '',
    email: '',
    phone: '',
    resumeLink: '',
    notes: '',
  });

  useEffect(() => {
    async function loadCareers() {
      try {
        setLoading(true);
        const res = await fetch('/api/careers');
        const data = await res.json();
        if (data.success && Array.isArray(data.careers)) {
          setJobs(data.careers);
        }
      } catch (err) {
        console.error('Failed to load careers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCareers();
  }, []);

  const departments = ['all', ...Array.from(new Set(jobs.map((j) => j.department)))];

  const filteredJobs = jobs.filter((j) => {
    if (selectedDept !== 'all' && j.department !== selectedDept) return false;
    return true;
  });

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApplySubmitted(true);
    setTimeout(() => {
      setApplySubmitted(false);
      setActiveJobModal(null);
      setApplyForm({ name: '', email: '', phone: '', resumeLink: '', notes: '' });
      alert('Application received! Our recruitment team will review your profile within 48 hours.');
    }, 1200);
  };

  return (
    <div className={styles.container}>
      {/* Top Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navWrapper}>
          <Link href="/" className={styles.brandLink}>
            <img
              src="/images/binary-vidya-logo.png"
              alt="Binary Vidya"
              className={styles.brandLogoImg}
            />
          </Link>

          <div className={styles.navLinks}>
            <Link href="/" className={styles.navLink}>
              Home
            </Link>
            <Link href="/#courses" className={styles.navLink}>
              Courses
            </Link>
            <Link href="/training-and-internship" className={styles.navLinkHighlight}>
              <Sparkles size={14} /> Training &amp; Internships
            </Link>
            <Link href="/verify-certificate" className={styles.navLink}>
              Verify Certificate
            </Link>
          </div>

          <div className={styles.navActions}>
            <Link href="/login" className={styles.loginBtn}>
              Sign In
            </Link>
            <a href="#openings" className={styles.primaryBtn}>
              View Open Roles
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.badge}>
          <Sparkles size={15} /> Join the Binary Vidya Team
        </div>
        <h1 className={styles.heroTitle}>
          Build the Future of <span className={styles.heroGradient}>Engineering Education</span>
        </h1>
        <p className={styles.heroSubtitle}>
          We are empowering the next generation of software developers and engineers with hands-on industrial mentorship, production projects, and verified credentials. Join our passionate remote-first team!
        </p>

        <div className={styles.heroMetrics}>
          <div className={styles.metricItem}>
            <div className={styles.metricVal}>15,000+</div>
            <div className={styles.metricLabel}>Learners Impacted</div>
          </div>
          <div className={styles.metricDivider} />
          <div className={styles.metricItem}>
            <div className={styles.metricVal}>100%</div>
            <div className={styles.metricLabel}>Remote-First Flexibility</div>
          </div>
          <div className={styles.metricDivider} />
          <div className={styles.metricItem}>
            <div className={styles.metricVal}>4.9/5</div>
            <div className={styles.metricLabel}>Glassdoor Rating</div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className={styles.perksSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Why Work at Binary Vidya?</h2>
          <p className={styles.sectionSubtitle}>
            We invest deeply in our team members with competitive pay, autonomy, and work-life balance.
          </p>
        </div>

        <div className={styles.perksGrid}>
          <div className={styles.perkCard}>
            <div className={styles.perkIconWrap}>
              <Laptop size={24} color="#2563eb" />
            </div>
            <h3>100% Remote Flexibility</h3>
            <p>Work from anywhere in India. Flexible working hours that respect your rhythm and deep work time.</p>
          </div>

          <div className={styles.perkCard}>
            <div className={styles.perkIconWrap}>
              <IndianRupee size={24} color="#059669" />
            </div>
            <h3>Competitive Compensation</h3>
            <p>Industry-leading salaries, performance bonuses, and equity options for core leadership roles.</p>
          </div>

          <div className={styles.perkCard}>
            <div className={styles.perkIconWrap}>
              <Users size={24} color="#0284c7" />
            </div>
            <h3>Impactful Mentorship</h3>
            <p>Directly mentor college students and freshers, helping them transition into high-paying SDE careers.</p>
          </div>

          <div className={styles.perkCard}>
            <div className={styles.perkIconWrap}>
              <Coffee size={24} color="#7c3aed" />
            </div>
            <h3>Learning &amp; Wellness Stipend</h3>
            <p>Annual budget for books, cloud certifications (AWS/GCP), conferences, and high-speed home office gear.</p>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="openings" className={styles.openingsSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.badge} style={{ margin: '0 auto 12px' }}>
            <Briefcase size={14} /> Current Job Openings
          </div>
          <h2 className={styles.sectionTitle}>Explore Open Positions</h2>
          <p className={styles.sectionSubtitle}>
            Find a role where you can thrive and shape the careers of thousands of engineers.
          </p>
        </div>

        {/* Filter Pills */}
        <div className={styles.filterBar}>
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`${styles.filterBtn} ${selectedDept === dept ? styles.filterBtnActive : ''}`}
            >
              {dept === 'all' ? 'All Roles' : dept}
            </button>
          ))}
        </div>

        {/* Job Cards */}
        {loading ? (
          <div className={styles.loadingBox}>Loading active opportunities...</div>
        ) : filteredJobs.length === 0 ? (
          <div className={styles.emptyBox}>No open roles in this category right now. Check back soon!</div>
        ) : (
          <div className={styles.jobsList}>
            {filteredJobs.map((job) => (
              <div key={job.id} className={styles.jobCard}>
                <div className={styles.jobInfo}>
                  <div className={styles.jobPills}>
                    <span className={styles.deptPill}>{job.department}</span>
                    <span className={styles.typePill}>{job.employmentType}</span>
                  </div>
                  <h3 className={styles.jobTitle}>{job.title}</h3>
                  <p className={styles.jobDesc}>{job.description}</p>
                  <div className={styles.jobMeta}>
                    <span className={styles.metaItem}>
                      <MapPin size={14} /> {job.location}
                    </span>
                    <span className={styles.metaItem}>
                      <Clock size={14} /> {job.experience}
                    </span>
                    <span className={styles.metaItem}>
                      <IndianRupee size={14} /> {job.salary}
                    </span>
                  </div>
                </div>

                <div className={styles.jobAction}>
                  <button
                    onClick={() => setActiveJobModal(job)}
                    className={styles.applyBtn}
                  >
                    Apply Now <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Application Modal */}
      {activeJobModal && (
        <div className={styles.modalOverlay} onClick={() => setActiveJobModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.deptPill}>{activeJobModal.department}</span>
                <h3 className={styles.modalJobTitle}>{activeJobModal.title}</h3>
                <div className={styles.modalMeta}>
                  <span>{activeJobModal.location}</span> • <span>{activeJobModal.salary}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveJobModal(null)}
                className={styles.modalCloseBtn}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={applyForm.name}
                  onChange={(e) => setApplyForm({ ...applyForm, name: e.target.value })}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={applyForm.email}
                    onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Phone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9876543210"
                    value={applyForm.phone}
                    onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Resume / Portfolio Link (Google Drive, LinkedIn, or GitHub) *</label>
                <input
                  type="url"
                  required
                  placeholder="https://linkedin.com/in/username or drive link"
                  value={applyForm.resumeLink}
                  onChange={(e) => setApplyForm({ ...applyForm, resumeLink: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Why do you want to join Binary Vidya? (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Share a brief intro about your experience and passion..."
                  value={applyForm.notes}
                  onChange={(e) => setApplyForm({ ...applyForm, notes: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setActiveJobModal(null)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applySubmitted}
                  className={styles.submitBtn}
                >
                  {applySubmitted ? 'Submitting...' : 'Submit Application'} <Send size={15} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerWrapper}>
          <div className={styles.footerBrand}>
            <img
              src="/images/binary-vidya-logo.png"
              alt="Binary Vidya"
              className={styles.footerLogoImg}
            />
            <p>
              Binary Vidya Careers • Empowering passionate educators, engineers, and student leaders across India.
            </p>
          </div>
          <div className={styles.footerLinks}>
            <Link href="/">Home</Link>
            <Link href="/#courses">Courses</Link>
            <Link href="/training-and-internship">Training &amp; Internships</Link>
            <Link href="/verify-certificate">Verify Certificate</Link>
            <a href="mailto:careers@binaryvidya.com">careers@binaryvidya.com</a>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <div>&copy; {new Date().getFullYear()} Binary Vidya Inc. All rights reserved.</div>
          <div>Equal Opportunity Employer • Remote-First Culture</div>
        </div>
      </footer>
    </div>
  );
}
