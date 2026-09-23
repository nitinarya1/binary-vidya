'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCrm } from '../../../context/CrmContext';
import { CrmSidebar } from '../../../components/crm/CrmSidebar';
import { LeaderboardStats } from '../../../components/crm/LeaderboardStats';
import { Trophy, RefreshCw, Calendar, TrendingUp } from 'lucide-react';

export default function LeaderboardPage() {
  const { crmUser, loading } = useCrm();
  const router = useRouter();

  const [rankings, setRankings] = useState<any[]>([]);
  const [topCounselor, setTopCounselor] = useState<any | null>(null);
  const [totalCallsToday, setTotalCallsToday] = useState(0);
  const [teamBreakdown, setTeamBreakdown] = useState<any>({
    BDA: { totalCalls: 0, conversions: 0, members: 0 },
    CSM: { totalCalls: 0, conversions: 0, members: 0 },
    'Lead Generation': { totalCalls: 0, conversions: 0, members: 0 },
  });
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !crmUser) {
      router.replace('/sales/login');
    }
  }, [loading, crmUser, router]);

  const loadLeaderboard = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/crm/stats/leaderboard', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setRankings(data.rankings || []);
        setTopCounselor(data.topCounselor || null);
        setTotalCallsToday(data.totalCallsToday || 0);
        if (data.teamBreakdown) setTeamBreakdown(data.teamBreakdown);
      }
    } catch (err) {
      console.error('Failed to load leaderboard stats:', err);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (crmUser) {
      loadLeaderboard();
      const interval = setInterval(loadLeaderboard, 8000);
      return () => clearInterval(interval);
    }
  }, [crmUser, loadLeaderboard]);

  if (loading || !crmUser) {
    return (
      <div style={{ minHeight: '100vh', background: '#f1f6fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#2563eb', fontWeight: 600 }}>Loading Leaderboard...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f6fe', fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif" }}>
      <CrmSidebar />

      <main style={{ flex: 1, padding: '28px 32px', overflow: 'auto', minWidth: 0 }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={24} color="#2563eb" />
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Sales &amp; Calling Leaderboard
              </h1>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
              Real-time daily outreach metrics and conversion rankings across BDA, CSM, and Lead Generation teams
            </p>
          </div>

          <button
            onClick={loadLeaderboard}
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

        {fetching && rankings.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block', color: '#2563eb' }} />
            Calculating rankings...
          </div>
        ) : (
          <LeaderboardStats
            rankings={rankings}
            topCounselor={topCounselor}
            totalCallsToday={totalCallsToday}
            teamBreakdown={teamBreakdown}
          />
        )}
      </main>

      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
