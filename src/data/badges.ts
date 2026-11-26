export interface StreakBadge {
  id: string;
  requiredDays: number;
  title: string;
  shortLabel: string;
  description: string;
  tier: 'starter' | 'weekly' | 'biweekly' | 'monthly' | 'master';
}

export const STREAK_BADGES: StreakBadge[] = [
  {
    id: 'streak_2d',
    requiredDays: 2,
    title: '2-Day Streak Award',
    shortLabel: '2 Days',
    description: 'Showed up two consecutive days to build your coding habit.',
    tier: 'starter',
  },
  {
    id: 'streak_7d',
    requiredDays: 7,
    title: '1-Week Streak Award',
    shortLabel: '1 Week',
    description: 'Completed a full 7-day streak of daily programming practice.',
    tier: 'weekly',
  },
  {
    id: 'streak_14d',
    requiredDays: 14,
    title: '2-Week Streak Award',
    shortLabel: '2 Weeks',
    description: 'Two consecutive weeks of steady lessons, drills, and coding.',
    tier: 'biweekly',
  },
  {
    id: 'streak_21d',
    requiredDays: 21,
    title: '3-Week Streak Award',
    shortLabel: '3 Weeks',
    description: 'Three full weeks of daily consistency across Learning HQ.',
    tier: 'biweekly',
  },
  {
    id: 'streak_30d',
    requiredDays: 30,
    title: '1-Month Streak Award',
    shortLabel: '1 Month',
    description: 'Thirty consecutive days of software craftsmanship.',
    tier: 'monthly',
  },
  {
    id: 'streak_60d',
    requiredDays: 60,
    title: '2-Month Streak Award',
    shortLabel: '2 Months',
    description: 'Sixty consecutive days of disciplined mastery.',
    tier: 'master',
  },
];
