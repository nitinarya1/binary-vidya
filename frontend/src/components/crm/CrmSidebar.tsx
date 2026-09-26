'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useCrm } from '../../context/CrmContext';
import {
  LayoutDashboard,
  Phone,
  UserPlus,
  Users,
  LogOut,
  ChevronRight,
  ShieldCheck,
  User,
  Globe,
  ExternalLink,
  Trophy,
  Sparkles,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  exact?: boolean;
  adminOnly?: boolean;
  target?: string;
  badge?: string;
}

const navItems: NavItem[] = [
  { href: '/sales', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/sales/leads', label: 'Leads Calling', icon: Phone },
  { href: '/sales/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/sales/generate', label: 'Generate Lead', icon: UserPlus },
  { href: '/sales/domains', label: 'Counselling Domains', icon: Sparkles },
  {
    href: '/get-counselling',
    label: 'Lead Generation (Public)',
    icon: Globe,
    target: '_blank',
    badge: 'Public',
  },
  { href: '/sales/team', label: 'Team', icon: Users, adminOnly: true },
];

export const CrmSidebar: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { crmUser, logout } = useCrm();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const handleLogout = async () => {
    await logout();
    router.push('/sales/login');
  };

  const filteredItems = navItems.filter(
    (item) => !item.adminOnly || crmUser?.role === 'super_admin'
  );

  return (
    <aside style={{
      width: '240px',
      minHeight: '100vh',
      background: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      flexShrink: 0,
      fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif",
      boxShadow: '1px 0 10px rgba(37, 99, 235, 0.03)',
    }}>
      {/* Brand Header with Both Logos */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid #f1f5f9',
      }}>
        <Link
          href="/sales"
          style={{ textDecoration: 'none', display: 'block' }}
        >
          {/* Logo Row: 3D Icon + Wordmark aligned on one line */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            {/* Logo 1: 3D Icon */}
            <div style={{
              width: '36px',
              height: '36px',
              position: 'relative',
              flexShrink: 0,
              filter: 'drop-shadow(0 2px 5px rgba(37, 99, 235, 0.2))',
            }}>
              <Image
                src="/images/binary-vidya-icon.png"
                alt="Binary Vidya Icon"
                width={36}
                height={36}
                style={{ width: '36px', height: '36px', objectFit: 'contain' }}
                priority
              />
            </div>

            {/* Logo 2: Wordmark */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
              <Image
                src="/images/binary-vidya-wordmark.png"
                alt="Binary Vidya"
                width={130}
                height={26}
                style={{ height: '22px', width: 'auto', objectFit: 'contain', display: 'block' }}
                priority
              />
            </div>
          </div>

          {/* CRM Status Tag */}
          <div style={{
            marginTop: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            padding: '4px 8px',
            borderRadius: '6px',
          }}>
            <span style={{
              fontSize: '10px',
              fontWeight: 800,
              color: '#1d4ed8',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              CRM Portal
            </span>
            <span style={{
              fontSize: '9px',
              fontWeight: 700,
              color: '#059669',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <span style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: '#10b981',
                display: 'inline-block',
              }} />
              Connected
            </span>
          </div>
        </Link>
      </div>

      {/* Agent info */}
      {crmUser && (
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
            border: '1px solid #dbeafe',
            borderRadius: '10px',
            padding: '9px 11px',
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
          }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: '#2563eb',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {crmUser.role === 'super_admin' ? <ShieldCheck size={15} /> : <User size={15} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#0f172a',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {crmUser.name}
              </div>
              <div style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: crmUser.role === 'super_admin'
                  ? '#2563eb'
                  : (crmUser.department === 'CSM' || crmUser.salesTeam === 'CSM')
                  ? '#7c3aed'
                  : (crmUser.department === 'Lead Generation' || crmUser.salesTeam === 'Lead Generation')
                  ? '#059669'
                  : '#2563eb',
              }}>
                {crmUser.role === 'super_admin' ? (
                  'Super Admin'
                ) : (
                  (crmUser.department === 'CSM' || crmUser.salesTeam === 'CSM')
                    ? 'CSM (Senior Sales)'
                    : (crmUser.department === 'Lead Generation' || crmUser.salesTeam === 'Lead Generation')
                    ? 'Lead Generation'
                    : 'BDA'
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 10px' }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 700,
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          padding: '0 8px 8px',
        }}>
          Navigation
        </div>
        {filteredItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              target={item.target}
              rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                padding: '9px 11px',
                borderRadius: '8px',
                marginBottom: '4px',
                background: active ? '#eff6ff' : 'transparent',
                color: active ? '#2563eb' : '#475569',
                borderLeft: active ? '3px solid #2563eb' : '3px solid transparent',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: active ? 700 : 500,
                transition: 'all 0.15s ease',
              }}
            >
              <item.icon size={15} color={active ? '#2563eb' : '#64748b'} />
              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.label}
              </span>
              {item.badge && (
                <span style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '6px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  border: '1px solid #bfdbfe',
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                }}>
                  {item.badge}
                </span>
              )}
              {item.target === '_blank' ? (
                <ExternalLink size={12} color="#94a3b8" />
              ) : (
                active && <ChevronRight size={13} color="#2563eb" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid #f1f5f9' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '9px 12px',
            borderRadius: '8px',
            background: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fee2e2',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 700,
            transition: 'all 0.15s ease',
          }}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
