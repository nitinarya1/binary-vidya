'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCrm } from '../../../context/CrmContext';
import { CrmSidebar } from '../../../components/crm/CrmSidebar';
import { DispositionModal } from '../../../components/crm/DispositionModal';
import { SendLinkModal } from '../../../components/crm/SendLinkModal';
import { TemperatureBadge } from '../../../components/crm/TemperatureBadge';
import { CallbacksBadgeTab } from '../../../components/crm/CallbacksBadgeTab';
import { FollowUpSchedulerModal } from '../../../components/crm/FollowUpSchedulerModal';
import { ClaimOrReassignCell } from '../../../components/crm/ClaimOrReassignCell';
import { BulkActionBar } from '../../../components/crm/BulkActionBar';
import { LeadActivityDrawer } from '../../../components/crm/LeadActivityDrawer';
import {
  Search,
  Phone,
  Link as LinkIcon,
  ChevronDown,
  RefreshCw,
  Calendar,
  GraduationCap,
  BookOpen,
  School,
  Filter,
  RotateCcw,
  X,
  Users,
  User,
  MessageCircle,
  Clock,
  Eye,
  CheckSquare,
  Square,
} from 'lucide-react';

type LeadStatus = 'new' | 'contacted' | 'interested' | 'follow_up' | 'converted' | 'not_interested' | 'no_answer' | 'invalid';

interface Lead {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  course?: string;
  collegeName?: string;
  year?: string;
  branch?: string;
  source: string;
  status: LeadStatus;
  statusUpdatedBy?: string;
  statusUpdatedByName?: string;
  statusUpdatedAt?: string;
  followUpAt?: string;
  temperature?: 'hot' | 'warm' | 'cold';
  callNotes?: {
    agentId: string;
    agentName: string;
    note: string;
    status: LeadStatus;
    followUpAt?: string;
    createdAt: string;
  }[];
  assignedTo?: string | null;
  assignedAgentName?: string;
  lastContactedAt?: string;
  paymentLinkSent?: boolean;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  new: '#2563eb',
  contacted: '#0284c7',
  interested: '#059669',
  follow_up: '#d97706',
  converted: '#7c3aed',
  not_interested: '#dc2626',
  no_answer: '#64748b',
  invalid: '#9ca3af',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  interested: 'Interested',
  follow_up: 'Follow Up',
  converted: 'Converted',
  not_interested: 'Not Interested',
  no_answer: 'No Answer',
  invalid: 'Invalid',
};

const PRESET_COURSES = [
  'Full Stack Web Development (MERN)',
  'Frontend Mastery (React, Next.js, TS)',
  'Cloud Computing & DevOps',
  'Generative AI, LLMs & Prompt Engineering',
  'Data Science & Analytics',
  'Backend Architecture & System Design',
  'DSA & Placement Preparation',
  'General Career Guidance / Not Decided Yet',
];

const PRESET_YEARS = [
  '1st Year (Freshman)',
  '2nd Year (Sophomore)',
  '3rd Year (Pre-final)',
  '4th / Final Year',
  'Recent Graduate (Looking for Jobs)',
  'Working Professional / Career Switcher',
];

function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function LeadsPage() {
  const { crmUser, loading } = useCrm();
  const router = useRouter();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'yesterday' | '7days' | '30days' | 'this_month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCallbacksDueToday, setIsCallbacksDueToday] = useState(false);

  // Callbacks Due Today count
  const [callbacksCount, setCallbacksCount] = useState(0);

  // Multi-select Checkbox State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Available options from DB
  const [availableColleges, setAvailableColleges] = useState<string[]>([]);
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);

  // Modals & Drawer State
  const [dispositionLead, setDispositionLead] = useState<Lead | null>(null);
  const [sendLinkLead, setSendLinkLead] = useState<Lead | null>(null);
  const [followUpModalLead, setFollowUpModalLead] = useState<Lead | null>(null);
  const [drawerLeadId, setDrawerLeadId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !crmUser) router.replace('/sales/login');
  }, [loading, crmUser, router]);

  // Load available agents for assignment dropdowns
  const loadAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/crm/team', { credentials: 'include' });
      const data = await res.json();
      if (data.success && Array.isArray(data.agents)) {
        setAvailableAgents(data.agents);
      }
    } catch {}
  }, []);

  // Load Callbacks Today Count
  const loadCallbacksCount = useCallback(async () => {
    try {
      const res = await fetch('/api/crm/leads/callbacks-today', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setCallbacksCount(data.count || 0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (crmUser) {
      loadAgents();
      loadCallbacksCount();
    }
  }, [crmUser, loadAgents, loadCallbacksCount]);

  // Handle Preset Date changes
  const handleDatePresetChange = (preset: typeof datePreset) => {
    setDatePreset(preset);
    const now = new Date();

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      const today = toISODate(now);
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yesterday = toISODate(y);
      setStartDate(yesterday);
      setEndDate(yesterday);
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      setStartDate(toISODate(past));
      setEndDate(toISODate(now));
    } else if (preset === '30days') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      setStartDate(toISODate(past));
      setEndDate(toISODate(now));
    } else if (preset === 'this_month') {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(toISODate(firstOfMonth));
      setEndDate(toISODate(now));
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setCourseFilter('all');
    setYearFilter('all');
    setCollegeFilter('');
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    setIsCallbacksDueToday(false);
  };

  const hasActiveFilters = useMemo(() => {
    return (
      search.trim() !== '' ||
      statusFilter !== 'all' ||
      courseFilter !== 'all' ||
      yearFilter !== 'all' ||
      collegeFilter.trim() !== '' ||
      datePreset !== 'all' ||
      startDate !== '' ||
      endDate !== '' ||
      isCallbacksDueToday
    );
  }, [search, statusFilter, courseFilter, yearFilter, collegeFilter, datePreset, startDate, endDate, isCallbacksDueToday]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count++;
    if (statusFilter !== 'all') count++;
    if (courseFilter !== 'all') count++;
    if (yearFilter !== 'all') count++;
    if (collegeFilter.trim()) count++;
    if (datePreset !== 'all' || startDate || endDate) count++;
    if (isCallbacksDueToday) count++;
    return count;
  }, [search, statusFilter, courseFilter, yearFilter, collegeFilter, datePreset, startDate, endDate, isCallbacksDueToday]);

  // Combined courses list
  const allCourseOptions = useMemo(() => {
    const set = new Set<string>(PRESET_COURSES);
    availableCourses.forEach((c) => {
      if (c && c.trim()) set.add(c.trim());
    });
    return Array.from(set);
  }, [availableCourses]);

  const loadLeads = useCallback(async () => {
    setFetching(true);
    try {
      if (isCallbacksDueToday) {
        const res = await fetch('/api/crm/leads/callbacks-today', { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setLeads(data.leads || []);
          setTotal(data.count || 0);
        }
      } else {
        const params = new URLSearchParams({ limit: '100' });
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (courseFilter !== 'all') params.set('course', courseFilter);
        if (yearFilter !== 'all') params.set('year', yearFilter);
        if (collegeFilter.trim()) params.set('college', collegeFilter.trim());
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        if (search.trim()) params.set('search', search.trim());

        const res = await fetch(`/api/crm/leads?${params.toString()}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setLeads(data.leads || []);
          setTotal(data.total || 0);
          if (Array.isArray(data.availableColleges) && data.availableColleges.length > 0) {
            setAvailableColleges(data.availableColleges);
          }
          if (Array.isArray(data.availableCourses) && data.availableCourses.length > 0) {
            setAvailableCourses(data.availableCourses);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    }
    setFetching(false);
  }, [isCallbacksDueToday, statusFilter, courseFilter, yearFilter, collegeFilter, startDate, endDate, search]);

  useEffect(() => {
    if (crmUser) {
      const timer = setTimeout(loadLeads, 250);
      return () => clearTimeout(timer);
    }
  }, [crmUser, loadLeads]);

  // Single-lead action handlers
  const handleSaveDisposition = async (leadId: string, status: LeadStatus, note: string) => {
    if (status === 'follow_up') {
      const targetLead = leads.find((l) => l._id === leadId);
      if (targetLead) {
        setDispositionLead(null);
        setFollowUpModalLead(targetLead);
        return;
      }
    }

    const res = await fetch(`/api/crm/leads/${leadId}/disposition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status, note }),
    });
    const data = await res.json();
    if (data.success) {
      loadLeads();
      loadCallbacksCount();
    }
  };

  const handleSaveScheduledFollowUp = async (leadId: string, status: string, note: string, followUpAt: string) => {
    const res = await fetch(`/api/crm/leads/${leadId}/disposition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status, note, followUpAt }),
    });
    const data = await res.json();
    if (data.success) {
      loadLeads();
      loadCallbacksCount();
    }
  };

  const handleClaim = async (leadId: string) => {
    const res = await fetch(`/api/crm/leads/${leadId}/claim`, {
      method: 'POST',
      credentials: 'include',
    });
    const data = await res.json();
    if (data.success) {
      loadLeads();
    }
  };

  const handleReassign = async (leadId: string, agentId: string, agentName: string) => {
    const res = await fetch(`/api/crm/leads/${leadId}/reassign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ agentId, agentName }),
    });
    const data = await res.json();
    if (data.success) {
      loadLeads();
    }
  };

  // Bulk Operations
  const handleToggleSelectAll = () => {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map((l) => l._id));
    }
  };

  const handleToggleSelectRow = (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    );
  };

  const handleBulkAssign = async (agentId: string, agentName: string) => {
    const res = await fetch('/api/crm/leads/bulk-assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ leadIds: selectedIds, agentId, agentName }),
    });
    const data = await res.json();
    if (data.success) {
      setSelectedIds([]);
      loadLeads();
    }
  };

  const handleBulkStatus = async (status: string) => {
    const res = await fetch('/api/crm/leads/bulk-status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ leadIds: selectedIds, status }),
    });
    const data = await res.json();
    if (data.success) {
      setSelectedIds([]);
      loadLeads();
      loadCallbacksCount();
    }
  };

  const handleWhatsAppClick = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = lead.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const text = encodeURIComponent(
      `Hi ${lead.name}, this is regarding your inquiry for ${lead.course || 'the course'} at Binary Vidya. When is a good time to connect for a quick 5-min counselling call?`
    );
    window.open(`https://wa.me/${phoneWithCountry}?text=${text}`, '_blank');
  };

  if (loading || !crmUser) {
    return (
      <div style={{ minHeight: '100vh', background: '#f1f6fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 600 }}>Loading CRM Leads Queue...</div>
      </div>
    );
  }

  const isSuperAdmin = crmUser.role === 'super_admin' || crmUser.email === 'aryar0779@gmail.com';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f6fe', fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif" }}>
      <CrmSidebar />

      <main style={{ flex: 1, padding: '28px 32px', overflow: 'auto', minWidth: 0 }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Leads Calling Queue
              </h1>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#dbeafe',
                  color: '#1d4ed8',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: '999px',
                }}
              >
                <Users size={12} />
                Global Access (All Leads Visible)
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
              Showing <strong style={{ color: '#0f172a' }}>{leads.length}</strong> of{' '}
              <strong style={{ color: '#0f172a' }}>{total}</strong> leads across all counselors and teams.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Callbacks Due Today Quick Filter Tab */}
            <CallbacksBadgeTab
              count={callbacksCount}
              isActive={isCallbacksDueToday}
              onClick={() => setIsCallbacksDueToday(!isCallbacksDueToday)}
            />

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 14px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  color: '#dc2626',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <RotateCcw size={13} />
                Reset ({activeFiltersCount})
              </button>
            )}

            <button
              onClick={loadLeads}
              disabled={fetching}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                background: '#ffffff',
                border: '1px solid #bfdbfe',
                borderRadius: '10px',
                color: '#2563eb',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.06)',
              }}
            >
              <RefreshCw size={14} style={{ animation: fetching ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Toolbar Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '18px 20px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Filter size={15} color="#2563eb" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Filter Leads</span>
            {hasActiveFilters && (
              <span
                style={{
                  background: '#eff6ff',
                  color: '#2563eb',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '99px',
                }}
              >
                {activeFiltersCount} applied
              </span>
            )}
          </div>

          {/* Filter Controls Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search name, phone, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 34px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: '13px',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: 0,
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div style={{ position: 'relative' }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 32px 9px 12px',
                  borderRadius: '8px',
                  border: statusFilter !== 'all' ? '1px solid #2563eb' : '1px solid #cbd5e1',
                  background: statusFilter !== 'all' ? '#eff6ff' : '#f8fafc',
                  fontSize: '13px',
                  fontWeight: statusFilter !== 'all' ? 600 : 500,
                  color: statusFilter !== 'all' ? '#1d4ed8' : '#0f172a',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="all">All Statuses</option>
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                color={statusFilter !== 'all' ? '#1d4ed8' : '#94a3b8'}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
            </div>

            {/* Course Filter */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <BookOpen size={13} color={courseFilter !== 'all' ? '#1d4ed8' : '#94a3b8'} />
              </div>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 32px 9px 30px',
                  borderRadius: '8px',
                  border: courseFilter !== 'all' ? '1px solid #2563eb' : '1px solid #cbd5e1',
                  background: courseFilter !== 'all' ? '#eff6ff' : '#f8fafc',
                  fontSize: '13px',
                  fontWeight: courseFilter !== 'all' ? 600 : 500,
                  color: courseFilter !== 'all' ? '#1d4ed8' : '#0f172a',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="all">All Courses / Domains</option>
                {allCourseOptions.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                color={courseFilter !== 'all' ? '#1d4ed8' : '#94a3b8'}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
            </div>

            {/* Year Wise Filter */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <GraduationCap size={14} color={yearFilter !== 'all' ? '#1d4ed8' : '#94a3b8'} />
              </div>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 32px 9px 30px',
                  borderRadius: '8px',
                  border: yearFilter !== 'all' ? '1px solid #2563eb' : '1px solid #cbd5e1',
                  background: yearFilter !== 'all' ? '#eff6ff' : '#f8fafc',
                  fontSize: '13px',
                  fontWeight: yearFilter !== 'all' ? 600 : 500,
                  color: yearFilter !== 'all' ? '#1d4ed8' : '#0f172a',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="all">All Academic Years</option>
                {PRESET_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                color={yearFilter !== 'all' ? '#1d4ed8' : '#94a3b8'}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
            </div>

            {/* College Filter */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <School size={14} color={collegeFilter ? '#1d4ed8' : '#94a3b8'} />
              </div>
              <input
                list="college-options"
                type="text"
                placeholder="College Filter..."
                value={collegeFilter}
                onChange={(e) => setCollegeFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 30px 9px 30px',
                  borderRadius: '8px',
                  border: collegeFilter.trim() ? '1px solid #2563eb' : '1px solid #cbd5e1',
                  background: collegeFilter.trim() ? '#eff6ff' : '#f8fafc',
                  fontSize: '13px',
                  fontWeight: collegeFilter.trim() ? 600 : 500,
                  color: collegeFilter.trim() ? '#1d4ed8' : '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <datalist id="college-options">
                {availableColleges.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              {collegeFilter && (
                <button
                  onClick={() => setCollegeFilter('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: 0,
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Date Preset Filter */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <Calendar size={14} color={datePreset !== 'all' ? '#1d4ed8' : '#94a3b8'} />
              </div>
              <select
                value={datePreset}
                onChange={(e) => handleDatePresetChange(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '9px 32px 9px 30px',
                  borderRadius: '8px',
                  border: datePreset !== 'all' ? '1px solid #2563eb' : '1px solid #cbd5e1',
                  background: datePreset !== 'all' ? '#eff6ff' : '#f8fafc',
                  fontSize: '13px',
                  fontWeight: datePreset !== 'all' ? 600 : 500,
                  color: datePreset !== 'all' ? '#1d4ed8' : '#0f172a',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="all">Date: All Time</option>
                <option value="today">Date: Today</option>
                <option value="yesterday">Date: Yesterday</option>
                <option value="7days">Date: Last 7 Days</option>
                <option value="30days">Date: Last 30 Days</option>
                <option value="this_month">Date: This Month</option>
                <option value="custom">Date: Custom Range...</option>
              </select>
              <ChevronDown
                size={14}
                color={datePreset !== 'all' ? '#1d4ed8' : '#94a3b8'}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
            </div>
          </div>

          {/* Custom Date Pickers */}
          {(datePreset === 'custom' || startDate || endDate) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px dashed #e2e8f0',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Date Range:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDatePreset('custom');
                  }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    background: '#fff',
                    color: '#0f172a',
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDatePreset('custom');
                  }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    background: '#fff',
                    color: '#0f172a',
                  }}
                />
              </div>
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setDatePreset('all');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 10px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  <X size={11} /> Clear Date
                </button>
              )}
            </div>
          )}

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Active:</span>

              {isCallbacksDueToday && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    color: '#92400e',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  Callbacks Due Today ({callbacksCount})
                  <X size={11} style={{ cursor: 'pointer' }} onClick={() => setIsCallbacksDueToday(false)} />
                </span>
              )}

              {search.trim() && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1d4ed8',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  Search: &ldquo;{search}&rdquo;
                  <X size={11} style={{ cursor: 'pointer' }} onClick={() => setSearch('')} />
                </span>
              )}

              {statusFilter !== 'all' && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1d4ed8',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  Status: {STATUS_LABELS[statusFilter] || statusFilter}
                  <X size={11} style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('all')} />
                </span>
              )}

              {courseFilter !== 'all' && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1d4ed8',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  Course: {courseFilter}
                  <X size={11} style={{ cursor: 'pointer' }} onClick={() => setCourseFilter('all')} />
                </span>
              )}

              {yearFilter !== 'all' && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1d4ed8',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  Year: {yearFilter}
                  <X size={11} style={{ cursor: 'pointer' }} onClick={() => setYearFilter('all')} />
                </span>
              )}

              {collegeFilter.trim() && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1d4ed8',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  College: {collegeFilter}
                  <X size={11} style={{ cursor: 'pointer' }} onClick={() => setCollegeFilter('')} />
                </span>
              )}
            </div>
          )}
        </div>

        {/* Table Container */}
        <div
          style={{
            background: '#fff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 12px rgba(15, 23, 42, 0.05)',
            overflow: 'hidden',
          }}
        >
          {/* Table Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '40px minmax(210px, 1.2fr) minmax(160px, 1fr) minmax(150px, 1fr) minmax(130px, 0.9fr) minmax(130px, 0.9fr) 110px 110px',
              padding: '14px 18px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            {/* Checkbox All */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <input
                type="checkbox"
                checked={leads.length > 0 && selectedIds.length === leads.length}
                onChange={handleToggleSelectAll}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#2563eb' }}
              />
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Student &amp; Temperature
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              College &amp; Year
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Target Course
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Date &amp; Follow-up
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Status &amp; Updated By
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Counselor Assignment
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>
              Actions
            </div>
          </div>

          {/* Table Body */}
          {fetching ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block', color: '#2563eb' }} />
              Updating leads list...
            </div>
          ) : leads.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <Search size={22} color="#2563eb" />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>No leads found</h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px', maxWidth: '360px', marginLeft: 'auto', marginRight: 'auto' }}>
                {hasActiveFilters
                  ? 'No leads match your current combination of filters. Try changing or resetting the filters.'
                  : 'There are currently no leads in the database.'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  style={{
                    padding: '8px 16px',
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            leads.map((lead, idx) => {
              const updaterName =
                lead.statusUpdatedByName ||
                lead.callNotes?.[lead.callNotes.length - 1]?.agentName ||
                (lead.source === 'public_form' ? 'Online Form' : '');

              const isSelected = selectedIds.includes(lead._id);

              return (
                <div
                  key={lead._id}
                  onClick={() => setDrawerLeadId(lead._id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px minmax(210px, 1.2fr) minmax(160px, 1fr) minmax(150px, 1fr) minmax(130px, 0.9fr) minmax(130px, 0.9fr) 110px 110px',
                    padding: '14px 18px',
                    borderBottom: idx < leads.length - 1 ? '1px solid #f1f5f9' : 'none',
                    alignItems: 'center',
                    gap: '12px',
                    background: isSelected ? '#eff6ff' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                >
                  {/* Row Checkbox */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleToggleSelectRow(lead._id, e as any)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#2563eb' }}
                    />
                  </div>

                  {/* 1. Student Name & Contact + Temperature */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>{lead.name}</span>
                      <TemperatureBadge createdAt={lead.createdAt} />
                    </div>
                    <div style={{ marginTop: '2px' }}>
                      <a
                        href={`tel:${lead.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          fontSize: '12px',
                          color: '#2563eb',
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        {lead.phone}
                      </a>
                    </div>
                    {lead.email && (
                      <div style={{ fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lead.email}
                      </div>
                    )}
                    <div style={{ marginTop: '3px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          background: '#f1f5f9',
                          color: '#475569',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          textTransform: 'capitalize',
                        }}
                      >
                        {lead.source?.replace('_', ' ') || 'Website'}
                      </span>
                    </div>
                  </div>

                  {/* 2. College & Year */}
                  <div>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#1e293b',
                        lineHeight: 1.3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <School size={12} color="#64748b" style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lead.collegeName || '—'}
                      </span>
                    </div>
                    {lead.year && (
                      <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px', fontWeight: 500 }}>
                        {lead.year}
                      </div>
                    )}
                    {lead.branch && (
                      <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>
                        Branch: {lead.branch}
                      </div>
                    )}
                  </div>

                  {/* 3. Course */}
                  <div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#0f172a',
                        fontWeight: 600,
                        lineHeight: 1.3,
                      }}
                    >
                      {lead.course || '—'}
                    </div>
                  </div>

                  {/* 4. Date & Follow-up */}
                  <div>
                    <div style={{ fontSize: '11px', color: '#334155', fontWeight: 600 }}>
                      {formatDate(lead.createdAt)}
                    </div>
                    {lead.followUpAt && (
                      <div
                        style={{
                          marginTop: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '10px',
                          color: '#b45309',
                          fontWeight: 700,
                        }}
                        title={`Follow-up callback: ${formatDate(lead.followUpAt)}`}
                      >
                        <Clock size={11} color="#d97706" />
                        <span>Callback: {formatDate(lead.followUpAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* 5. Status & Updater */}
                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '99px',
                        background: `${STATUS_COLORS[lead.status] || '#64748b'}18`,
                        color: STATUS_COLORS[lead.status] || '#64748b',
                        border: `1px solid ${STATUS_COLORS[lead.status] || '#64748b'}30`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {STATUS_LABELS[lead.status] || lead.status}
                    </span>

                    {/* Updater Name */}
                    {updaterName && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          marginTop: '4px',
                          fontSize: '11px',
                          color: '#475569',
                          fontWeight: 500,
                          lineHeight: 1.2,
                        }}
                        title={`Status updated by ${updaterName}`}
                      >
                        <User size={10} color="#64748b" style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <strong style={{ color: '#0f172a', fontWeight: 600 }}>{updaterName}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 6. Claim / Reassign Counselor Cell */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <ClaimOrReassignCell
                      leadId={lead._id}
                      assignedTo={lead.assignedTo}
                      assignedAgentName={lead.assignedAgentName}
                      currentUserId={crmUser.id}
                      isSuperAdmin={isSuperAdmin}
                      availableAgents={availableAgents}
                      onClaim={handleClaim}
                      onReassign={handleReassign}
                    />
                  </div>

                  {/* 7. Actions */}
                  <div
                    style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end', alignItems: 'center' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Call & Disposition */}
                    <button
                      title="Log Call Outcome"
                      onClick={() => setDispositionLead(lead)}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '7px',
                        border: '1px solid #bfdbfe',
                        background: '#eff6ff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Phone size={13} color="#2563eb" />
                    </button>

                    {/* WhatsApp 1-Click */}
                    <button
                      title="1-Click WhatsApp Chat"
                      onClick={(e) => handleWhatsAppClick(lead, e)}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '7px',
                        border: '1px solid #bbf7d0',
                        background: '#f0fdf4',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <MessageCircle size={13} color="#16a34a" />
                    </button>

                    {/* Send Payment Link */}
                    <button
                      title="Send Payment Link"
                      onClick={() => setSendLinkLead(lead)}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '7px',
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <LinkIcon size={13} color="#475569" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Bulk Action Bar (Fixed at bottom on multi-selection) */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        availableAgents={availableAgents}
        onDeselectAll={() => setSelectedIds([])}
        onBulkAssign={handleBulkAssign}
        onBulkStatus={handleBulkStatus}
      />

      {/* Activity Timeline Slide-over Drawer */}
      {drawerLeadId && (
        <LeadActivityDrawer
          leadId={drawerLeadId}
          onClose={() => setDrawerLeadId(null)}
          onOpenDisposition={(l) => {
            setDrawerLeadId(null);
            setDispositionLead(l);
          }}
          onOpenSendLink={(l) => {
            setDrawerLeadId(null);
            setSendLinkLead(l);
          }}
        />
      )}

      {/* Standard Disposition Modal */}
      {dispositionLead && (
        <DispositionModal
          lead={dispositionLead}
          onClose={() => setDispositionLead(null)}
          onSave={handleSaveDisposition}
        />
      )}

      {/* Follow-Up Scheduled Callback Modal */}
      {followUpModalLead && (
        <FollowUpSchedulerModal
          lead={followUpModalLead}
          onClose={() => setFollowUpModalLead(null)}
          onSave={handleSaveScheduledFollowUp}
        />
      )}

      {/* Send Link Modal */}
      {sendLinkLead && (
        <SendLinkModal
          lead={sendLinkLead}
          onClose={() => setSendLinkLead(null)}
        />
      )}
    </div>
  );
}
