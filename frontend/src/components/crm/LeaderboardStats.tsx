'use client';

import React from 'react';
import { Trophy, Award, PhoneCall, TrendingUp, Users, Star, User } from 'lucide-react';

interface RankingItem {
  agentId: string;
  name: string;
  email: string;
  team: string;
  avatar?: string;
  callsToday: number;
  conversions: number;
}

interface LeaderboardStatsProps {
  rankings: RankingItem[];
  topCounselor: RankingItem | null;
  totalCallsToday: number;
  teamBreakdown: Record<string, { totalCalls: number; conversions: number; members: number }>;
}

export const LeaderboardStats: React.FC<LeaderboardStatsProps> = ({
  rankings,
  topCounselor,
  totalCallsToday,
  teamBreakdown,
}) => {
  const maxCalls = Math.max(...rankings.map((r) => r.callsToday), 1);

  return (
    <div>
      {/* Top Banner Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Top Counselor Card */}
        {topCounselor ? (
          <div
            style={{
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
              borderRadius: '16px',
              padding: '22px',
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Trophy size={18} color="#facc15" />
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#93c5fd' }}>
                Today&apos;s Top Counselor
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  border: '2px solid #facc15',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 800,
                }}
              >
                {topCounselor.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{topCounselor.name}</div>
                <div style={{ fontSize: '12px', color: '#bfdbfe', marginTop: '2px' }}>
                  {topCounselor.team} · {topCounselor.email}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#facc15' }}>{topCounselor.callsToday}</div>
                <div style={{ fontSize: '11px', color: '#93c5fd' }}>Calls Made Today</div>
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#4ade80' }}>{topCounselor.conversions}</div>
                <div style={{ fontSize: '11px', color: '#93c5fd' }}>Enrolled Conversions</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '22px', border: '1px solid #e2e8f0' }}>
            No calls recorded today yet.
          </div>
        )}

        {/* Total Calls Metric Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '22px',
            border: '1px solid #dbeafe',
            boxShadow: '0 4px 16px -2px rgba(37, 99, 235, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
              Daily Team Momentum
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
              {totalCallsToday}
            </div>
            <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600, marginTop: '8px' }}>
              Total outbound outreach logged today
            </div>
          </div>

          {/* Team Breakdown Summary */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
            {Object.entries(teamBreakdown).map(([teamName, d]) => (
              <div key={teamName} style={{ flex: 1 }}>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  {teamName}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{d.totalCalls} calls</div>
                <div style={{ fontSize: '10px', color: '#059669', fontWeight: 600 }}>{d.conversions} enrolled</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rankings Table */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px -2px rgba(37, 99, 235, 0.05)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
            Counselor Performance Leaderboard
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Ranked by total calls logged today
          </span>
        </div>

        <div style={{ padding: '8px 0' }}>
          {rankings.map((agent, index) => {
            const pct = Math.round((agent.callsToday / maxCalls) * 100);
            const isTop3 = index < 3;

            return (
              <div
                key={agent.agentId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '50px minmax(200px, 1.5fr) 120px 100px minmax(140px, 1fr)',
                  alignItems: 'center',
                  padding: '14px 20px',
                  borderBottom: index < rankings.length - 1 ? '1px solid #f1f5f9' : 'none',
                  gap: '12px',
                }}
              >
                {/* Rank Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {index === 0 ? (
                    <span style={{ fontSize: '18px' }}>🥇</span>
                  ) : index === 1 ? (
                    <span style={{ fontSize: '18px' }}>🥈</span>
                  ) : index === 2 ? (
                    <span style={{ fontSize: '18px' }}>🥉</span>
                  ) : (
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>#{index + 1}</span>
                  )}
                </div>

                {/* Counselor info */}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{agent.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{agent.email}</div>
                </div>

                {/* Team Tag */}
                <div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: agent.team === 'CSM' ? '#faf5ff' : agent.team === 'Lead Generation' ? '#ecfdf5' : '#eff6ff',
                      color: agent.team === 'CSM' ? '#7c3aed' : agent.team === 'Lead Generation' ? '#047857' : '#1d4ed8',
                      border: `1px solid ${agent.team === 'CSM' ? '#ddd6fe' : agent.team === 'Lead Generation' ? '#a7f3d0' : '#bfdbfe'}`,
                    }}
                  >
                    {agent.team}
                  </span>
                </div>

                {/* Stats */}
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{agent.callsToday} calls</div>
                  <div style={{ fontSize: '10px', color: '#059669', fontWeight: 600 }}>{agent.conversions} enrolled</div>
                </div>

                {/* Activity Bar */}
                <div>
                  <div style={{ height: '7px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: isTop3 ? 'linear-gradient(90deg, #2563eb, #38bdf8)' : '#94a3b8',
                        borderRadius: '99px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
