'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { isSuperAdminEmail, isRootSuperAdminEmail } from '../../lib/auth-helpers';
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
  ArrowRight,
  UserPlus,
  UserCheck,
  ShieldAlert,
  Key,
  Settings2,
  UserX,
  CheckSquare,
  Square,
  Tag,
  Percent,
  IndianRupee,
  Copy,
  FileText,
  Loader2,
} from 'lucide-react';
import { compressThumbnail, formatBytes } from '../../lib/imageCompressor';
import { CouponAdminModal, CouponItem } from '../../components/CouponAdminModal';

// Data Interfaces
export interface VideoLessonItem {
  id?: string;
  title: string;
  videoUrl: string;
  videoName?: string;
  pptUrl?: string;
  pptName?: string;
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
  originalPrice?: number;
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
  description?: string;
  thumbnail?: string;
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

export interface TeamMemberPermissions {
  manageCourses: boolean;
  manageTraining: boolean;
  manageCareers: boolean;
  viewAnalytics: boolean;
  manageCertificates: boolean;
  manageTeam?: boolean;
}

export interface TeamMemberItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  role: string;
  isSuperAdmin: boolean;
  isRootSuperAdmin?: boolean;
  isTeamMember: boolean;
  teamStatus: 'active' | 'suspended';
  permissions: TeamMemberPermissions;
  avatar?: string;
  createdAt: string;
}

type TabType = 'overview' | 'courses' | 'training' | 'careers' | 'team' | 'coupons';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { user, token, isLoading, isAdmin, logout, changeFirstPassword } = useAuth();

  // Role-Based Granular Permissions
  const isSuper = Boolean(user && isSuperAdminEmail(user.email) && user.teamStatus !== 'suspended');
  const isSuspended = user?.teamStatus === 'suspended';
  const isStaffAdmin = Boolean(
    user &&
    (
      user.role === 'admin' ||
      user.isTeamMember ||
      Boolean(user.department) ||
      Boolean(user.permissions?.manageCourses) ||
      Boolean(user.permissions?.manageTraining) ||
      Boolean(user.permissions?.manageCareers) ||
      Boolean(user.permissions?.manageTeam) ||
      Boolean(user.permissions?.viewAnalytics)
    )
  );

  const isHRTeam = Boolean(
    user &&
    !isSuspended &&
    (
      (user.department && user.department.toLowerCase().includes('hr')) ||
      Boolean(user.permissions?.manageTeam)
    )
  );

  const canManageCourses = !isSuspended && (isSuper || Boolean(user?.permissions?.manageCourses));
  const canManageTraining = !isSuspended && (isSuper || Boolean(user?.permissions?.manageTraining));
  const canManageCareers = !isSuspended && (isSuper || Boolean(user?.permissions?.manageCareers));
  const canViewAnalytics = !isSuspended && (isSuper || Boolean(user?.permissions?.viewAnalytics));
  const canManageCertificates = !isSuspended && (isSuper || Boolean(user?.permissions?.manageCertificates));
  const canManageTeam = !isSuspended && (isSuper || isHRTeam); // aryar0779@gmail.com / Super Admins and HR Team
  const canManageCoupons = !isSuspended && (isSuper || Boolean(user?.permissions?.manageCourses));

  const hasAnyAccess = isSuper || canManageCourses || canManageTraining || canManageCareers || canViewAnalytics || canManageCertificates || canManageTeam || canManageCoupons;

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Ensure active tab matches what the user is permitted to see
  useEffect(() => {
    const isTabPermitted = (tab: TabType): boolean => {
      if (tab === 'overview') return canViewAnalytics;
      if (tab === 'courses') return canManageCourses;
      if (tab === 'training') return canManageTraining;
      if (tab === 'careers') return canManageCareers;
      if (tab === 'team') return canManageTeam;
      if (tab === 'coupons') return canManageCoupons;
      return false;
    };

    if (!isTabPermitted(activeTab)) {
      if (canViewAnalytics) setActiveTab('overview');
      else if (canManageCourses) setActiveTab('courses');
      else if (canManageTraining) setActiveTab('training');
      else if (canManageCareers) setActiveTab('careers');
      else if (canManageTeam) setActiveTab('team');
      else if (canManageCoupons) setActiveTab('coupons');
    }
  }, [activeTab, canViewAnalytics, canManageCourses, canManageTraining, canManageCareers, canManageTeam, canManageCoupons]);

  // Data States
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [trainingPrograms, setTrainingPrograms] = useState<TrainingItem[]>([]);
  const [careers, setCareers] = useState<CareerItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberItem[]>([]);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Coupon Specific Filters
  const [couponDiscountFilter, setCouponDiscountFilter] = useState<'all' | 'percentage' | 'fixed'>('all');
  const [couponApplicableFilter, setCouponApplicableFilter] = useState<'all' | 'courses' | 'training'>('all');
  const [couponStatusFilter, setCouponStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);

  // Feedback Notification
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals States
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);

  const [trainingModalOpen, setTrainingModalOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<TrainingItem | null>(null);

  const [careerModalOpen, setCareerModalOpen] = useState(false);
  const [editingCareer, setEditingCareer] = useState<CareerItem | null>(null);

  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMemberItem | null>(null);

  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);

  // Forced First Login Password Change State
  const [firstPassValue, setFirstPassValue] = useState('');
  const [firstPassConfirm, setFirstPassConfirm] = useState('');
  const [firstPassError, setFirstPassError] = useState<string | null>(null);
  const [firstPassSubmitting, setFirstPassSubmitting] = useState(false);

  const handleFirstLoginPasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFirstPassError(null);

    if (!firstPassValue || firstPassValue.length < 6) {
      setFirstPassError('New permanent password must be at least 6 characters long.');
      return;
    }

    if (firstPassValue !== firstPassConfirm) {
      setFirstPassError('Passwords do not match. Please re-enter your password.');
      return;
    }

    try {
      setFirstPassSubmitting(true);
      const success = await changeFirstPassword(firstPassValue);
      if (success) {
        setNotice({ type: 'success', text: 'Permanent password saved successfully! Welcome to your dashboard.' });
      } else {
        setFirstPassError('Failed to save permanent password. Please try again.');
      }
    } catch (err: any) {
      setFirstPassError(err.message || 'Error updating password.');
    } finally {
      setFirstPassSubmitting(false);
    }
  };

  // Auto-hide toast notification after 4s
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  // Fetch only data that the current user has permission to access
  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      const promises: Promise<any>[] = [];
      const keys: string[] = [];

      if (canManageCourses || canViewAnalytics) {
        keys.push('courses');
        promises.push(
          fetch('/api/admin/courses', { headers })
            .then((r) => r.json())
            .catch(() => ({ success: false }))
        );
      }
      if (canManageTraining || canViewAnalytics) {
        keys.push('training');
        promises.push(
          fetch('/api/admin/training-internships', { headers })
            .then((r) => r.json())
            .catch(() => ({ success: false }))
        );
      }
      if (canManageCareers || canViewAnalytics) {
        keys.push('careers');
        promises.push(
          fetch('/api/admin/careers', { headers })
            .then((r) => r.json())
            .catch(() => ({ success: false }))
        );
      }
      if (canManageTeam) {
        keys.push('team');
        promises.push(
          fetch('/api/admin/team', { headers })
            .then((r) => r.json())
            .catch(() => ({ success: false }))
        );
      }
      if (canManageCoupons || isSuper) {
        keys.push('coupons');
        promises.push(
          fetch('/api/admin/coupons', { headers })
            .then((r) => r.json())
            .catch(() => ({ success: false }))
        );
      }

      const results = await Promise.all(promises);
      results.forEach((res, i) => {
        const key = keys[i];
        if (res && res.success) {
          if (key === 'courses') setCourses(res.courses || []);
          if (key === 'training') setTrainingPrograms(res.programs || []);
          if (key === 'careers') setCareers(res.careers || []);
          if (key === 'team') setTeamMembers(res.teamMembers || []);
          if (key === 'coupons') setCoupons(res.coupons || []);
        }
      });
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Failed to fetch dashboard data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && (isSuper || isStaffAdmin)) {
      fetchData();
    }
  }, [token, isSuper, isStaffAdmin, canManageCourses, canManageTraining, canManageCareers, canManageTeam, canManageCoupons, canViewAnalytics]);

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

    const totalTeam = teamMembers.length;
    const activeTeam = teamMembers.filter((m) => m.teamStatus === 'active').length;

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
      totalTeam,
      activeTeam,
    };
  }, [courses, trainingPrograms, careers, teamMembers]);

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

  // Filtered Team Members
  const filteredTeam = useMemo(() => {
    return teamMembers.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.phone && m.phone.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchDept = filterCategory === 'all' || m.department.toLowerCase().includes(filterCategory.toLowerCase());
      const matchStat = filterStatus === 'all' || m.teamStatus === filterStatus;
      return matchSearch && matchDept && matchStat;
    });
  }, [teamMembers, searchQuery, filterCategory, filterStatus]);

  // Filtered Coupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const matchSearch =
        !searchQuery ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchType =
        couponDiscountFilter === 'all' || c.discountType === couponDiscountFilter;
      const matchApplicable =
        couponApplicableFilter === 'all' || c.applicableTo === couponApplicableFilter;
      const matchStatus =
        couponStatusFilter === 'all' ||
        (couponStatusFilter === 'active' && c.isActive) ||
        (couponStatusFilter === 'inactive' && !c.isActive);
      return matchSearch && matchType && matchApplicable && matchStatus;
    });
  }, [coupons, searchQuery, couponDiscountFilter, couponApplicableFilter, couponStatusFilter]);

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

  // Team Member Actions (Super Admin strictly guarded)
  const handleSaveTeamMember = async (memberData: any) => {
    if (!token) {
      const msg = 'Authentication session expired. Please log in again.';
      setNotice({ type: 'error', text: msg });
      throw new Error(msg);
    }
    try {
      const isEditing = Boolean(editingMember);
      const method = isEditing ? 'PUT' : 'POST';
      const body = isEditing ? { id: editingMember?.id, ...memberData } : memberData;

      const res = await fetch('/api/admin/team', {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch (_jsonErr) {
        throw new Error(`Server returned HTTP ${res.status}: ${res.statusText || 'Unable to parse server response'}`);
      }

      if (!res.ok || !data.success) {
        const errorMsg = data.message || `Failed to save team member (HTTP ${res.status})`;
        setNotice({ type: 'error', text: errorMsg });
        throw new Error(errorMsg);
      }

      setNotice({ type: 'success', text: data.message || 'Team member saved successfully!' });
      setTeamModalOpen(false);
      setEditingMember(null);
      fetchData();
    } catch (err: any) {
      const msg =
        err.message === 'Failed to fetch' || err.message === 'fetch failed'
          ? 'Cannot connect to server. Please check your network or ensure the server is running.'
          : err.message || 'Network error saving team member';
      setNotice({ type: 'error', text: msg });
      throw new Error(msg);
    }
  };

  const handleToggleTeamStatus = async (member: TeamMemberItem) => {
    if (!token) return;
    if (isRootSuperAdminEmail(member.email)) {
      setNotice({ type: 'error', text: 'The root Super Administrator account (aryar0779@gmail.com) cannot be suspended.' });
      return;
    }
    const nextStatus = member.teamStatus === 'active' ? 'suspended' : 'active';

    // Optimistic UI update so the status immediately flips to "Suspended" or "Active"
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, teamStatus: nextStatus } : m))
    );

    try {
      const res = await fetch('/api/admin/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: member.id, teamStatus: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', text: `Account status updated to ${nextStatus}.` });
        fetchData();
      } else {
        setNotice({ type: 'error', text: data.message || 'Failed to update status' });
        fetchData();
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
      fetchData();
    }
  };

  const handleDeleteTeamMember = async (id: string, name: string, email: string) => {
    if (!token) return;
    if (isRootSuperAdminEmail(email)) {
      alert('Security Alert: The root Super Administrator account (aryar0779@gmail.com) is permanently protected and cannot be deleted.');
      return;
    }
    if (user?.email && user.email.toLowerCase().trim() === email.toLowerCase().trim()) {
      alert('Action Blocked: You cannot delete your own active administrator account.');
      return;
    }
    if (
      !confirm(
        `Are you sure you want to permanently remove "${name}" (${email})?\n\nThey will immediately lose access to all administrative features.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/team?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', text: `Team member "${name}" removed successfully.` });
        fetchData();
      } else {
        setNotice({ type: 'error', text: data.message });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  // Coupon Actions
  const handleSaveCoupon = async (couponData: Partial<CouponItem>) => {
    if (!token) return;
    try {
      const method = editingCoupon ? 'PUT' : 'POST';
      const body = editingCoupon ? { id: editingCoupon.id, ...couponData } : couponData;

      const res = await fetch('/api/admin/coupons', {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', text: data.message || 'Coupon saved successfully!' });
        setCouponModalOpen(false);
        setEditingCoupon(null);
        fetchData();
      } else {
        setNotice({ type: 'error', text: data.message || 'Failed to save coupon' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  const handleToggleCouponStatus = async (coupon: CouponItem) => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: coupon.id, isActive: !coupon.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        setNotice({
          type: 'success',
          text: `Coupon "${coupon.code}" is now ${!coupon.isActive ? 'Active' : 'Inactive'}!`,
        });
        fetchData();
      } else {
        setNotice({ type: 'error', text: data.message });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!token || !confirm(`Are you sure you want to delete promo coupon "${code}"?`)) return;
    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', text: `Coupon "${code}" deleted successfully!` });
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
      <div className={styles.loadingScreen}>
        <img
          src="/images/binary-vidya-logo.png"
          alt="Binary Vidya"
          className={styles.accessLogoImg}
        />
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Verifying administrator session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.accessScreen}>
        <div className={styles.accessCard}>
          <img
            src="/images/binary-vidya-logo.png"
            alt="Binary Vidya"
            className={styles.accessLogoImg}
          />
          <div className={styles.accessPill}>
            <ShieldCheck size={14} color="#1e40af" />
            <span>Super Administrator Console</span>
          </div>
          <h2 className={styles.accessTitle}>Sign In Required</h2>
          <p className={styles.accessDesc}>
            Please sign in with your authorized administrator account to access courses, training &amp; internship programs, and career openings.
          </p>
          <div className={styles.accessActions}>
            <Link href="/login" className={styles.accessPrimaryBtn}>
              Sign In to Super Admin <ArrowRight size={15} />
            </Link>
            <Link href="/" className={styles.accessSecondaryBtn}>
              Return to Live Site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (user?.mustChangePassword) {
    return (
      <div className={styles.accessScreen}>
        <div className={styles.accessCard} style={{ maxWidth: '480px' }}>
          <img
            src="/images/binary-vidya-logo.png"
            alt="Binary Vidya"
            className={styles.accessLogoImg}
          />
          <div className={styles.accessPill} style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
            <Key size={14} color="#b45309" />
            <span>Action Required: Set Permanent Password</span>
          </div>
          <h2 className={styles.accessTitle}>Update Temporary Password</h2>
          <p className={styles.accessDesc}>
            Welcome to the Binary Vidya team! Because you signed in using temporary credentials, you must choose a secure new permanent password to unlock the administration console.
          </p>

          <form onSubmit={handleFirstLoginPasswordChangeSubmit} style={{ marginTop: '20px', textAlign: 'left', width: '100%' }}>
            {firstPassError && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '13px', marginBottom: '14px' }}>
                {firstPassError}
              </div>
            )}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                New Permanent Password
              </label>
              <input
                type="password"
                required
                value={firstPassValue}
                onChange={(e) => setFirstPassValue(e.target.value)}
                placeholder="At least 6 characters"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                autoFocus
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={firstPassConfirm}
                onChange={(e) => setFirstPassConfirm(e.target.value)}
                placeholder="Re-enter your new password"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
              />
            </div>
            <button
              type="submit"
              disabled={firstPassSubmitting}
              className={styles.accessPrimaryBtn}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {firstPassSubmitting ? 'Saving Password...' : 'Save Password & Enter Console'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!isSuper && !isStaffAdmin) {
    return (
      <div className={styles.accessScreen}>
        <div className={styles.accessCard}>
          <img
            src="/images/binary-vidya-logo.png"
            alt="Binary Vidya"
            className={styles.accessLogoImg}
          />
          <div className={styles.accessRestrictedPill}>
            <AlertCircle size={14} color="#dc2626" />
            <span>Access Restricted</span>
          </div>
          <h2 className={styles.accessTitle}>Administrator Privileges Required</h2>
          <p className={styles.accessDesc}>
            You are currently signed in as <strong>{user.email}</strong> which does not have staff or administrator privileges.
          </p>
          <div className={styles.accessActions}>
            <button onClick={logout} className={styles.accessPrimaryBtn}>
              Switch to Admin Account
            </button>
            <Link href="/my-learning" className={styles.accessSecondaryBtn}>
              Go to Student Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSuspended) {
    return (
      <div className={styles.accessScreen}>
        <div className={styles.accessCard}>
          <img
            src="/images/binary-vidya-logo.png"
            alt="Binary Vidya"
            className={styles.accessLogoImg}
          />
          <div className={styles.accessRestrictedPill}>
            <AlertCircle size={14} color="#dc2626" />
            <span>Account Suspended</span>
          </div>
          <h2 className={styles.accessTitle}>Administrative Access Suspended</h2>
          <p className={styles.accessDesc}>
            Your staff account (<strong>{user.email}</strong>) has been suspended by the Super Administrator. Please contact management to restore your access.
          </p>
          <div className={styles.accessActions}>
            <button onClick={logout} className={styles.accessPrimaryBtn}>
              Sign Out
            </button>
            <Link href="/" className={styles.accessSecondaryBtn}>
              Return to Live Site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAnyAccess) {
    return (
      <div className={styles.accessScreen}>
        <div className={styles.accessCard}>
          <img
            src="/images/binary-vidya-logo.png"
            alt="Binary Vidya"
            className={styles.accessLogoImg}
          />
          <div className={styles.accessRestrictedPill}>
            <AlertCircle size={14} color="#f59e0b" />
            <span>No Module Permissions</span>
          </div>
          <h2 className={styles.accessTitle}>No Module Access Assigned</h2>
          <p className={styles.accessDesc}>
            Your account (<strong>{user.email}</strong>) is active but does not currently have permissions assigned for any modules (Courses, Training, Careers, Analytics). Please contact the Super Administrator.
          </p>
          <div className={styles.accessActions}>
            <button onClick={logout} className={styles.accessPrimaryBtn}>
              Sign Out
            </button>
            <Link href="/" className={styles.accessSecondaryBtn}>
              Return to Live Site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.superAdminContainer}>
      {/* Top Navigation Bar */}
      <header className={styles.topNav}>
        <div className={styles.topNavInner}>
          <div className={styles.brandGroup}>
            <Link href="/" className={styles.brandLogoLink} title="View Home Page">
              <img
                src="/images/binary-vidya-logo.png"
                alt="Binary Vidya"
                className={styles.brandLogoImg}
              />
            </Link>
            <div className={styles.superAdminPill}>
              <ShieldCheck size={13} />
              <span>{isSuper ? 'Super Admin' : user?.department || 'Staff Admin'}</span>
            </div>
          </div>

          <div className={styles.navActions}>
            {/* Quick Actions - Strictly guarded by module permissions */}
            {canManageCourses && (
              <button
                onClick={() => {
                  setEditingCourse(null);
                  setCourseModalOpen(true);
                }}
                className={styles.quickAddCourseBtn}
                title="Add Course"
              >
                <Plus size={15} />
                <span>Add Course</span>
              </button>
            )}

            {canManageTraining && (
              <button
                onClick={() => {
                  setActiveTab('training');
                  setEditingTraining(null);
                  setTrainingModalOpen(true);
                }}
                className={styles.quickAddTrainingBtn}
                title="Add New Training & Internship Program"
              >
                <Plus size={15} />
                <span>Add Program</span>
              </button>
            )}

            {canManageCareers && (
              <button
                onClick={() => {
                  setActiveTab('careers');
                  setEditingCareer(null);
                  setCareerModalOpen(true);
                }}
                className={styles.quickAddCareerBtn}
                title="Post Career Opportunity"
              >
                <Plus size={15} />
                <span>Add Career</span>
              </button>
            )}

            {canManageTeam && (
              <button
                onClick={() => {
                  setActiveTab('team');
                  setEditingMember(null);
                  setTeamModalOpen(true);
                }}
                className={styles.quickAddTeamBtn}
                title="Add Staff Member (HR, Content, Operations, Mentors)"
              >
                <UserPlus size={15} />
                <span>+ Add Team</span>
              </button>
            )}

            {canManageCoupons && (
              <button
                onClick={() => {
                  setActiveTab('coupons');
                  setEditingCoupon(null);
                  setCouponModalOpen(true);
                }}
                className={styles.quickAddTeamBtn}
                style={{ background: 'rgba(16, 185, 129, 0.18)', borderColor: '#10b981', color: '#10b981' }}
                title="Create Promo Discount Coupon"
              >
                <Tag size={14} />
                <span>+ Coupon</span>
              </button>
            )}

            <Link href="/" className={styles.liveSiteBtn} target="_blank" title="View Public Portal">
              <ExternalLink size={14} />
              <span>Live Site</span>
            </Link>

            <div className={styles.userProfilePill}>
              <div className={styles.userAvatar}>
                {user?.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              <div className={styles.userInfoCol}>
                <span className={styles.userName}>{user?.name || 'Administrator'}</span>
                <span className={styles.userRoleTag}>{isSuper ? 'Super Admin' : user?.department || 'Staff Member'}</span>
              </div>
            </div>

            <button onClick={logout} className={styles.logoutBtn} title="Sign Out">
              <LogOut size={16} />
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
              {isSuper ? 'Super Admin Control Console' : `${user?.department || 'Staff'} Control Console`}
            </h1>
            <p className={styles.headerSubtitle}>
              {isSuper
                ? 'Centralized command center for managing high-impact technical courses, verified training & internship drives, staff team permissions, promo coupons, and career pipelines.'
                : `Administrative workspace for managing assigned ${user?.department || 'operational'} workflows and modules.`}
            </p>
          </div>

          <div className={styles.headerActions}>
            {canManageCourses && (
              <button
                onClick={() => {
                  setEditingCourse(null);
                  setCourseModalOpen(true);
                }}
                className={styles.primaryActionBtn}
              >
                <Plus size={16} /> Add New Course
              </button>
            )}

            {canManageTraining && (
              <button
                onClick={() => {
                  setEditingTraining(null);
                  setTrainingModalOpen(true);
                }}
                className={styles.secondaryActionBtn}
              >
                <Plus size={16} /> Add Internship
              </button>
            )}

            {canManageCareers && (
              <button
                onClick={() => {
                  setEditingCareer(null);
                  setCareerModalOpen(true);
                }}
                className={styles.secondaryActionBtn}
              >
                <Plus size={16} /> Post Career
              </button>
            )}

            {canManageTeam && (
              <button
                onClick={() => {
                  setActiveTab('team');
                  setEditingMember(null);
                  setTeamModalOpen(true);
                }}
                className={styles.secondaryActionBtn}
                style={{ background: 'rgba(99, 102, 241, 0.3)', borderColor: '#818cf8', color: '#ffffff' }}
              >
                <UserPlus size={16} /> Add Team Member
              </button>
            )}

            {canManageCoupons && (
              <button
                onClick={() => {
                  setActiveTab('coupons');
                  setEditingCoupon(null);
                  setCouponModalOpen(true);
                }}
                className={styles.secondaryActionBtn}
                style={{ background: 'rgba(16, 185, 129, 0.2)', borderColor: '#10b981', color: '#34d399' }}
              >
                <Tag size={16} /> Create Coupon
              </button>
            )}
          </div>
        </section>

        {/* Global Key Metrics Grid - Only show allowed metrics */}
        <section className={styles.metricsGrid}>
          {(canManageCourses || canViewAnalytics) && (
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
          )}

          {(canManageTraining || canViewAnalytics) && (
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
          )}

          {(canManageCareers || canViewAnalytics) && (
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
          )}

          {canManageTeam && (
            <div className={styles.metricCard}>
              <div className={styles.metricInfo}>
                <span className={styles.metricLabel}>Administrative Staff</span>
                <span className={styles.metricValue}>{metrics.totalTeam}</span>
                <span className={styles.metricSubtext}>
                  {metrics.activeTeam} Active Staff • HR / Content / Operations
                </span>
              </div>
              <div className={styles.metricIconWrapper} style={{ background: '#eef2ff', color: '#4f46e5' }}>
                <Users size={24} />
              </div>
            </div>
          )}

          {(canManageCoupons || isSuper) && (
            <div className={styles.metricCard}>
              <div className={styles.metricInfo}>
                <span className={styles.metricLabel}>Active Coupons</span>
                <span className={styles.metricValue}>{coupons.filter((c) => c.isActive).length}</span>
                <span className={styles.metricSubtext}>
                  {coupons.length} Total Offers • {coupons.reduce((acc, c) => acc + (c.usageCount || 0), 0)} Times Redeemed
                </span>
              </div>
              <div className={styles.metricIconWrapper} style={{ background: '#ecfdf5', color: '#059669' }}>
                <Tag size={24} />
              </div>
            </div>
          )}

          {(canViewAnalytics || isSuper) && (
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
          )}
        </section>

        {/* Navigation Tabs - Only show tabs the admin has access to */}
        <nav className={styles.tabsContainer}>
          {canViewAnalytics && (
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
          )}

          {canManageCourses && (
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
          )}

          {canManageTraining && (
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
          )}

          {canManageCareers && (
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
          )}

          {canManageTeam && (
            <button
              onClick={() => {
                setActiveTab('team');
                setSearchQuery('');
                setFilterCategory('all');
                setFilterStatus('all');
              }}
              className={`${styles.tabBtn} ${activeTab === 'team' ? styles.tabBtnActive : ''}`}
            >
              <Users size={16} />
              <span>Team & Access</span>
              <span className={styles.tabCountPill}>{teamMembers.length}</span>
            </button>
          )}

          {canManageCoupons && (
            <button
              onClick={() => {
                setActiveTab('coupons');
                setSearchQuery('');
                setFilterCategory('all');
                setFilterStatus('all');
              }}
              className={`${styles.tabBtn} ${activeTab === 'coupons' ? styles.tabBtnActive : ''}`}
            >
              <Tag size={16} />
              <span>Coupons &amp; Discounts</span>
              <span className={styles.tabCountPill}>{coupons.length}</span>
            </button>
          )}

          <Link
            href="/sales/domains"
            target="_blank"
            className={styles.tabBtn}
            style={{ textDecoration: 'none' }}
            title="Manage internship form domains live"
          >
            <Sparkles size={16} />
            <span>Internship Domains</span>
            <span className={styles.tabCountPill} style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              Form Live
            </span>
          </Link>
        </nav>

        {/* TAB 1: OVERVIEW & RECENT ACTIVITY */}
        {activeTab === 'overview' && canViewAnalytics && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
              {/* Courses Snapshot */}
              {canManageCourses && (
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
              )}

              {/* Training & Internship Snapshot */}
              {canManageTraining && (
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
              )}

              {/* Careers Openings Snapshot */}
              {canManageCareers && (
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
              )}

              {!canManageCourses && !canManageTraining && !canManageCareers && (
                <div className={styles.tableContainer} style={{ padding: '32px', textAlign: 'center', gridColumn: 'span 2' }}>
                  <TrendingUp size={36} color="#3b82f6" style={{ margin: '0 auto 12px' }} />
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                    Platform Overview & Analytics
                  </h3>
                  <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '460px', margin: '0 auto' }}>
                    You have view access to monitor system analytics, platform activity, and operational statistics.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: COURSES MANAGEMENT */}
        {activeTab === 'courses' && canManageCourses && (
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

                {canManageCourses && (
                  <button
                    onClick={() => {
                      setEditingCourse(null);
                      setCourseModalOpen(true);
                    }}
                    className={styles.primaryActionBtn}
                  >
                    <Plus size={16} /> New Course
                  </button>
                )}
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
                            {canManageCourses && (
                              <>
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
                              </>
                            )}
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
        {activeTab === 'training' && canManageTraining && (
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

                {canManageTraining && (
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
                )}
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
                        <td style={{ maxWidth: '320px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {t.thumbnail ? (
                              <img
                                src={t.thumbnail}
                                alt={t.title}
                                style={{
                                  width: '52px',
                                  height: '32px',
                                  borderRadius: '6px',
                                  objectFit: 'cover',
                                  flexShrink: 0,
                                  border: '1px solid #cbd5e1',
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '52px',
                                  height: '32px',
                                  borderRadius: '6px',
                                  background: '#f1f5f9',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  border: '1px solid #e2e8f0',
                                  color: '#94a3b8',
                                }}
                              >
                                <GraduationCap size={15} />
                              </div>
                            )}
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
                            {canManageTraining && (
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
                            )}

                            <Link
                              href="/training-and-internship"
                              target="_blank"
                              className={styles.editRowBtn}
                              style={{ color: '#2563eb', textDecoration: 'none' }}
                              title="View Student Live Page"
                            >
                              <ExternalLink size={13} /> View
                            </Link>

                            {canManageTraining && (
                              <button
                                onClick={() => handleDeleteTraining(t.id, t.title)}
                                className={styles.deleteRowBtn}
                                title="Delete Program"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
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
        {activeTab === 'careers' && canManageCareers && (
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

                {canManageCareers && (
                  <button
                    onClick={() => {
                      setEditingCareer(null);
                      setCareerModalOpen(true);
                    }}
                    className={styles.primaryActionBtn}
                  >
                    <Plus size={16} /> Post Career
                  </button>
                )}
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
                            {canManageCareers && (
                              <>
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
                              </>
                            )}
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

        {/* TAB 5: TEAM & PERMISSIONS MANAGEMENT (SUPER ADMIN STRICT GUARD) */}
        {activeTab === 'team' && canManageTeam && (
          <div>
            {/* Sales vs Admin Separation Banner */}
            <div style={{
              background: '#eff6ff',
              border: '1.5px solid #bfdbfe',
              borderRadius: '12px',
              padding: '12px 18px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={20} color="#2563eb" />
                <div style={{ fontSize: '13px', color: '#1e3a8a', lineHeight: '1.4' }}>
                  <strong>Platform Staff Directory:</strong> This tab manages platform administrators and core departmental staff (HR, Content, Operations, Mentors).
                  Sales &amp; CRM agents (CSM, BDA, Lead Generation) are managed independently via the dedicated Sales Console.
                </div>
              </div>
              <a
                href="/sales/team"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '7px 14px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                Go to Sales Team Portal &rarr;
              </a>
            </div>

            {/* Filter & Search Toolbar */}
            <div className={styles.controlBar}>
              <div className={styles.searchBox}>
                <Search size={18} color="#64748b" />
                <input
                  type="text"
                  placeholder="Search team members by name, email, department, phone..."
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
                  <option value="HR">HR Team</option>
                  <option value="Content">Content Team</option>
                  <option value="Operations">Operations Team</option>
                  <option value="Mentor">Instructors & Mentors</option>
                </select>

                <select
                  className={styles.filterSelect}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Staff</option>
                  <option value="suspended">Suspended Staff</option>
                </select>

                <button
                  onClick={() => {
                    setEditingMember(null);
                    setTeamModalOpen(true);
                  }}
                  className={styles.primaryActionBtn}
                  style={{ background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)' }}
                >
                  <UserPlus size={16} /> Add Team Member
                </button>
              </div>
            </div>

            {/* Team Members Table */}
            <div className={styles.tableContainer}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Member Details</th>
                    <th>Department</th>
                    <th>Access Permissions</th>
                    <th>Account Status</th>
                    <th>Date Joined</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeam.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className={styles.emptyState}>
                          <Users size={40} color="#94a3b8" />
                          <div className={styles.emptyStateTitle}>No staff members found</div>
                          <p>Add your first HR, Content, Operations, or Mentorship staff member using the button above.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTeam.map((member) => {
                      const deptLower = (member.department || '').toLowerCase();
                      let badgeClass = styles.deptBadge_custom;
                      let avatarBg = '#64748b';

                      if (member.isSuperAdmin) {
                        badgeClass = styles.deptBadge_executive;
                        avatarBg = '#0f172a';
                      } else if (deptLower.includes('hr')) {
                        badgeClass = styles.deptBadge_hr;
                        avatarBg = '#7e22ce';
                      } else if (deptLower.includes('sales')) {
                        badgeClass = styles.deptBadge_sales;
                        avatarBg = '#047857';
                      } else if (deptLower.includes('content')) {
                        badgeClass = styles.deptBadge_content;
                        avatarBg = '#1d4ed8';
                      } else if (deptLower.includes('op')) {
                        badgeClass = styles.deptBadge_operations;
                        avatarBg = '#b45309';
                      } else if (deptLower.includes('mentor') || deptLower.includes('instruct')) {
                        badgeClass = styles.deptBadge_mentor;
                        avatarBg = '#4338ca';
                      }

                      return (
                        <tr key={member.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div className={styles.teamAvatar} style={{ background: avatarBg }}>
                                {member.name ? member.name[0].toUpperCase() : 'U'}
                              </div>
                              <div className={styles.teamNameCol}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span className={styles.teamNameText}>{member.name}</span>
                                  {member.isSuperAdmin && (
                                    <span className={styles.superAdminPill} style={{ fontSize: '9px', padding: '2px 6px' }}>
                                      Super Admin
                                    </span>
                                  )}
                                </div>
                                <span className={styles.teamEmailText}>{member.email}</span>
                                {member.phone && <span className={styles.teamPhoneText}>{member.phone}</span>}
                              </div>
                            </div>
                          </td>

                          <td>
                            <span className={`${styles.deptBadge} ${badgeClass}`}>
                              {member.department || 'Operations'}
                            </span>
                          </td>

                          <td>
                            <div className={styles.permPillList}>
                              {member.isSuperAdmin ? (
                                <span
                                  className={`${styles.permPill} ${member.teamStatus === 'suspended' ? styles.permPillDenied : styles.permPillGranted}`}
                                  style={
                                    member.teamStatus === 'suspended'
                                      ? { background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca', textDecoration: 'none', opacity: 1 }
                                      : { background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }
                                  }
                                >
                                  <ShieldCheck size={12} />{' '}
                                  {member.teamStatus === 'suspended'
                                    ? 'Access Suspended'
                                    : member.isRootSuperAdmin
                                    ? 'Full System Access (Root)'
                                    : 'Full System Access (Super Admin)'}
                                </span>
                              ) : (
                                <>
                                  <span className={`${styles.permPill} ${member.permissions?.manageCourses ? styles.permPillGranted : styles.permPillDenied}`}>
                                    {member.permissions?.manageCourses ? <Check size={11} /> : <X size={11} />} Courses
                                  </span>
                                  <span className={`${styles.permPill} ${member.permissions?.manageTraining ? styles.permPillGranted : styles.permPillDenied}`}>
                                    {member.permissions?.manageTraining ? <Check size={11} /> : <X size={11} />} Training &amp; Internships
                                  </span>
                                  <span className={`${styles.permPill} ${member.permissions?.manageCareers ? styles.permPillGranted : styles.permPillDenied}`}>
                                    {member.permissions?.manageCareers ? <Check size={11} /> : <X size={11} />} Careers
                                  </span>
                                  <span className={`${styles.permPill} ${member.permissions?.viewAnalytics ? styles.permPillGranted : styles.permPillDenied}`}>
                                    {member.permissions?.viewAnalytics ? <Check size={11} /> : <X size={11} />} Analytics
                                  </span>
                                  <span className={`${styles.permPill} ${member.permissions?.manageCertificates ? styles.permPillGranted : styles.permPillDenied}`}>
                                    {member.permissions?.manageCertificates ? <Check size={11} /> : <X size={11} />} Certificates
                                  </span>
                                </>
                              )}
                            </div>
                          </td>

                          <td>
                            {member.teamStatus === 'suspended' ? (
                              <span className={styles.statusSuspendedPill}>
                                <span className={styles.statusSuspendedDot} /> Suspended
                              </span>
                            ) : (
                              <span className={styles.statusActivePill}>
                                <span className={styles.statusActiveDot} /> Active
                              </span>
                            )}
                          </td>

                          <td>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              {member.createdAt ? new Date(member.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                            </span>
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <div className={styles.actionBtnGroup} style={{ justifyContent: 'flex-end' }}>
                              {(!member.isSuperAdmin || isSuper) && (
                                <button
                                  onClick={() => {
                                    setEditingMember(member);
                                    setTeamModalOpen(true);
                                  }}
                                  className={styles.editRowBtn}
                                  title="Edit Permissions & Access"
                                >
                                  <Edit2 size={13} /> Edit
                                </button>
                              )}

                              {!member.isRootSuperAdmin && (!member.isSuperAdmin || isSuper) && member.email.toLowerCase() !== (user?.email || '').toLowerCase() && (
                                <>
                                  <button
                                    onClick={() => handleToggleTeamStatus(member)}
                                    className={styles.editRowBtn}
                                    style={{
                                      background: member.teamStatus === 'suspended' ? '#ecfdf5' : '#fff7ed',
                                      borderColor: member.teamStatus === 'suspended' ? '#a7f3d0' : '#fed7aa',
                                      color: member.teamStatus === 'suspended' ? '#047857' : '#c2410c',
                                    }}
                                    title={member.teamStatus === 'suspended' ? 'Activate Account' : 'Suspend Account'}
                                  >
                                    {member.teamStatus === 'suspended' ? 'Activate' : 'Suspend'}
                                  </button>

                                  <button
                                    onClick={() => handleDeleteTeamMember(member.id, member.name, member.email)}
                                    className={styles.deleteRowBtn}
                                    title={member.isSuperAdmin ? 'Delete Super Administrator Account' : 'Permanently Remove Staff Member'}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: PROMOTIONAL COUPONS & DISCOUNTS */}
        {activeTab === 'coupons' && canManageCoupons && (
          <div>
            {/* Header / Filter Toolbar */}
            <div className={styles.tableHeaderBar}>
              <div className={styles.searchBox}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search promo code or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              <div className={styles.filterGroup}>
                <select
                  value={couponDiscountFilter}
                  onChange={(e: any) => setCouponDiscountFilter(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Discount Types</option>
                  <option value="percentage">Percentage (%) Off</option>
                  <option value="fixed">Fixed Money (₹) Off</option>
                </select>

                <select
                  value={couponApplicableFilter}
                  onChange={(e: any) => setCouponApplicableFilter(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Programs Scope</option>
                  <option value="courses">Courses Only</option>
                  <option value="training">Training &amp; Internship Only</option>
                </select>

                <select
                  value={couponStatusFilter}
                  onChange={(e: any) => setCouponStatusFilter(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>

                <button
                  onClick={() => {
                    setEditingCoupon(null);
                    setCouponModalOpen(true);
                  }}
                  className={styles.primaryActionBtn}
                  style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', whiteSpace: 'nowrap' }}
                >
                  <Plus size={16} /> + Create Coupon
                </button>
              </div>
            </div>

            {/* Coupons Table */}
            <div className={styles.tableContainer}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Coupon Code</th>
                    <th>Discount Mode &amp; Value</th>
                    <th>Applicability</th>
                    <th>Conditions</th>
                    <th>Usage Count</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoupons.length === 0 ? (
                    <tr>
                      <td colSpan={8} className={styles.emptyTableState}>
                        <Tag size={40} className={styles.emptyTableIcon} />
                        <div className={styles.emptyTableTitle}>No Promo Coupons Found</div>
                        <div className={styles.emptyTableSubtitle}>
                          {searchQuery || couponDiscountFilter !== 'all' || couponApplicableFilter !== 'all' || couponStatusFilter !== 'all'
                            ? 'No coupons matched your active filter criteria.'
                            : 'Create your first promotional discount coupon to boost student enrollment.'}
                        </div>
                        <button
                          onClick={() => {
                            setEditingCoupon(null);
                            setCouponModalOpen(true);
                          }}
                          className={styles.emptyActionBtn}
                          style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
                        >
                          <Plus size={16} /> Create New Coupon
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredCoupons.map((coupon) => {
                      const isCopied = copiedCouponId === coupon.id;
                      return (
                        <tr key={coupon.id || coupon.code}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                style={{
                                  fontFamily: 'monospace',
                                  fontSize: '14px',
                                  fontWeight: 800,
                                  color: '#0284c7',
                                  backgroundColor: '#f0f9ff',
                                  border: '1px dashed #38bdf8',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  letterSpacing: '0.5px',
                                }}
                              >
                                {coupon.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (coupon.code) {
                                    navigator.clipboard.writeText(coupon.code);
                                    setCopiedCouponId(coupon.id || coupon.code);
                                    setTimeout(() => setCopiedCouponId(null), 2000);
                                  }
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: isCopied ? '#10b981' : '#94a3b8',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '4px',
                                }}
                                title="Copy coupon code"
                              >
                                {isCopied ? <Check size={14} /> : <Copy size={14} />}
                              </button>
                            </div>
                            {coupon.description && (
                              <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                                {coupon.description}
                              </span>
                            )}
                          </td>

                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  backgroundColor: coupon.discountType === 'percentage' ? '#e0f2fe' : '#ecfdf5',
                                  color: coupon.discountType === 'percentage' ? '#0369a1' : '#047857',
                                  border: `1px solid ${coupon.discountType === 'percentage' ? '#bae6fd' : '#a7f3d0'}`,
                                }}
                              >
                                {coupon.discountType === 'percentage' ? (
                                  <>
                                    <Percent size={12} /> {coupon.discountValue}% OFF
                                  </>
                                ) : (
                                  <>
                                    <IndianRupee size={12} /> Flat ₹{coupon.discountValue.toLocaleString('en-IN')} OFF
                                  </>
                                )}
                              </span>
                            </div>
                          </td>

                          <td>
                            <span
                              style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                textTransform: 'capitalize',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                backgroundColor:
                                  coupon.applicableTo === 'courses'
                                    ? '#eff6ff'
                                    : coupon.applicableTo === 'training'
                                    ? '#fdf2f8'
                                    : '#f1f5f9',
                                color:
                                  coupon.applicableTo === 'courses'
                                    ? '#2563eb'
                                    : coupon.applicableTo === 'training'
                                    ? '#db2777'
                                    : '#475569',
                              }}
                            >
                              {coupon.applicableTo === 'all'
                                ? 'All Programs'
                                : coupon.applicableTo === 'courses'
                                ? 'Courses Only'
                                : 'Training Only'}
                            </span>
                          </td>

                          <td>
                            <div style={{ fontSize: '11.5px', color: '#475569' }}>
                              <div>Min: {coupon.minOrderAmount ? `₹${coupon.minOrderAmount.toLocaleString('en-IN')}` : 'None'}</div>
                              {coupon.discountType === 'percentage' && coupon.maxDiscountAmount ? (
                                <div>Cap: ₹{coupon.maxDiscountAmount.toLocaleString('en-IN')}</div>
                              ) : null}
                            </div>
                          </td>

                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                                {coupon.usageCount || 0}
                              </span>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>uses</span>
                            </div>
                          </td>

                          <td>
                            <button
                              type="button"
                              onClick={() => handleToggleCouponStatus(coupon)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                border: 'none',
                                fontSize: '11px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                backgroundColor: coupon.isActive ? '#ecfdf5' : '#f1f5f9',
                                color: coupon.isActive ? '#047857' : '#64748b',
                              }}
                              title={coupon.isActive ? 'Click to deactivate' : 'Click to activate'}
                            >
                              <span
                                style={{
                                  width: '7px',
                                  height: '7px',
                                  borderRadius: '50%',
                                  backgroundColor: coupon.isActive ? '#10b981' : '#94a3b8',
                                }}
                              />
                              {coupon.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </td>

                          <td>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              {coupon.createdAt
                                ? new Date(coupon.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : 'N/A'}
                            </span>
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <div className={styles.actionBtnGroup} style={{ justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => {
                                  setEditingCoupon(coupon);
                                  setCouponModalOpen(true);
                                }}
                                className={styles.editRowBtn}
                                title="Edit Coupon Settings"
                              >
                                <Edit2 size={13} /> Edit
                              </button>

                              <button
                                onClick={() => handleDeleteCoupon(coupon.id || '', coupon.code)}
                                className={styles.deleteRowBtn}
                                title="Delete Coupon"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* COURSE CREATE/EDIT MODAL */}
      {courseModalOpen && canManageCourses && (
        <CourseFormModal
          course={editingCourse}
          token={token || undefined}
          onClose={() => {
            setCourseModalOpen(false);
            setEditingCourse(null);
          }}
          onSave={handleSaveCourse}
        />
      )}

      {/* TRAINING CREATE/EDIT MODAL */}
      {trainingModalOpen && canManageTraining && (
        <TrainingFormModal
          program={editingTraining}
          token={token || undefined}
          onClose={() => {
            setTrainingModalOpen(false);
            setEditingTraining(null);
          }}
          onSave={handleSaveTraining}
        />
      )}

      {/* CAREER CREATE/EDIT MODAL */}
      {careerModalOpen && canManageCareers && (
        <CareerFormModal
          career={editingCareer}
          onClose={() => {
            setCareerModalOpen(false);
            setEditingCareer(null);
          }}
          onSave={handleSaveCareer}
        />
      )}

      {/* TEAM MEMBER CREATE/EDIT MODAL */}
      {teamModalOpen && canManageTeam && (
        <TeamMemberModal
          member={editingMember}
          onClose={() => {
            setTeamModalOpen(false);
            setEditingMember(null);
          }}
          onSave={handleSaveTeamMember}
        />
      )}

      {/* COUPON CREATE/EDIT MODAL */}
      {couponModalOpen && canManageCoupons && (
        <CouponAdminModal
          isOpen={couponModalOpen}
          onClose={() => {
            setCouponModalOpen(false);
            setEditingCoupon(null);
          }}
          couponToEdit={editingCoupon}
          onSave={handleSaveCoupon}
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
// SHARED MEDIA UPLOAD HELPER (CLOUDINARY / LOCAL)
// -------------------------------------------------------------
async function uploadAdminMedia(
  file: File,
  token?: string,
  onStatusChange?: (msg: string) => void
): Promise<{ url: string; originalFilename: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'binaryvidya/media');

  if (onStatusChange) onStatusChange('Uploading...');

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Media file upload failed');
  }

  return {
    url: data.url,
    originalFilename: data.originalFilename || file.name,
  };
}

export interface VideoPptItem {
  id: string;
  title: string;
  videoUrl: string;
  videoName?: string;
  pptUrl: string;
  pptName?: string;
  duration?: string;
}

// -------------------------------------------------------------
// COURSE FORM MODAL COMPONENT (STREAMLINED: TITLE, PRICING, DESC, THUMBNAIL, VIDEOS & PPT CRUD)
// -------------------------------------------------------------
function CourseFormModal({
  course,
  token,
  onClose,
  onSave,
}: {
  course: CourseItem | null;
  token?: string;
  onClose: () => void;
  onSave: (data: Partial<CourseItem>) => void;
}) {
  const [title, setTitle] = useState(course?.title || '');
  const [originalPrice, setOriginalPrice] = useState<number | string>(
    course?.originalPrice !== undefined ? course.originalPrice : (course?.price ? course.price * 2 : 4999)
  );
  const [price, setPrice] = useState<number | string>(
    course?.price !== undefined ? course.price : 1499
  );
  const [description, setDescription] = useState(course?.description || '');

  // Thumbnail state
  const [thumbnail, setThumbnail] = useState(course?.thumbnail || '');
  const [thumbnailStats, setThumbnailStats] = useState<{ orig: string; comp: string; saved: number } | null>(null);
  const [isCompressingMain, setIsCompressingMain] = useState(false);

  // Videos & Related PPTs state
  const [videos, setVideos] = useState<VideoPptItem[]>(() => {
    if (course?.chapters && course.chapters.length > 0) {
      const flat = course.chapters.flatMap((c, cIdx) =>
        (c.lessons || []).map((l, lIdx) => ({
          id: l.id || `vid_${cIdx}_${lIdx}_${Date.now()}`,
          title: l.title || `Lesson ${lIdx + 1}`,
          videoUrl: l.videoUrl || '',
          videoName: l.videoName || '',
          pptUrl: (l as any).pptUrl || '',
          pptName: (l as any).pptName || '',
          duration: l.duration || '15 Mins',
        }))
      );
      if (flat.length > 0) return flat;
    }
    return [
      {
        id: `vid_1_${Date.now()}`,
        title: 'Lecture 1: Introduction & Architecture',
        videoUrl: '',
        videoName: '',
        pptUrl: '',
        pptName: '',
        duration: '15 Mins',
      },
    ];
  });

  // Uploading trackers
  const [uploadingVideoIdx, setUploadingVideoIdx] = useState<number | null>(null);
  const [uploadingPptIdx, setUploadingPptIdx] = useState<number | null>(null);

  // Handle Thumbnail File
  const handleThumbnailFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Add Video & PPT Item
  const handleAddVideo = () => {
    setVideos([
      ...videos,
      {
        id: `vid_${videos.length + 1}_${Date.now()}`,
        title: `Lecture ${videos.length + 1}: `,
        videoUrl: '',
        videoName: '',
        pptUrl: '',
        pptName: '',
        duration: '15 Mins',
      },
    ]);
  };

  // Remove Video Item
  const handleRemoveVideo = (idx: number) => {
    if (videos.length <= 1) {
      alert('Course must have at least 1 video lecture.');
      return;
    }
    setVideos(videos.filter((_, i) => i !== idx));
  };

  // Update Item Field
  const handleVideoChange = (idx: number, field: keyof VideoPptItem, val: string) => {
    const updated = [...videos];
    updated[idx] = { ...updated[idx], [field]: val };
    setVideos(updated);
  };

  // Upload Video File
  const handleUploadVideoFile = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingVideoIdx(idx);
      const uploaded = await uploadAdminMedia(file, token);
      const updated = [...videos];
      updated[idx].videoUrl = uploaded.url;
      updated[idx].videoName = uploaded.originalFilename;
      setVideos(updated);
    } catch (err: any) {
      alert(err.message || 'Video upload failed');
    } finally {
      setUploadingVideoIdx(null);
    }
  };

  // Upload PPT File
  const handleUploadPptFile = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingPptIdx(idx);
      const uploaded = await uploadAdminMedia(file, token);
      const updated = [...videos];
      updated[idx].pptUrl = uploaded.url;
      updated[idx].pptName = uploaded.originalFilename;
      setVideos(updated);
    } catch (err: any) {
      alert(err.message || 'PPT/Document upload failed');
    } finally {
      setUploadingPptIdx(null);
    }
  };

  const numOrig = Number(originalPrice) || 0;
  const numFinal = Number(price) || 0;
  const discountAmount = numOrig > numFinal ? numOrig - numFinal : 0;
  const discountPct = numOrig > 0 && discountAmount > 0 ? Math.round((discountAmount / numOrig) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a course title');
      return;
    }
    if (!description.trim()) {
      alert('Please enter a course description');
      return;
    }

    onSave({
      title: title.trim(),
      originalPrice: numOrig,
      price: numFinal,
      description: description.trim(),
      thumbnail,
      chapters: [
        {
          title: 'Course Curriculum',
          description: 'Comprehensive video lectures and corresponding presentations',
          lessons: videos.map((v, i) => ({
            id: v.id || `les_${i + 1}`,
            title: v.title || `Lecture ${i + 1}`,
            videoUrl: v.videoUrl || '',
            videoName: v.videoName || '',
            pptUrl: v.pptUrl || '',
            pptName: v.pptName || '',
            duration: v.duration || '15 Mins',
            thumbnail: thumbnail,
            description: '',
          })),
        },
      ],
      modules: [
        {
          title: title.trim(),
          lecturesCount: videos.length,
          duration: `${videos.length} Lectures`,
        },
      ],
      category: course?.category || 'General',
      level: course?.level || 'All Levels',
      duration: course?.duration || `${videos.length} Lectures`,
      instructor: course?.instructor || 'Binary Vidya Faculty',
      status: course?.status || 'active',
      tags: course?.tags || ['Engineering', 'Certification'],
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '860px' }}>
        <div className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className={styles.modalTitle}>{course ? 'Edit Course' : 'Add New Course'}</h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                Configure course title, pricing, description, thumbnail, and upload videos with related PPTs.
              </p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeModalBtn}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {/* 1. COURSE TITLE */}
            <div style={{ marginBottom: '20px' }}>
              <label className={styles.formLabel} style={{ fontWeight: 700, fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                Course Title *
              </label>
              <input
                type="text"
                required
                className={styles.formInput}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Master Full-Stack Web Architecture & Next.js"
                style={{ fontSize: '14px', fontWeight: 600 }}
              />
            </div>

            {/* 2. PRICING (ORIGINAL & AFTER DISCOUNT) */}
            <div style={{ marginBottom: '22px', padding: '16px 18px', background: '#f8fafc', borderRadius: '14px', border: '1.5px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IndianRupee size={16} color="#059669" /> Course Pricing
                </span>
                {discountAmount > 0 && (
                  <span style={{ fontSize: '11px', fontWeight: 800, background: '#ecfdf5', color: '#059669', padding: '3px 8px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                    Save ₹{discountAmount.toLocaleString('en-IN')} ({discountPct}% OFF)
                  </span>
                )}
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Original Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className={styles.formInput}
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="e.g. 4999"
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Strikethrough reference price shown to learners
                  </span>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Price After Discount (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className={styles.formInput}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 1499 (0 for Free)"
                    style={{ fontWeight: 700, color: '#059669' }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Final discounted price learner pays during checkout
                  </span>
                </div>
              </div>
            </div>

            {/* 3. DESCRIPTION */}
            <div style={{ marginBottom: '22px' }}>
              <label className={styles.formLabel} style={{ fontWeight: 700, fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                Course Description *
              </label>
              <textarea
                required
                rows={3}
                className={styles.formTextarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Comprehensive description of concepts covered, syllabus, and what students will build..."
              />
            </div>

            {/* 4. COURSE THUMBNAIL */}
            <div style={{ marginBottom: '26px', padding: '18px 20px', background: '#f8fafc', borderRadius: '14px', border: '1.5px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ImageIcon size={16} color="#2563eb" /> Course Thumbnail
                </span>
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
                  <div style={{ position: 'relative', width: '200px', height: '112px', borderRadius: '10px', overflow: 'hidden', border: '2px solid #2563eb', flexShrink: 0, background: '#0f172a' }}>
                    <img src={thumbnail} alt="Thumbnail Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ width: '200px', height: '112px', borderRadius: '10px', border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: '6px', flexShrink: 0, background: '#ffffff' }}>
                    <ImageIcon size={26} color="#cbd5e1" />
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
                      onChange={handleThumbnailFile}
                      style={{ display: 'none' }}
                      disabled={isCompressingMain}
                    />
                  </label>

                  {thumbnailStats && (
                    <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '6px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', fontSize: '11px', fontWeight: 700 }}>
                      <Zap size={13} color="#059669" />
                      Optimized: {thumbnailStats.orig} &rarr; {thumbnailStats.comp} ({thumbnailStats.saved}% smaller)
                    </div>
                  )}

                  <div style={{ marginTop: '10px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                      Or paste direct image URL:
                    </span>
                    <input
                      type="url"
                      value={thumbnail}
                      onChange={(e) => setThumbnail(e.target.value)}
                      placeholder="https://images.unsplash.com/... or CDN link"
                      className={styles.formInput}
                      style={{ padding: '7px 10px', fontSize: '12px' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 5. UPLOAD VIDEO AND PPT RELATED TO VIDEO (CRUD) */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Video size={18} color="#2563eb" /> Course Videos &amp; Related PPT Presentations ({videos.length})
                  </h4>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Upload video lessons and attach corresponding presentation PPT/PDF for each video.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddVideo}
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
                  <Plus size={14} /> Add Video &amp; PPT
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {videos.map((vid, idx) => (
                  <div
                    key={vid.id || idx}
                    style={{
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '12px',
                      background: '#ffffff',
                      padding: '16px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    }}
                  >
                    {/* Item Top Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <span style={{ fontWeight: 800, fontSize: '12px', color: '#2563eb', background: '#eff6ff', padding: '3px 8px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                          Video #{idx + 1}
                        </span>
                        <input
                          type="text"
                          required
                          value={vid.title}
                          onChange={(e) => handleVideoChange(idx, 'title', e.target.value)}
                          placeholder={`Lecture ${idx + 1} Title (e.g. Component Lifecycles)`}
                          className={styles.formInput}
                          style={{ fontSize: '13px', fontWeight: 600, padding: '6px 10px' }}
                        />
                      </div>
                      {videos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVideo(idx)}
                          style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            color: '#dc2626',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginLeft: '10px',
                          }}
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      )}
                    </div>

                    {/* Media Uploads Grid: Video & PPT */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                      {/* Video Column */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Video size={14} color="#2563eb" /> Video Lecture File / URL
                          </span>
                          {vid.videoUrl && (
                            <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={12} /> Ready
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                          <label
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '7px 12px',
                              borderRadius: '8px',
                              background: '#2563eb',
                              color: '#ffffff',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              flexShrink: 0,
                            }}
                          >
                            {uploadingVideoIdx === idx ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                            {uploadingVideoIdx === idx ? 'Uploading...' : 'Upload Video'}
                            <input
                              type="file"
                              accept="video/*,.mp4,.mov,.webm,.mkv"
                              onChange={(e) => handleUploadVideoFile(idx, e)}
                              style={{ display: 'none' }}
                              disabled={uploadingVideoIdx === idx}
                            />
                          </label>

                          <input
                            type="url"
                            value={vid.videoUrl}
                            onChange={(e) => handleVideoChange(idx, 'videoUrl', e.target.value)}
                            placeholder="Or paste video link (MP4 / YouTube / CDN)"
                            className={styles.formInput}
                            style={{ fontSize: '11px', padding: '6px 8px', flex: 1 }}
                          />
                        </div>
                        {vid.videoName && (
                          <span style={{ fontSize: '11px', color: '#64748b', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            📁 {vid.videoName}
                          </span>
                        )}
                      </div>

                      {/* Related PPT Column */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <FileText size={14} color="#059669" /> Related Presentation (PPT / PDF)
                          </span>
                          {vid.pptUrl && (
                            <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={12} /> PPT Attached
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                          <label
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '7px 12px',
                              borderRadius: '8px',
                              background: '#059669',
                              color: '#ffffff',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              flexShrink: 0,
                            }}
                          >
                            {uploadingPptIdx === idx ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                            {uploadingPptIdx === idx ? 'Uploading...' : 'Upload PPT/PDF'}
                            <input
                              type="file"
                              accept=".ppt,.pptx,.pdf,.doc,.docx"
                              onChange={(e) => handleUploadPptFile(idx, e)}
                              style={{ display: 'none' }}
                              disabled={uploadingPptIdx === idx}
                            />
                          </label>

                          <input
                            type="url"
                            value={vid.pptUrl}
                            onChange={(e) => handleVideoChange(idx, 'pptUrl', e.target.value)}
                            placeholder="Or paste PPT / PDF document link"
                            className={styles.formInput}
                            style={{ fontSize: '11px', padding: '6px 8px', flex: 1 }}
                          />
                        </div>
                        {vid.pptName && (
                          <span style={{ fontSize: '11px', color: '#64748b', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            📊 {vid.pptName}
                          </span>
                        )}
                      </div>
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
              <Check size={16} /> Save Course &amp; Media
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// TRAINING & INTERNSHIP FORM MODAL COMPONENT (STREAMLINED: TITLE, DESC, THUMBNAIL, TRAINING FEES, SECTIONS 1, 2, 3 CRUD)
// -------------------------------------------------------------
function TrainingFormModal({
  program,
  token,
  onClose,
  onSave,
}: {
  program: TrainingItem | null;
  token?: string;
  onClose: () => void;
  onSave: (data: Partial<TrainingItem>) => void;
}) {
  const [title, setTitle] = useState(program?.title || '');
  const [description, setDescription] = useState(
    program?.description || program?.subtitle || ''
  );

  // Thumbnail
  const [thumbnail, setThumbnail] = useState(program?.thumbnail || '');
  const [thumbnailStats, setThumbnailStats] = useState<{ orig: string; comp: string; saved: number } | null>(null);
  const [isCompressingThumb, setIsCompressingThumb] = useState(false);

  // Training Fees (Original & After Discount)
  const [originalPrice, setOriginalPrice] = useState<number | string>(
    program?.originalPrice !== undefined ? program.originalPrice : 7999
  );
  const [trainingPrice, setTrainingPrice] = useState<number | string>(
    program?.trainingPrice !== undefined ? program.trainingPrice : 2400
  );

  // SECTION 1: Training Video & PPT related to video
  const [sec1Items, setSec1Items] = useState<VideoPptItem[]>(() => {
    const rawItems = program?.sections?.[0]?.items;
    if (Array.isArray(rawItems) && rawItems.length > 0) return rawItems;
    const modules = program?.sections?.[0]?.modules;
    if (Array.isArray(modules) && modules.length > 0) {
      return modules.map((m: any, i: number) => ({
        id: `s1_${i + 1}`,
        title: m.title || `Training Module ${i + 1}`,
        videoUrl: m.videoUrl || '',
        videoName: m.videoName || '',
        pptUrl: m.pptUrl || '',
        pptName: m.pptName || '',
        duration: '1 Hour',
      }));
    }
    return [
      {
        id: `s1_1_${Date.now()}`,
        title: 'Training Module 1: Core Technical Foundations',
        videoUrl: '',
        videoName: '',
        pptUrl: '',
        pptName: '',
        duration: '1 Hour',
      },
    ];
  });

  // SECTION 2: Minor Project PPT & related video
  const [sec2Items, setSec2Items] = useState<VideoPptItem[]>(() => {
    const rawItems = program?.sections?.[1]?.items;
    if (Array.isArray(rawItems) && rawItems.length > 0) return rawItems;
    const sec2 = program?.sections?.[1];
    return [
      {
        id: `s2_1_${Date.now()}`,
        title: sec2?.title || 'Minor Project: Implementation & Architecture',
        videoUrl: sec2?.videoUrl || '',
        videoName: '',
        pptUrl: sec2?.pptUrl || '',
        pptName: '',
        duration: '2 Weeks',
      },
    ];
  });

  // SECTION 3: Major Project & PPT related to video
  const [sec3Items, setSec3Items] = useState<VideoPptItem[]>(() => {
    const rawItems = program?.sections?.[2]?.items;
    if (Array.isArray(rawItems) && rawItems.length > 0) return rawItems;
    const sec3 = program?.sections?.[2];
    return [
      {
        id: `s3_1_${Date.now()}`,
        title: sec3?.title || 'Major Project: Enterprise Capstone Deliverables',
        videoUrl: sec3?.videoUrl || '',
        videoName: '',
        pptUrl: sec3?.pptUrl || '',
        pptName: '',
        duration: '4 Weeks',
      },
    ];
  });

  // Uploading trackers for the 3 sections
  const [uploadSec, setUploadSec] = useState<number | null>(null);
  const [uploadIdx, setUploadIdx] = useState<number | null>(null);
  const [uploadType, setUploadType] = useState<'video' | 'ppt' | null>(null);

  // Compress / Set Thumbnail
  const handleThumbnailFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressingThumb(true);
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
      setIsCompressingThumb(false);
    }
  };

  // Section items CRUD handlers
  const handleAddItem = (sectionNumber: 1 | 2 | 3) => {
    const newItem: VideoPptItem = {
      id: `s${sectionNumber}_${Date.now()}`,
      title: sectionNumber === 1
        ? `Training Module ${sec1Items.length + 1}: `
        : sectionNumber === 2
        ? `Minor Project Milestone ${sec2Items.length + 1}: `
        : `Major Project Milestone ${sec3Items.length + 1}: `,
      videoUrl: '',
      videoName: '',
      pptUrl: '',
      pptName: '',
      duration: '1 Hour',
    };

    if (sectionNumber === 1) setSec1Items([...sec1Items, newItem]);
    else if (sectionNumber === 2) setSec2Items([...sec2Items, newItem]);
    else setSec3Items([...sec3Items, newItem]);
  };

  const handleRemoveItem = (sectionNumber: 1 | 2 | 3, idx: number) => {
    if (sectionNumber === 1) {
      if (sec1Items.length <= 1) return alert('Section 1 must have at least 1 training item.');
      setSec1Items(sec1Items.filter((_, i) => i !== idx));
    } else if (sectionNumber === 2) {
      if (sec2Items.length <= 1) return alert('Section 2 must have at least 1 minor project item.');
      setSec2Items(sec2Items.filter((_, i) => i !== idx));
    } else {
      if (sec3Items.length <= 1) return alert('Section 3 must have at least 1 major project item.');
      setSec3Items(sec3Items.filter((_, i) => i !== idx));
    }
  };

  const handleItemChange = (sectionNumber: 1 | 2 | 3, idx: number, field: keyof VideoPptItem, val: string) => {
    if (sectionNumber === 1) {
      const updated = [...sec1Items];
      updated[idx] = { ...updated[idx], [field]: val };
      setSec1Items(updated);
    } else if (sectionNumber === 2) {
      const updated = [...sec2Items];
      updated[idx] = { ...updated[idx], [field]: val };
      setSec2Items(updated);
    } else {
      const updated = [...sec3Items];
      updated[idx] = { ...updated[idx], [field]: val };
      setSec3Items(updated);
    }
  };

  // Upload file for a specific section and item
  const handleUploadFileForSection = async (
    sectionNumber: 1 | 2 | 3,
    idx: number,
    type: 'video' | 'ppt',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadSec(sectionNumber);
      setUploadIdx(idx);
      setUploadType(type);

      const uploaded = await uploadAdminMedia(file, token);

      if (sectionNumber === 1) {
        const updated = [...sec1Items];
        if (type === 'video') {
          updated[idx].videoUrl = uploaded.url;
          updated[idx].videoName = uploaded.originalFilename;
        } else {
          updated[idx].pptUrl = uploaded.url;
          updated[idx].pptName = uploaded.originalFilename;
        }
        setSec1Items(updated);
      } else if (sectionNumber === 2) {
        const updated = [...sec2Items];
        if (type === 'video') {
          updated[idx].videoUrl = uploaded.url;
          updated[idx].videoName = uploaded.originalFilename;
        } else {
          updated[idx].pptUrl = uploaded.url;
          updated[idx].pptName = uploaded.originalFilename;
        }
        setSec2Items(updated);
      } else {
        const updated = [...sec3Items];
        if (type === 'video') {
          updated[idx].videoUrl = uploaded.url;
          updated[idx].videoName = uploaded.originalFilename;
        } else {
          updated[idx].pptUrl = uploaded.url;
          updated[idx].pptName = uploaded.originalFilename;
        }
        setSec3Items(updated);
      }
    } catch (err: any) {
      alert(err.message || `${type === 'video' ? 'Video' : 'PPT'} upload failed`);
    } finally {
      setUploadSec(null);
      setUploadIdx(null);
      setUploadType(null);
    }
  };

  const numOrigFee = Number(originalPrice) || 0;
  const numDiscountFee = Number(trainingPrice) || 0;
  const scholarshipAmount = numOrigFee > numDiscountFee ? numOrigFee - numDiscountFee : 0;
  const scholarshipPct = numOrigFee > 0 && scholarshipAmount > 0 ? Math.round((scholarshipAmount / numOrigFee) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter internship title');
      return;
    }
    if (!description.trim()) {
      alert('Please enter internship description');
      return;
    }

    const formattedSections = [
      {
        id: 'section-1-training',
        number: 1,
        title: 'Section 1: Intensive Technical Training',
        tagline: 'Mentor-Led Live Weekend Training & Core Technical Foundations',
        description: description.trim(),
        items: sec1Items,
        modules: sec1Items.map((it, idx) => ({
          moduleNumber: `1.${idx + 1}`,
          title: it.title,
          videoUrl: it.videoUrl,
          videoName: it.videoName,
          pptUrl: it.pptUrl,
          pptName: it.pptName,
        })),
      },
      {
        id: 'section-2-minor-project',
        number: 2,
        title: sec2Items[0]?.title || 'Section 2: Production Minor Project',
        tagline: 'Hands-on Production Minor Capstone Project with Code Review',
        description: 'Production-ready minor portfolio project with live mentor evaluation and code walkthrough.',
        items: sec2Items,
        projectTitle: sec2Items[0]?.title || 'Production Minor Project',
        videoUrl: sec2Items[0]?.videoUrl || '',
        videoName: sec2Items[0]?.videoName || '',
        pptUrl: sec2Items[0]?.pptUrl || '',
        pptName: sec2Items[0]?.pptName || '',
      },
      {
        id: 'section-3-major-project',
        number: 3,
        title: sec3Items[0]?.title || 'Section 3: Enterprise Major Project',
        tagline: 'Comprehensive Industrial Capstone Portfolio Project',
        description: 'Full-fledged commercial enterprise capstone project architecture, development, and live deployment.',
        items: sec3Items,
        projectTitle: sec3Items[0]?.title || 'Enterprise Major Capstone Project',
        videoUrl: sec3Items[0]?.videoUrl || '',
        videoName: sec3Items[0]?.videoName || '',
        pptUrl: sec3Items[0]?.pptUrl || '',
        pptName: sec3Items[0]?.pptName || '',
      },
    ];

    onSave({
      title: title.trim(),
      description: description.trim(),
      subtitle: description.trim(),
      thumbnail,
      domain: program?.domain || title.trim(),
      track: program?.track || title.trim(),
      type: program?.type || 'internship',
      duration: program?.duration || '2 Months Internship + Training',
      mode: program?.mode || 'Live Online • Weekend Classes',
      stipendOrFee: `₹${numDiscountFee} Tuition • Free 2-Month Internship`,
      trainingPrice: numDiscountFee,
      originalPrice: numOrigFee,
      internshipPrice: 0,
      schedule: program?.schedule || {
        badge: 'Weekend Live Batches',
        days: 'Every Saturday & Sunday',
        timings: 'Live Interactive Sessions + 24/7 Session Recordings',
        flexibility: 'Specially crafted for College Students & Working Professionals',
      },
      durations: program?.durations || {
        total: '2 Months Internship + Training',
        trainingWeeks: '4 Weeks Intensive Live Training',
        internshipWeeks: '2 Months Hands-on Industrial Internship',
      },
      sections: formattedSections,
      credentials: program?.credentials || [
        { id: 'cred-1', title: 'Letter of Recommendation (LOR)', issuedBy: 'Binary Vidya Technical Board' },
        { id: 'cred-2', title: 'Internship Completion Certificate', issuedBy: 'Binary Vidya Technical Academy' },
        { id: 'cred-3', title: 'Training Certificate', issuedBy: 'Binary Vidya Faculty' },
        { id: 'cred-4', title: 'Outstanding & Excellence Certificate', issuedBy: 'Honors Committee' },
      ],
      eligibility: program?.eligibility || 'College Students, Freshers & Working Professionals',
      perks: program?.perks || [
        'Official Internship Certificate with verification ID',
        'Letter of Recommendation (LOR)',
        '100% Free 2-Month Industrial Internship',
        'Weekend Live Interactive Classes + Recordings',
      ],
      deadline: program?.deadline || 'Rolling Admissions',
      status: program?.status || 'open',
    });
  };

  // Helper renderer for a Section's items
  const renderSectionCrud = (
    sectionNumber: 1 | 2 | 3,
    titleText: string,
    accentColor: string,
    badgeBg: string,
    badgeBorder: string,
    items: VideoPptItem[]
  ) => {
    return (
      <div
        style={{
          padding: '18px',
          background: '#ffffff',
          borderRadius: '14px',
          border: `1.5px solid ${accentColor}33`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: accentColor, background: badgeBg, border: `1px solid ${badgeBorder}`, padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                Section {sectionNumber}
              </span>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                {titleText}
              </h4>
            </div>
            <span style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: 'block' }}>
              Manage videos &amp; related presentation files with full CRUD operations.
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleAddItem(sectionNumber)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              background: badgeBg,
              border: `1px solid ${badgeBorder}`,
              color: accentColor,
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Plus size={14} /> Add Video &amp; PPT
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map((it, idx) => {
            const isUploadingThisVideo = uploadSec === sectionNumber && uploadIdx === idx && uploadType === 'video';
            const isUploadingThisPpt = uploadSec === sectionNumber && uploadIdx === idx && uploadType === 'ppt';

            return (
              <div
                key={it.id || idx}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  padding: '14px',
                }}
              >
                {/* Title & Delete */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', background: '#ffffff', border: '1px solid #cbd5e1', padding: '3px 7px', borderRadius: '6px' }}>
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      required
                      value={it.title}
                      onChange={(e) => handleItemChange(sectionNumber, idx, 'title', e.target.value)}
                      placeholder="Title / Topic name..."
                      className={styles.formInput}
                      style={{ fontSize: '13px', fontWeight: 600, padding: '6px 10px', background: '#ffffff' }}
                    />
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(sectionNumber, idx)}
                      style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#dc2626',
                        padding: '5px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginLeft: '8px',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {/* Media Row: Video & PPT */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                  {/* Video Box */}
                  <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Video size={13} color="#2563eb" /> Video Lecture
                      </span>
                      {it.videoUrl && (
                        <span style={{ fontSize: '10px', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <CheckCircle2 size={11} /> Attached
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: '#2563eb',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        {isUploadingThisVideo ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                        {isUploadingThisVideo ? 'Uploading...' : 'Upload Video'}
                        <input
                          type="file"
                          accept="video/*,.mp4,.mov,.webm,.mkv"
                          onChange={(e) => handleUploadFileForSection(sectionNumber, idx, 'video', e)}
                          style={{ display: 'none' }}
                          disabled={isUploadingThisVideo}
                        />
                      </label>

                      <input
                        type="url"
                        value={it.videoUrl}
                        onChange={(e) => handleItemChange(sectionNumber, idx, 'videoUrl', e.target.value)}
                        placeholder="Or paste video link"
                        className={styles.formInput}
                        style={{ fontSize: '11px', padding: '5px 8px', flex: 1 }}
                      />
                    </div>
                    {it.videoName && (
                      <span style={{ fontSize: '10px', color: '#64748b', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        📁 {it.videoName}
                      </span>
                    )}
                  </div>

                  {/* PPT Box */}
                  <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FileText size={13} color="#059669" /> Related PPT / PDF
                      </span>
                      {it.pptUrl && (
                        <span style={{ fontSize: '10px', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <CheckCircle2 size={11} /> Attached
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: '#059669',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        {isUploadingThisPpt ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                        {isUploadingThisPpt ? 'Uploading...' : 'Upload PPT/PDF'}
                        <input
                          type="file"
                          accept=".ppt,.pptx,.pdf,.doc,.docx"
                          onChange={(e) => handleUploadFileForSection(sectionNumber, idx, 'ppt', e)}
                          style={{ display: 'none' }}
                          disabled={isUploadingThisPpt}
                        />
                      </label>

                      <input
                        type="url"
                        value={it.pptUrl}
                        onChange={(e) => handleItemChange(sectionNumber, idx, 'pptUrl', e.target.value)}
                        placeholder="Or paste PPT link"
                        className={styles.formInput}
                        style={{ fontSize: '11px', padding: '5px 8px', flex: 1 }}
                      />
                    </div>
                    {it.pptName && (
                      <span style={{ fontSize: '10px', color: '#64748b', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        📊 {it.pptName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '92vh' }}>
        <div className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={22} />
            </div>
            <div>
              <h3 className={styles.modalTitle}>
                {program ? 'Edit Training & Internship Program' : 'Add Training & Internship Program'}
              </h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                Set title, description, thumbnail, training fees, and manage videos &amp; PPTs for Sections 1, 2, and 3.
              </p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeModalBtn}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* 1. INTERNSHIP TITLE */}
            <div>
              <label className={styles.formLabel} style={{ fontWeight: 700, fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                Internship Title *
              </label>
              <input
                type="text"
                required
                className={styles.formInput}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Frontend Developer Training & 2-Month Industrial Internship"
                style={{ fontSize: '14px', fontWeight: 600 }}
              />
            </div>

            {/* 2. DESCRIPTION */}
            <div>
              <label className={styles.formLabel} style={{ fontWeight: 700, fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                Description *
              </label>
              <textarea
                required
                rows={3}
                className={styles.formTextarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Comprehensive overview of training modules, technologies, minor/major capstones, and industrial internship details..."
              />
            </div>

            {/* 3. THUMBNAIL */}
            <div style={{ padding: '16px 18px', background: '#f8fafc', borderRadius: '14px', border: '1.5px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ImageIcon size={16} color="#2563eb" /> Program Thumbnail
                </span>
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
                  <div style={{ position: 'relative', width: '200px', height: '112px', borderRadius: '10px', overflow: 'hidden', border: '2px solid #2563eb', flexShrink: 0, background: '#0f172a' }}>
                    <img src={thumbnail} alt="Thumbnail Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ width: '200px', height: '112px', borderRadius: '10px', border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: '6px', flexShrink: 0, background: '#ffffff' }}>
                    <ImageIcon size={26} color="#cbd5e1" />
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
                    {isCompressingThumb ? 'Compressing...' : 'Upload Image File'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailFile}
                      style={{ display: 'none' }}
                      disabled={isCompressingThumb}
                    />
                  </label>

                  {thumbnailStats && (
                    <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '6px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', fontSize: '11px', fontWeight: 700 }}>
                      <Zap size={13} color="#059669" />
                      Optimized: {thumbnailStats.orig} &rarr; {thumbnailStats.comp} ({thumbnailStats.saved}% saved)
                    </div>
                  )}

                  <div style={{ marginTop: '10px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                      Or paste direct image URL:
                    </span>
                    <input
                      type="url"
                      value={thumbnail}
                      onChange={(e) => setThumbnail(e.target.value)}
                      placeholder="https://images.unsplash.com/... or CDN link"
                      className={styles.formInput}
                      style={{ padding: '7px 10px', fontSize: '12px' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. TRAINING FEE'S (ORIGINAL, AFTER DISCOUNT) */}
            <div style={{ padding: '16px 18px', background: '#ecfdf5', borderRadius: '14px', border: '1.5px solid #a7f3d0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 800, fontSize: '13px', color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IndianRupee size={16} color="#059669" /> Training Fee&apos;s
                </span>
                <span style={{ fontSize: '11px', fontWeight: 800, background: '#ffffff', color: '#059669', padding: '3px 8px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                  2-Month Industrial Internship is 100% Free of Cost (₹0)
                </span>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} style={{ color: '#065f46' }}>Original Training Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className={styles.formInput}
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="e.g. 7999"
                    style={{ background: '#ffffff' }}
                  />
                  <span style={{ fontSize: '11px', color: '#047857', marginTop: '4px', display: 'block' }}>
                    Strikethrough base tuition fee
                  </span>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} style={{ color: '#065f46' }}>Training Fee After Discount (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className={styles.formInput}
                    value={trainingPrice}
                    onChange={(e) => setTrainingPrice(e.target.value)}
                    placeholder="e.g. 2400"
                    style={{ fontWeight: 700, color: '#059669', background: '#ffffff' }}
                  />
                  <span style={{ fontSize: '11px', color: '#047857', marginTop: '4px', display: 'block' }}>
                    {scholarshipPct > 0 ? `Learner pays ₹${numDiscountFee} (${scholarshipPct}% scholarship)` : 'Final tuition fee'}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. 3 CURRICULUM SECTIONS CRUD */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* SECTION 1: Training Video & PPT */}
              {renderSectionCrud(
                1,
                'Section 1: Training Videos & Related PPTs',
                '#2563eb',
                '#eff6ff',
                '#bfdbfe',
                sec1Items
              )}

              {/* SECTION 2: Minor Project PPT & Related Video */}
              {renderSectionCrud(
                2,
                'Section 2: Minor Project PPT & Related Videos',
                '#059669',
                '#ecfdf5',
                '#a7f3d0',
                sec2Items
              )}

              {/* SECTION 3: Major Project & PPT Related to Video */}
              {renderSectionCrud(
                3,
                'Section 3: Major Project Video & Related PPTs',
                '#7c3aed',
                '#f5f3ff',
                '#ddd6fe',
                sec3Items
              )}
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}>
              <Check size={16} /> Save Program &amp; Curriculum
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

// TEAM MEMBER FORM MODAL COMPONENT (SUPER ADMIN ONLY)
interface TeamMemberModalProps {
  member: TeamMemberItem | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

function TeamMemberModal({ member, onClose, onSave }: TeamMemberModalProps) {
  const isEditing = Boolean(member);

  const [name, setName] = useState(member?.name || '');
  const [email, setEmail] = useState(member?.email || '');
  const [phone, setPhone] = useState(member?.phone || '');
  const [department, setDepartment] = useState(member?.department || 'Content Team');
  const [password, setPassword] = useState('');
  const [teamStatus, setTeamStatus] = useState<'active' | 'suspended'>(member?.teamStatus || 'active');

  const [permissions, setPermissions] = useState<TeamMemberPermissions>({
    manageCourses: member?.permissions?.manageCourses || false,
    manageTraining: member?.permissions?.manageTraining || false,
    manageCareers: member?.permissions?.manageCareers || false,
    viewAnalytics: member?.permissions?.viewAnalytics || false,
    manageCertificates: member?.permissions?.manageCertificates || false,
    manageTeam: member?.permissions?.manageTeam || false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Department presets helper
  const applyPreset = (presetName: string) => {
    setDepartment(presetName);
    switch (presetName) {
      case 'HR Team':
        setPermissions({
          manageCourses: false,
          manageTraining: false,
          manageCareers: true,
          viewAnalytics: true,
          manageCertificates: false,
          manageTeam: true,
        });
        break;
      case 'Content Team':
        setPermissions({
          manageCourses: true,
          manageTraining: true,
          manageCareers: false,
          viewAnalytics: false,
          manageCertificates: false,
        });
        break;
      case 'Student Operations':
        setPermissions({
          manageCourses: true,
          manageTraining: true,
          manageCareers: true,
          viewAnalytics: true,
          manageCertificates: true,
        });
        break;
      case 'Instructors & Mentors':
        setPermissions({
          manageCourses: true,
          manageTraining: true,
          manageCareers: false,
          viewAnalytics: false,
          manageCertificates: true,
        });
        break;
      default:
        break;
    }
  };

  const togglePermission = (key: keyof TeamMemberPermissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Member full name is required');
      return;
    }

    if (!email.trim()) {
      setFormError('Member email address is required');
      return;
    }

    if (!isEditing && (!password || password.length < 6)) {
      setFormError('Temporary login password must contain at least 6 characters');
      return;
    }

    if (isEditing && password && password.length < 6) {
      setFormError('Updated password must be at least 6 characters');
      return;
    }

    try {
      setSubmitting(true);
      await onSave({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        department,
        password: password.trim() || undefined,
        permissions,
        teamStatus,
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to save team member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer} style={{ maxWidth: '780px' }}>
        <div className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Users size={20} />
            </div>
            <div>
              <h2 className={styles.modalTitle}>
                {isEditing ? `Edit Team Member: ${member?.name}` : 'Add New Staff Team Member'}
              </h2>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                Assign department roles and customize granular administrative access permissions.
              </p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeBtn} title="Close Modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody} style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            {formError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            <div className={styles.securityNoticeBanner}>
              <ShieldCheck size={18} />
              <span>
                <strong>Access Policy:</strong> Super Administrators and the HR Team have authorization to add staff members and assign departmental roles. Root Super Admin (aryar0779@gmail.com) remains permanently protected.
              </span>
            </div>

            {/* Department Quick Presets */}
            <div className={styles.presetContainer}>
              <span className={styles.presetLabel}>Select Department Preset (Auto-Configures Access):</span>
              <div className={styles.presetButtonGroup}>
                {[
                  { name: 'HR Team', icon: <Briefcase size={13} /> },
                  { name: 'Content Team', icon: <BookOpen size={13} /> },
                  { name: 'Student Operations', icon: <Zap size={13} /> },
                  { name: 'Instructors & Mentors', icon: <GraduationCap size={13} /> },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset.name)}
                    className={`${styles.presetBtn} ${department === preset.name ? styles.presetBtnActive : ''}`}
                  >
                    {preset.icon}
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Info Grid */}
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Full Name *</label>
                <input
                  type="text"
                  required
                  className={styles.formInput}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Staff Work Email *</label>
                <input
                  type="email"
                  required
                  disabled={isEditing}
                  className={styles.formInput}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya.hr@binaryvidya.com"
                  style={isEditing ? { background: '#f1f5f9', cursor: 'not-allowed' } : {}}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mobile / WhatsApp (Optional)</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Assigned Department *</label>
                <select
                  className={styles.formSelect}
                  value={department}
                  onChange={(e) => applyPreset(e.target.value)}
                >
                  <option value="HR Team">HR Team</option>
                  <option value="Content Team">Content Team</option>
                  <option value="Student Operations">Student Operations</option>
                  <option value="Instructors & Mentors">Instructors & Mentors</option>
                  <option value="Custom Department">Custom Department</option>
                </select>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  Need to add Sales / CRM agents (CSM, BDA, Lead Gen)? <a href="/sales/team" target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>Use Sales Team Portal &rarr;</a>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  {isEditing ? 'New Password (leave blank to keep current)' : 'Login Password *'}
                </label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEditing ? 'Keep existing password' : 'At least 6 characters'}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Account Status</label>
                <select
                  className={styles.formSelect}
                  value={teamStatus}
                  onChange={(e) => setTeamStatus(e.target.value as any)}
                >
                  <option value="active">Active (Access Enabled)</option>
                  <option value="suspended">Suspended (Access Blocked)</option>
                </select>
              </div>
            </div>

            {/* Granular Permissions Section */}
            <div style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                    Granular Access &amp; Permissions
                  </h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                    Control what this team member can view, create, edit, or manage on Binary Vidya.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() =>
                      setPermissions({
                        manageCourses: true,
                        manageTraining: true,
                        manageCareers: true,
                        viewAnalytics: true,
                        manageCertificates: true,
                        manageTeam: true,
                      })
                    }
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Check All
                  </button>
                  <span style={{ color: '#cbd5e1' }}>•</span>
                  <button
                    type="button"
                    onClick={() =>
                      setPermissions({
                        manageCourses: false,
                        manageTraining: false,
                        manageCareers: false,
                        viewAnalytics: false,
                        manageCertificates: false,
                        manageTeam: false,
                      })
                    }
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className={styles.permissionCardGrid}>
                {/* Courses Permission */}
                <div
                  className={`${styles.permissionCard} ${permissions.manageCourses ? styles.permissionCardActive : ''}`}
                  onClick={() => togglePermission('manageCourses')}
                >
                  <input
                    type="checkbox"
                    checked={permissions.manageCourses}
                    onChange={() => {}}
                    className={styles.permissionCheckbox}
                  />
                  <div className={styles.permissionContent}>
                    <span className={styles.permissionTitle}>
                      <BookOpen size={15} color="#2563eb" /> Course Management
                    </span>
                    <span className={styles.permissionDesc}>
                      Create, edit, and publish technical courses, chapters, lectures, and video tutorials.
                    </span>
                  </div>
                </div>

                {/* Training Permission */}
                <div
                  className={`${styles.permissionCard} ${permissions.manageTraining ? styles.permissionCardActive : ''}`}
                  onClick={() => togglePermission('manageTraining')}
                >
                  <input
                    type="checkbox"
                    checked={permissions.manageTraining}
                    onChange={() => {}}
                    className={styles.permissionCheckbox}
                  />
                  <div className={styles.permissionContent}>
                    <span className={styles.permissionTitle}>
                      <GraduationCap size={15} color="#059669" /> Training &amp; Internships
                    </span>
                    <span className={styles.permissionDesc}>
                      Manage cohort programs, tracks, weekend timings, curriculum syllabus, and pricing.
                    </span>
                  </div>
                </div>

                {/* Careers Permission */}
                <div
                  className={`${styles.permissionCard} ${permissions.manageCareers ? styles.permissionCardActive : ''}`}
                  onClick={() => togglePermission('manageCareers')}
                >
                  <input
                    type="checkbox"
                    checked={permissions.manageCareers}
                    onChange={() => {}}
                    className={styles.permissionCheckbox}
                  />
                  <div className={styles.permissionContent}>
                    <span className={styles.permissionTitle}>
                      <Briefcase size={15} color="#7c3aed" /> Careers &amp; Hiring
                    </span>
                    <span className={styles.permissionDesc}>
                      Post job vacancies, update job descriptions, review applicants, and manage recruitment.
                    </span>
                  </div>
                </div>

                {/* Analytics Permission */}
                <div
                  className={`${styles.permissionCard} ${permissions.viewAnalytics ? styles.permissionCardActive : ''}`}
                  onClick={() => togglePermission('viewAnalytics')}
                >
                  <input
                    type="checkbox"
                    checked={permissions.viewAnalytics}
                    onChange={() => {}}
                    className={styles.permissionCheckbox}
                  />
                  <div className={styles.permissionContent}>
                    <span className={styles.permissionTitle}>
                      <TrendingUp size={15} color="#d97706" /> Platform Analytics
                    </span>
                    <span className={styles.permissionDesc}>
                      Access student counts, enrollment trends, platform metrics, and system activity logs.
                    </span>
                  </div>
                </div>

                {/* Certificates Permission */}
                <div
                  className={`${styles.permissionCard} ${permissions.manageCertificates ? styles.permissionCardActive : ''}`}
                  onClick={() => togglePermission('manageCertificates')}
                >
                  <input
                    type="checkbox"
                    checked={permissions.manageCertificates}
                    onChange={() => {}}
                    className={styles.permissionCheckbox}
                  />
                  <div className={styles.permissionContent}>
                    <span className={styles.permissionTitle}>
                      <Award size={15} color="#0284c7" /> Certificate Verification
                    </span>
                    <span className={styles.permissionDesc}>
                      Issue and verify authenticated certificates of completion, LORs, and internship credentials.
                    </span>
                  </div>
                </div>

                {/* Team Management Permission */}
                <div
                  className={`${styles.permissionCard} ${permissions.manageTeam ? styles.permissionCardActive : ''}`}
                  onClick={() => togglePermission('manageTeam')}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(permissions.manageTeam)}
                    onChange={() => {}}
                    className={styles.permissionCheckbox}
                  />
                  <div className={styles.permissionContent}>
                    <span className={styles.permissionTitle}>
                      <Users size={15} color="#4338ca" /> Team &amp; Staff Management
                    </span>
                    <span className={styles.permissionDesc}>
                      Add new staff team members, configure department roles, and manage access permissions (HR &amp; Leadership).
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.cancelBtn} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              style={{ background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)' }}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <RefreshCw size={16} className={styles.spinner} /> Saving...
                </>
              ) : (
                <>
                  <Check size={16} /> {isEditing ? 'Save Changes' : 'Create Team Member'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
