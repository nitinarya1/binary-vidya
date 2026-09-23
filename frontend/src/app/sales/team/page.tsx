'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCrm } from '../../../context/CrmContext';
import { CrmSidebar } from '../../../components/crm/CrmSidebar';
import { UserPlus, Trash2, Shield, User, RefreshCw, AlertCircle, CheckCircle, ShieldCheck, Sparkles } from 'lucide-react';

interface Agent {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  salesTeam?: string;
  teamStatus?: string;
  role: string;
  createdAt: string;
}

const TEAM_OPTIONS = [
  {
    id: 'BDA',
    name: 'BDA',
    fullName: 'Business Development Associate',
    description: 'Handles student admissions, counseling calls & direct course enrollments.',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
  },
  {
    id: 'Lead Generation',
    name: 'Lead Generation',
    fullName: 'Lead Generation Specialist',
    description: 'Prospecting, outbound inquiries & sourcing high-intent prospective students.',
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
  },
  {
    id: 'CSM',
    name: 'CSM (Senior Sales)',
    fullName: 'Customer Success Manager / Senior Sales',
    description: 'Senior sales person who has good experience in high-ticket closures, key learner guidance & corporate accounts.',
    badge: 'Senior Role',
    color: '#7c3aed',
    bg: '#faf5ff',
    border: '#ddd6fe',
  },
];

export default function TeamPage() {
  const { crmUser, loading } = useCrm();
  const router = useRouter();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [fetching, setFetching] = useState(true);
  const [teamFilter, setTeamFilter] = useState<'all' | 'BDA' | 'Lead Generation' | 'CSM'>('all');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', team: 'BDA' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!crmUser) router.replace('/sales/login');
      else if (crmUser.role !== 'super_admin') router.replace('/sales');
    }
  }, [loading, crmUser, router]);

  const loadAgents = async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/crm/team', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setAgents(data.agents || []);
    } catch {}
    setFetching(false);
  };

  useEffect(() => {
    if (crmUser?.role === 'super_admin') loadAgents();
  }, [crmUser]);

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setFormError('Name, email, and password are required.');
      return;
    }
    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/crm/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setFormSuccess(data.message || 'Agent added!');
        setForm({ name: '', email: '', phone: '', password: '', team: 'BDA' });
        setShowForm(false);
        await loadAgents();
        setTimeout(() => setFormSuccess(''), 4000);
      } else {
        setFormError(data.message || 'Failed to add agent.');
      }
    } catch {
      setFormError('Network error.');
    }
    setSubmitting(false);
  };

  const handleUpdateTeam = async (agentId: string, newTeam: string) => {
    try {
      const res = await fetch(`/api/crm/team/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ team: newTeam }),
      });
      const data = await res.json();
      if (data.success) {
        setAgents((prev) =>
          prev.map((a) => (a._id === agentId ? { ...a, department: newTeam, salesTeam: newTeam } : a))
        );
      }
    } catch {}
  };

  const handleRemove = async (agentId: string, agentName: string) => {
    if (!confirm(`Remove ${agentName} from the sales team?`)) return;
    try {
      const res = await fetch(`/api/crm/team/${agentId}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setAgents((prev) => prev.filter((a) => a._id !== agentId));
      }
    } catch {}
  };

  if (loading || !crmUser) {
    return (
      <div style={{ minHeight: '100vh', background: '#f1f6fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ color: '#2563eb', fontWeight: 600 }}>Loading Team...</div>
      </div>
    );
  }

  const fieldStyle = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    background: '#f8fafc',
    fontSize: '13px',
    fontWeight: 500,
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'all 0.2s ease',
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#f1f6fe',
      fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif"
    }}>
      <CrmSidebar />

      <main style={{ flex: 1, padding: '28px 32px', overflow: 'auto', minWidth: 0 }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '14px',
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              Sales Team
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              <strong style={{ color: '#0f172a' }}>{agents.length}</strong> team member{agents.length !== 1 ? 's' : ''} across BDA, Lead Gen &amp; CSM
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={loadAgents}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 14px',
                background: '#ffffff',
                border: '1px solid #bfdbfe',
                borderRadius: '10px',
                color: '#2563eb',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} style={{ animation: fetching ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
                border: 'none',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              }}
            >
              <UserPlus size={15} />
              Add Member
            </button>
          </div>
        </div>

        {formSuccess && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#047857',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '20px',
          }}>
            <CheckCircle size={16} color="#059669" />
            <span>{formSuccess}</span>
          </div>
        )}

        {/* Add Agent Form Drawer */}
        {showForm && (
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #dbeafe',
            boxShadow: '0 10px 30px -5px rgba(37, 99, 235, 0.08)',
            marginBottom: '24px',
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>
              Add Team Member (BDA / Lead Gen / CSM)
            </h3>
            <form onSubmit={handleAddAgent}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Priya Verma"
                    className="agent-input"
                    style={fieldStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="agent@binaryvidya.com"
                    className="agent-input"
                    style={fieldStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="9876543210"
                    className="agent-input"
                    style={fieldStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Password *
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Set temporary password"
                    className="agent-input"
                    style={fieldStyle}
                  />
                </div>
              </div>

              {/* Team Selection */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>
                  <span>Select Sales Team / Role *</span>
                  <span style={{ fontSize: '11px', color: form.team === 'CSM' ? '#7c3aed' : '#2563eb', textTransform: 'none', fontWeight: 700 }}>
                    {form.team === 'CSM' ? '⭐ Senior Sales Specialist Track' : `${form.team} Track`}
                  </span>
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  {TEAM_OPTIONS.map((t) => {
                    const isSelected = form.team === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setForm({ ...form, team: t.id })}
                        style={{
                          cursor: 'pointer',
                          padding: '14px',
                          borderRadius: '12px',
                          border: `2px solid ${isSelected ? t.color : '#e2e8f0'}`,
                          background: isSelected ? t.bg : '#ffffff',
                          transition: 'all 0.18s ease',
                          boxShadow: isSelected ? `0 4px 14px ${t.color}25` : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: isSelected ? t.color : '#0f172a' }}>
                              {t.id}
                            </span>
                            {t.badge && (
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '2px 7px',
                                borderRadius: '99px',
                                background: '#7c3aed',
                                color: '#ffffff',
                                letterSpacing: '0.02em',
                              }}>
                                {t.badge}
                              </span>
                            )}
                          </div>
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? t.color : '#cbd5e1'}`,
                            background: isSelected ? t.color : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            {isSelected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff' }} />}
                          </div>
                        </div>

                        <div style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? t.color : '#475569', marginBottom: '4px' }}>
                          {t.fullName}
                        </div>
                        <p style={{ fontSize: '11px', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
                          {t.description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {form.team === 'CSM' && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px 14px',
                    background: '#faf5ff',
                    border: '1px solid #ddd6fe',
                    borderRadius: '10px',
                    fontSize: '12px',
                    color: '#6b21a8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <Sparkles size={16} color="#7c3aed" style={{ flexShrink: 0 }} />
                    <span>
                      <strong>CSM (Customer Success Manager):</strong> Senior sales person who has good experience in closing high-ticket admissions and managing student success relationships.
                    </span>
                  </div>
                )}
              </div>

              {formError && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '16px',
                }}>
                  <AlertCircle size={14} color="#dc2626" />
                  <span>{formError}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: submitting ? 'wait' : 'pointer',
                  }}
                >
                  {submitting ? 'Creating...' : `Save ${form.team} Member`}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Team Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { id: 'all', label: 'All Teams', count: agents.length },
            {
              id: 'BDA',
              label: 'BDA',
              count: agents.filter(
                (a) =>
                  a.department === 'BDA' ||
                  a.salesTeam === 'BDA' ||
                  (!a.department && a.role !== 'super_admin')
              ).length,
            },
            {
              id: 'Lead Generation',
              label: 'Lead Generation',
              count: agents.filter(
                (a) => a.department === 'Lead Generation' || a.salesTeam === 'Lead Generation'
              ).length,
            },
            {
              id: 'CSM',
              label: 'CSM (Senior Sales)',
              count: agents.filter(
                (a) => a.department === 'CSM' || a.salesTeam === 'CSM'
              ).length,
            },
          ].map((pill) => {
            const active = teamFilter === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setTeamFilter(pill.id as any)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: active ? '#2563eb' : '#bfdbfe',
                  background: active ? '#2563eb' : '#ffffff',
                  color: active ? '#ffffff' : '#1e3a8a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  boxShadow: active ? '0 2px 8px rgba(37,99,235,0.25)' : 'none',
                }}
              >
                <span>{pill.label}</span>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: active ? 'rgba(255,255,255,0.25)' : '#eff6ff',
                    color: active ? '#ffffff' : '#2563eb',
                  }}
                >
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Agents Card / Table */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #dbeafe',
          boxShadow: '0 4px 20px -4px rgba(37, 99, 235, 0.06)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #f1f5f9',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8faff 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Active Agents ({agents.filter((a) => {
                if (teamFilter === 'all') return true;
                const t = a.department || a.salesTeam || (a.role === 'super_admin' ? 'super_admin' : 'BDA');
                return t === teamFilter;
              }).length})
            </h3>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Full CRM disposition &amp; link generation rights
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                  <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Member</th>
                  <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Contact</th>
                  <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Team</th>
                  <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Role</th>
                  <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Joined</th>
                  <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fetching ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                      Loading team members...
                    </td>
                  </tr>
                ) : agents.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                      No agents found. Click "Add Agent" to register one.
                    </td>
                  </tr>
                ) : (
                  agents
                    .filter((agent) => {
                      if (teamFilter === 'all') return true;
                      const t = agent.department || agent.salesTeam || (agent.role === 'super_admin' ? 'super_admin' : 'BDA');
                      return t === teamFilter;
                    })
                    .map((agent) => {
                      const currentTeam =
                        agent.department && ['BDA', 'Lead Generation', 'CSM'].includes(agent.department)
                          ? agent.department
                          : agent.salesTeam && ['BDA', 'Lead Generation', 'CSM'].includes(agent.salesTeam)
                          ? agent.salesTeam
                          : agent.role === 'super_admin'
                          ? 'Super Admin'
                          : 'BDA';

                      const isCsm = currentTeam === 'CSM';
                      const isLeadGen = currentTeam === 'Lead Generation';

                      return (
                        <tr key={agent._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '10px',
                                background: agent.role === 'super_admin' ? '#eff6ff' : isCsm ? '#faf5ff' : '#f1f5f9',
                                color: agent.role === 'super_admin' ? '#2563eb' : isCsm ? '#7c3aed' : '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                {agent.role === 'super_admin' ? <Shield size={16} /> : <User size={16} />}
                              </div>
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{agent.name}</div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>{agent.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 18px', fontSize: '12px', color: '#2563eb', fontWeight: 600 }}>
                            {agent.phone || '—'}
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            {agent.role === 'super_admin' ? (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '3px 10px',
                                borderRadius: '99px',
                                background: '#eff6ff',
                                color: '#2563eb',
                                border: '1px solid #bfdbfe',
                              }}>
                                Executive
                              </span>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <select
                                  value={currentTeam}
                                  onChange={(e) => handleUpdateTeam(agent._id, e.target.value)}
                                  title="Change team assignment"
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    outline: 'none',
                                    border: '1px solid',
                                    borderColor: isCsm ? '#ddd6fe' : isLeadGen ? '#a7f3d0' : '#bfdbfe',
                                    background: isCsm ? '#faf5ff' : isLeadGen ? '#ecfdf5' : '#eff6ff',
                                    color: isCsm ? '#7c3aed' : isLeadGen ? '#047857' : '#1d4ed8',
                                  }}
                                >
                                  <option value="BDA">BDA</option>
                                  <option value="Lead Generation">Lead Generation</option>
                                  <option value="CSM">CSM (Senior)</option>
                                </select>
                                {isCsm && (
                                  <span style={{
                                    fontSize: '9.5px',
                                    fontWeight: 800,
                                    padding: '2px 6px',
                                    borderRadius: '6px',
                                    background: '#7c3aed',
                                    color: '#ffffff',
                                    letterSpacing: '0.02em',
                                  }}>
                                    Senior
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '3px 10px',
                              borderRadius: '99px',
                              background: agent.role === 'super_admin'
                                ? '#eff6ff'
                                : isCsm
                                ? '#faf5ff'
                                : isLeadGen
                                ? '#ecfdf5'
                                : '#eff6ff',
                              color: agent.role === 'super_admin'
                                ? '#2563eb'
                                : isCsm
                                ? '#7c3aed'
                                : isLeadGen
                                ? '#047857'
                                : '#1d4ed8',
                              border: `1px solid ${
                                agent.role === 'super_admin'
                                  ? '#bfdbfe'
                                  : isCsm
                                  ? '#ddd6fe'
                                  : isLeadGen
                                  ? '#a7f3d0'
                                  : '#bfdbfe'
                              }`,
                            }}>
                              {agent.role === 'super_admin' ? 'Super Admin' : (currentTeam || 'BDA')}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px', fontSize: '12px', color: '#64748b' }}>
                            {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                            {agent.role !== 'super_admin' && (
                              <button
                                onClick={() => handleRemove(agent._id, agent.name)}
                                title="Remove agent"
                                style={{
                                  background: '#fef2f2',
                                  border: '1px solid #fee2e2',
                                  color: '#dc2626',
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <style>{`
        .agent-input:focus {
          border-color: #2563eb !important;
          background: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15) !important;
        }
      `}</style>
    </div>
  );
}
