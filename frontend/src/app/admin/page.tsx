'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import styles from './admin.module.css';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  GraduationCap,
  Activity,
  Search,
  ArrowLeft,
  LogOut,
  RefreshCw,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'student' | 'admin' | 'instructor';
  authProvider: string;
  avatar?: string;
  createdAt?: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, token, isLoading, isAdmin, logout } = useAuth();

  const [usersList, setUsersList] = useState<ManagedUser[]>([]);
  const [metrics, setMetrics] = useState({ totalUsers: 0, totalAdmins: 0, totalStudents: 0 });
  const [loadingData, setLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'student'>('all');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = async () => {
    if (!token) return;
    try {
      setLoadingData(true);
      const res = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setUsersList(data.users || []);
        if (data.metrics) {
          setMetrics(data.metrics);
        }
      } else {
        setNotice({ type: 'error', text: data.message || 'Failed to load user records' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Network error fetching admin data' });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!isLoading && isAdmin && token) {
      fetchUsers();
    }
  }, [isLoading, isAdmin, token]);

  const handleToggleRole = async (targetUser: ManagedUser) => {
    if (!token) return;
    const newRole = targetUser.role === 'admin' ? 'student' : 'admin';
    const actionLabel = newRole === 'admin' ? 'promote' : 'demote';

    if (
      !confirm(
        `Are you sure you want to ${actionLabel} ${targetUser.name || targetUser.email} to ${newRole.toUpperCase()}?`
      )
    ) {
      return;
    }

    try {
      setUpdatingUserId(targetUser.id);
      setNotice(null);

      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: targetUser.id,
          newRole,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', text: `Successfully updated ${targetUser.name}'s role to ${newRole}` });
        // Update list locally
        setUsersList((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
        );
        // Refresh metrics
        fetchUsers();
      } else {
        setNotice({ type: 'error', text: data.message || 'Failed to update role' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Error occurred updating user role' });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      // Role filter
      if (roleFilter === 'admin' && u.role !== 'admin') return false;
      if (roleFilter === 'student' && u.role === 'admin') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = u.name?.toLowerCase().includes(q);
        const matchesEmail = u.email?.toLowerCase().includes(q);
        const matchesPhone = u.phone?.includes(q);
        return matchesName || matchesEmail || matchesPhone;
      }

      return true;
    });
  }, [usersList, roleFilter, searchQuery]);

  // Loading Screen
  if (isLoading) {
    return (
      <div className={styles.deniedContainer}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e2e8f0',
              borderTopColor: '#2563eb',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>
            Verifying administrative credentials...
          </p>
          <style jsx>{`
            @keyframes spin {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Access Denied Screen if not Admin
  if (!isAdmin) {
    return (
      <div className={styles.deniedContainer}>
        <div className={styles.deniedCard}>
          <div className={styles.deniedIconWrapper}>
            <ShieldAlert size={32} />
          </div>
          <h1 className={styles.deniedTitle}>Access Restricted</h1>
          <p className={styles.deniedText}>
            This portal is restricted to <strong>Binary Vidya Administrators</strong>. Your current account
            does not have permission to access management operations.
          </p>
          <div className={styles.deniedActions}>
            <Link href="/login" className={styles.primaryActionBtn}>
              Sign In with Admin Account
            </Link>
            <Link href="/" className={styles.secondaryBtn} style={{ justifyContent: 'center' }}>
              <ArrowLeft size={16} /> Return to Main Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Admin Top Navigation */}
      <header className={styles.adminHeader}>
        <div className={styles.headerWrapper}>
          <div className={styles.brandGroup}>
            <div className={styles.brandLogo}>BV</div>
            <div>
              <div className={styles.brandTitle}>Binary Vidya Console</div>
              <div className={styles.adminTag}>
                <ShieldCheck size={12} /> Administrator Portal
              </div>
            </div>
          </div>

          <div className={styles.headerActions}>
            <Link href="/" className={styles.secondaryBtn}>
              <ArrowLeft size={14} /> Back to Website
            </Link>

            <div className={styles.adminProfilePill}>
              <div className={styles.adminAvatar}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div>
                <div className={styles.adminName}>{user?.name}</div>
              </div>
            </div>

            <button
              onClick={logout}
              className={styles.logoutBtn}
              title="Sign Out"
              id="admin-logout-btn"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* Intro */}
        <div className={styles.pageIntro}>
          <h1 className={styles.pageHeading}>Role-Based Access & User Management</h1>
          <p className={styles.pageSubheading}>
            Manage authenticated users, oversee platform roles, and grant administrator permissions.
          </p>
        </div>

        {/* Notice alert */}
        {notice && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: '8px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
              background: notice.type === 'success' ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${notice.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              color: notice.type === 'success' ? '#065f46' : '#991b1b',
            }}
          >
            {notice.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{notice.text}</span>
          </div>
        )}

        {/* Metrics Overview */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div>
              <div className={styles.metricLabel}>Total Registered Accounts</div>
              <div className={styles.metricValue}>{metrics.totalUsers}</div>
              <div className={styles.metricMeta}>
                <Sparkles size={12} /> Verified MongoDB Records
              </div>
            </div>
            <div className={`${styles.metricIconWrapper} ${styles.iconBlue}`}>
              <Users size={22} />
            </div>
          </div>

          <div className={styles.metricCard}>
            <div>
              <div className={styles.metricLabel}>Enrolled Students</div>
              <div className={styles.metricValue}>{metrics.totalStudents}</div>
              <div className={styles.metricMeta}>
                <GraduationCap size={12} /> Active Learners
              </div>
            </div>
            <div className={`${styles.metricIconWrapper} ${styles.iconEmerald}`}>
              <GraduationCap size={22} />
            </div>
          </div>

          <div className={styles.metricCard}>
            <div>
              <div className={styles.metricLabel}>Platform Administrators</div>
              <div className={styles.metricValue}>{metrics.totalAdmins}</div>
              <div className={styles.metricMeta}>
                <ShieldCheck size={12} /> Elevated Privileges
              </div>
            </div>
            <div className={`${styles.metricIconWrapper} ${styles.iconIndigo}`}>
              <ShieldCheck size={22} />
            </div>
          </div>

          <div className={styles.metricCard}>
            <div>
              <div className={styles.metricLabel}>Security Engine</div>
              <div className={styles.metricValue} style={{ fontSize: '20px', marginTop: '4px' }}>
                Online & Secure
              </div>
              <div className={styles.metricMeta}>
                <Activity size={12} /> Bcrypt + JWT + Google OAuth
              </div>
            </div>
            <div className={`${styles.metricIconWrapper} ${styles.iconPurple}`}>
              <Activity size={22} />
            </div>
          </div>
        </div>

        {/* User Management Panel */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitleGroup}>
              <h2 className={styles.panelTitle}>Registered Accounts</h2>
              <span className={styles.countPill}>{filteredUsers.length} Users</span>
            </div>

            <div className={styles.controlsBar}>
              {/* Role filter tabs */}
              <div className={styles.filterTabs}>
                <button
                  type="button"
                  className={`${styles.filterTab} ${roleFilter === 'all' ? styles.filterTabActive : ''}`}
                  onClick={() => setRoleFilter('all')}
                >
                  All ({metrics.totalUsers})
                </button>
                <button
                  type="button"
                  className={`${styles.filterTab} ${roleFilter === 'student' ? styles.filterTabActive : ''}`}
                  onClick={() => setRoleFilter('student')}
                >
                  Students ({metrics.totalStudents})
                </button>
                <button
                  type="button"
                  className={`${styles.filterTab} ${roleFilter === 'admin' ? styles.filterTabActive : ''}`}
                  onClick={() => setRoleFilter('admin')}
                >
                  Admins ({metrics.totalAdmins})
                </button>
              </div>

              {/* Search input */}
              <div className={styles.searchWrapper}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search by name, email, or mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              {/* Refresh button */}
              <button
                type="button"
                onClick={fetchUsers}
                className={styles.secondaryBtn}
                disabled={loadingData}
                title="Refresh user list"
              >
                <RefreshCw size={14} className={loadingData ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
          </div>

          {/* Table */}
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Contact Info</th>
                  <th>Auth Method</th>
                  <th>Current Role</th>
                  <th>Role Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                      {loadingData ? 'Loading records...' : 'No matching user accounts found.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isCurrentUser = user?.id === u.id || user?.email?.toLowerCase() === u.email?.toLowerCase();
                    const isPrimaryAdmin = u.email?.toLowerCase() === 'aryar0779@gmail.com';

                    return (
                      <tr key={u.id}>
                        <td>
                          <div className={styles.userInfoCell}>
                            <div className={styles.userTableAvatar}>
                              {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className={styles.userNameText}>
                                {u.name} {isCurrentUser && <span style={{ color: '#2563eb', fontSize: '11px' }}>(You)</span>}
                              </div>
                              <div className={styles.userEmailText}>{u.email || 'No email provided'}</div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div style={{ fontSize: '13px', color: '#334155' }}>
                            {u.phone ? u.phone : <span style={{ color: '#94a3b8' }}>—</span>}
                          </div>
                        </td>

                        <td>
                          <span className={styles.authProviderPill}>
                            {u.authProvider === 'google' ? 'Google OAuth' : 'Email / Mobile'}
                          </span>
                        </td>

                        <td>
                          {u.role === 'admin' ? (
                            <span className={styles.roleBadgeAdmin}>
                              <ShieldCheck size={13} /> Administrator
                            </span>
                          ) : (
                            <span className={styles.roleBadgeStudent}>
                              <UserCheck size={13} /> Student
                            </span>
                          )}
                        </td>

                        <td>
                          {u.role === 'admin' ? (
                            <button
                              type="button"
                              onClick={() => handleToggleRole(u)}
                              disabled={updatingUserId === u.id || isPrimaryAdmin}
                              className={`${styles.roleActionBtn} ${styles.roleActionDemote} ${
                                isPrimaryAdmin ? styles.roleActionDisabled : ''
                              }`}
                              title={
                                isPrimaryAdmin
                                  ? 'Primary admin account cannot be demoted'
                                  : 'Demote to Student'
                              }
                            >
                              {updatingUserId === u.id ? 'Updating...' : 'Demote to Student'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleRole(u)}
                              disabled={updatingUserId === u.id}
                              className={`${styles.roleActionBtn} ${styles.roleActionPromote}`}
                            >
                              {updatingUserId === u.id ? 'Updating...' : 'Promote to Admin'}
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
    </div>
  );
}
