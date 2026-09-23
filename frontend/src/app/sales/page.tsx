'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCrm } from '../../context/CrmContext';
import { CrmSidebar } from '../../components/crm/CrmSidebar';
import { DispositionModal } from '../../components/crm/DispositionModal';
import {
  TrendingUp,
  Phone,
  UserCheck,
  Users,
  RefreshCw,
  Clock,
  ArrowRight,
  Globe,
  User,
  Radio,
  Sparkles,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

type StatusBreakdown = Record<string, number>;

interface DashboardStats {
  totalLeads: number;
  todayLeads: number;
  todayContacted?: number;
  converted: number;
  interested?: number;
  followUp?: number;
  conversionRate: string;
  statusBreakdown: StatusBreakdown;
  recentActivity: {
    _id: string;
    name: string;
    phone: string;
    course?: string;
    source?: string;
    status: string;
    updatedAt: string;
    statusUpdatedByName?: string;
    assignedAgentName?: string;
    lastContactedAt?: string;
  }[];
  myAssignedCount?: number;
  scope?: string;
  serverTime?: string;
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

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const now = Date.now();
    const d = new Date(dateStr).getTime();
    const diffSec = Math.floor((now - d) / 1000);
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '—';
  }
}

function StatCard({ icon, label, value, sub, color, badge }: any) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '22px 20px',
        border: '1px solid #dbeafe',
        boxShadow: '0 4px 16px -2px rgba(37, 99, 235, 0.05)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: color,
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '8px',
            }}
          >
            <span>{label}</span>
            {badge && (
              <span
                style={{
                  background: `${color}15`,
                  color,
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '99px',
                  textTransform: 'uppercase',
                }}
              >
                {badge}
              </span>
            )}
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
            {value}
          </div>
          {sub && <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600, marginTop: '8px' }}>{sub}</div>}
        </div>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: `${color}12`,
            border: `1px solid ${color}25`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {React.cloneElement(icon, { size: 20, color })}
        </div>
      </div>
    </div>
  );
}

export default function SalesDashboardPage() {
  const { crmUser, loading } = useCrm();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [fetching, setFetching] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [scope, setScope] = useState<'all' | 'my'>('all');

  // Lead for disposition modal if opened directly from dashboard
  const [dispositionLead, setDispositionLead] = useState<any | null>(null);

  useEffect(() => {
    if (!loading && !crmUser) {
      router.replace('/sales/login');
    }
  }, [loading, crmUser, router]);

  const loadStats = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setFetching(true);
      setIsSyncing(true);
      try {
        const res = await fetch(`/api/crm/dashboard?scope=${scope}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          setLastSyncedAt(new Date());
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        if (!isBackground) setFetching(false);
        setTimeout(() => setIsSyncing(false), 500);
      }
    },
    [scope]
  );

  // Initial load
  useEffect(() => {
    if (crmUser) {
      loadStats(false);
    }
  }, [crmUser, loadStats]);

  // Real-time automatic polling every 4 seconds + tab focus/visibility listener
  useEffect(() => {
    if (!crmUser) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadStats(true);
      }
    };

    const handleFocus = () => {
      loadStats(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    const intervalId = setInterval(() => {
      loadStats(true);
    }, 4000);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [crmUser, loadStats]);

  const handleSaveDisposition = async (leadId: string, status: any, note: string) => {
    const res = await fetch(`/api/crm/leads/${leadId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status, note }),
    });
    const data = await res.json();
    if (data.success) {
      loadStats(true);
    }
  };

  if (loading || !crmUser) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#f1f6fe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <div style={{ color: '#2563eb', fontWeight: 600 }}>Connecting to Live CRM...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#f1f6fe',
        fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif",
      }}
    >
      <CrmSidebar />

      <main style={{ flex: 1, padding: '28px 32px', overflow: 'auto', minWidth: 0 }}>
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Sales Dashboard
              </h1>

              {/* Real-time Live Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: '#065f46',
                  fontSize: '11px',
                  fontWeight: 700,
                  boxShadow: '0 1px 3px rgba(16, 185, 129, 0.1)',
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#10b981',
                    display: 'inline-block',
                    boxShadow: '0 0 0 2px #34d399',
                    animation: isSyncing ? 'pulse-live 1s infinite' : 'pulse-slow 2s infinite',
                  }}
                />
                Live Real-Time Sync
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>
                Welcome, <strong style={{ color: '#0f172a' }}>{crmUser.name}</strong>
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background:
                    crmUser.role === 'super_admin'
                      ? '#eff6ff'
                      : crmUser.department === 'CSM' || crmUser.salesTeam === 'CSM'
                      ? '#faf5ff'
                      : crmUser.department === 'Lead Generation' || crmUser.salesTeam === 'Lead Generation'
                      ? '#ecfdf5'
                      : '#eff6ff',
                  color:
                    crmUser.role === 'super_admin'
                      ? '#2563eb'
                      : crmUser.department === 'CSM' || crmUser.salesTeam === 'CSM'
                      ? '#7c3aed'
                      : crmUser.department === 'Lead Generation' || crmUser.salesTeam === 'Lead Generation'
                      ? '#047857'
                      : '#1d4ed8',
                  border: `1px solid ${
                    crmUser.role === 'super_admin'
                      ? '#bfdbfe'
                      : crmUser.department === 'CSM' || crmUser.salesTeam === 'CSM'
                      ? '#ddd6fe'
                      : crmUser.department === 'Lead Generation' || crmUser.salesTeam === 'Lead Generation'
                      ? '#a7f3d0'
                      : '#bfdbfe'
                  }`,
                }}
              >
                {crmUser.role === 'super_admin'
                  ? 'Super Admin'
                  : crmUser.department === 'CSM' || crmUser.salesTeam === 'CSM'
                  ? '⭐ CSM (Senior Sales)'
                  : crmUser.department === 'Lead Generation' || crmUser.salesTeam === 'Lead Generation'
                  ? 'Lead Generation'
                  : 'BDA'}
              </span>
              <span>· Real-time organization pipeline visible to everyone</span>
              {lastSyncedAt && (
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  (synced {lastSyncedAt.toLocaleTimeString()})
                </span>
              )}
            </p>
          </div>

          {/* Controls: Scope Switcher + Refresh + Calling Queue */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Scope selector */}
            <div
              style={{
                display: 'flex',
                background: '#ffffff',
                border: '1px solid #bfdbfe',
                borderRadius: '10px',
                padding: '3px',
                gap: '2px',
                boxShadow: '0 1px 3px rgba(37, 99, 235, 0.05)',
              }}
            >
              <button
                onClick={() => setScope('all')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  background: scope === 'all' ? '#2563eb' : 'transparent',
                  color: scope === 'all' ? '#ffffff' : '#64748b',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Globe size={13} />
                All Organization
              </button>
              <button
                onClick={() => setScope('my')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  background: scope === 'my' ? '#2563eb' : 'transparent',
                  color: scope === 'my' ? '#ffffff' : '#64748b',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <User size={13} />
                My Assigned ({stats?.myAssignedCount ?? 0})
              </button>
            </div>

            <button
              onClick={() => loadStats(false)}
              disabled={fetching}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 15px',
                background: '#ffffff',
                border: '1px solid #bfdbfe',
                borderRadius: '10px',
                color: '#2563eb',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.06)',
                transition: 'all 0.15s ease',
              }}
            >
              <RefreshCw size={14} style={{ animation: isSyncing || fetching ? 'spin 1s linear infinite' : 'none' }} />
              Sync Now
            </button>

            <Link
              href="/sales/leads"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 18px',
                background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
                color: '#ffffff',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
              }}
            >
              Calling Queue
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* 4 Real-time Stat Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '26px',
          }}
        >
          <StatCard
            icon={<Users />}
            label={scope === 'all' ? 'Total Organization Leads' : 'My Assigned Leads'}
            value={stats?.totalLeads ?? '—'}
            color="#2563eb"
            sub="All active prospects recorded"
          />
          <StatCard
            icon={<Clock />}
            label="Today's Fresh Leads"
            value={stats?.todayLeads ?? '—'}
            color="#0284c7"
            badge="LIVE"
            sub="New inquiries arrived today"
          />
          <StatCard
            icon={<Sparkles />}
            label="Active Interested Pipeline"
            value={stats ? (stats.interested || 0) + (stats.followUp || 0) : '—'}
            color="#d97706"
            sub={`${stats?.interested || 0} Interested · ${stats?.followUp || 0} Follow Ups`}
          />
          <StatCard
            icon={<UserCheck />}
            label="Converted Enrollments"
            value={stats?.converted ?? '—'}
            color="#059669"
            badge={`${stats?.conversionRate ?? 0}% Rate`}
            sub="Successfully enrolled students"
          />
        </div>

        {/* 2-Column Split: Call Breakdown & Live Recent Activity */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '20px',
          }}
        >
          {/* Status Breakdown */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #dbeafe',
              boxShadow: '0 4px 16px -2px rgba(37, 99, 235, 0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Phone size={16} color="#2563eb" />
                </div>
                <div>
                  <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Live Pipeline Breakdown
                  </h2>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0' }}>
                    Real-time status distribution for all prospects
                  </p>
                </div>
              </div>
              <Link
                href="/sales/leads"
                style={{
                  fontSize: '12px',
                  color: '#2563eb',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                View Leads
                <ChevronRight size={13} />
              </Link>
            </div>

            {stats &&
              Object.keys(STATUS_LABELS).map((key) => {
                const count = stats.statusBreakdown[key] || 0;
                const total = stats.totalLeads || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <Link
                    key={key}
                    href={`/sales/leads?status=${key}`}
                    style={{
                      display: 'block',
                      marginBottom: '14px',
                      textDecoration: 'none',
                      color: 'inherit',
                      padding: '4px 6px',
                      borderRadius: '8px',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#334155', fontWeight: 600 }}>{STATUS_LABELS[key]}</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: STATUS_COLORS[key] }}>
                        {count} <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '11px' }}>({pct}%)</span>
                      </span>
                    </div>
                    <div style={{ height: '7px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: STATUS_COLORS[key],
                          borderRadius: '99px',
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                  </Link>
                );
              })}
            {!stats && (
              <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                {fetching ? 'Syncing real-time stats...' : 'No lead data found.'}
              </div>
            )}
          </div>

          {/* Live Recent Activity */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #dbeafe',
              boxShadow: '0 4px 16px -2px rgba(37, 99, 235, 0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TrendingUp size={16} color="#2563eb" />
                </div>
                <div>
                  <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Live Activity Stream
                  </h2>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0' }}>
                    Real-time calls & updates from all team counselors
                  </p>
                </div>
              </div>

              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#10b981',
                    animation: 'pulse-live 1.5s infinite',
                  }}
                />
                Live Feed
              </div>
            </div>

            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {stats.recentActivity.map((lead) => {
                  const updater = lead.statusUpdatedByName || lead.assignedAgentName;
                  return (
                    <div
                      key={lead._id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: '#f8fafc',
                        border: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* Student info */}
                      <div style={{ minWidth: 0, flex: 1, paddingRight: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{lead.name}</span>
                          {lead.source && (
                            <span
                              style={{
                                fontSize: '10px',
                                color: '#64748b',
                                background: '#f1f5f9',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                textTransform: 'capitalize',
                              }}
                            >
                              {lead.source.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                          <a
                            href={`tel:${lead.phone}`}
                            style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
                          >
                            {lead.phone}
                          </a>
                          {lead.course && (
                            <span
                              style={{
                                fontSize: '11px',
                                color: '#64748b',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '160px',
                              }}
                            >
                              · {lead.course}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status & Updater */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '99px',
                              background: `${STATUS_COLORS[lead.status] || '#64748b'}18`,
                              color: STATUS_COLORS[lead.status] || '#64748b',
                              border: `1px solid ${STATUS_COLORS[lead.status] || '#64748b'}30`,
                              display: 'inline-block',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {STATUS_LABELS[lead.status] || lead.status}
                          </span>
                          <button
                            title="Log call disposition"
                            onClick={() => setDispositionLead(lead)}
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '6px',
                              border: '1px solid #bfdbfe',
                              background: '#eff6ff',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                            }}
                          >
                            <Phone size={12} color="#2563eb" />
                          </button>
                        </div>
                        <div
                          style={{
                            fontSize: '10px',
                            color: '#64748b',
                            marginTop: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '4px',
                          }}
                        >
                          {updater && (
                            <span>
                              by <strong style={{ color: '#0f172a' }}>{updater}</strong>
                            </span>
                          )}
                          <span>· {formatRelativeTime(lead.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>
                {fetching ? 'Connecting to live updates...' : 'No activity logged yet.'}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Disposition Modal for quick call action directly from dashboard */}
      {dispositionLead && (
        <DispositionModal
          lead={dispositionLead}
          onClose={() => setDispositionLead(null)}
          onSave={handleSaveDisposition}
        />
      )}

      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse-live {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.3);
          }
        }
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}
