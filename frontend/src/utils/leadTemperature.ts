export type LeadTemperature = 'hot' | 'warm' | 'cold';

export interface TemperatureInfo {
  temperature: LeadTemperature;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

export function getLeadTemperature(
  createdAt: string | Date,
  updatedAt?: string | Date
): TemperatureInfo {
  try {
    const createdTime = new Date(createdAt).getTime();
    if (isNaN(createdTime)) {
      return {
        temperature: 'cold',
        label: 'Cold',
        icon: '❄️',
        color: '#64748b',
        bgColor: '#f1f5f9',
        borderColor: '#cbd5e1',
        description: 'Older prospect (>24h)',
      };
    }

    const now = Date.now();
    const diffHours = (now - createdTime) / (1000 * 60 * 60);

    if (diffHours < 2) {
      return {
        temperature: 'hot',
        label: 'Hot Lead',
        icon: '🔥',
        color: '#dc2626',
        bgColor: '#fef2f2',
        borderColor: '#fca5a5',
        description: 'New inquiry within the last 2 hours. High conversion chance!',
      };
    } else if (diffHours <= 24) {
      return {
        temperature: 'warm',
        label: 'Warm Lead',
        icon: '⚡',
        color: '#d97706',
        bgColor: '#fffbeb',
        borderColor: '#fcd34d',
        description: 'Recent inquiry (2 - 24 hours ago).',
      };
    } else {
      return {
        temperature: 'cold',
        label: 'Cold Lead',
        icon: '❄️',
        color: '#475569',
        bgColor: '#f8fafc',
        borderColor: '#e2e8f0',
        description: 'Older prospect (>24 hours). Needs follow-up re-engagement.',
      };
    }
  } catch {
    return {
      temperature: 'cold',
      label: 'Cold',
      icon: '❄️',
      color: '#64748b',
      bgColor: '#f1f5f9',
      borderColor: '#cbd5e1',
      description: 'Older prospect',
    };
  }
}
