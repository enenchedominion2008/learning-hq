import {Award, Check, Flame} from 'lucide-react';
import {useMemo, useState} from 'react';
import {STREAK_BADGES, type StreakBadge} from '../data/badges';
import type {PublicUser} from '../types/learning';

interface StreakBadgeShowcaseProps {
  token: string;
  user: PublicUser;
  onUserUpdated: (user: PublicUser) => void;
  showHubCard?: boolean;
}

function BadgeCrest({badge, unlocked}: {badge: StreakBadge; unlocked: boolean}) {
  const palette = !unlocked
    ? 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-600'
    : badge.tier === 'master'
      ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
      : badge.tier === 'monthly'
        ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
        : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300';

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${palette}`}
    >
      <Award className="h-5 w-5" />
    </div>
  );
}

export function StreakBadgeShowcase({
  token,
  user,
  onUserUpdated,
  showHubCard = true,
}: StreakBadgeShowcaseProps) {
  const [claiming, setClaiming] = useState(false);

  const earnedSet = useMemo(
    () => new Set(user.earnedBadgeIds ?? []),
    [user.earnedBadgeIds]
  );

  const unseenBadges = useMemo(() => {
    const unseen = new Set(user.unseenBadgeIds ?? []);
    return STREAK_BADGES.filter((b) => unseen.has(b.id));
  }, [user.unseenBadgeIds]);

  const handleAcknowledgeBadges = async () => {
    if (claiming) return;
    setClaiming(true);
    try {
      const res = await fetch('/api/badges/acknowledge', {
        method: 'POST',
        headers: {Authorization: `Bearer ${token}`},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          onUserUpdated(data.user);
        }
      }
    } finally {
      setClaiming(false);
    }
  };

  return (
    <>
      {/* Award Badge Celebration Modal — Pops up immediately when a streak milestone is reached */}
      {unseenBadges.length > 0 && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="streak-award-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
        >
          <div className="studio-surface w-full max-w-md rounded-2xl border p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300">
              <Award className="h-7 w-7" />
            </div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
              Streak Award Unlocked · {user.streakDays} Days
            </p>
            <h2
              id="streak-award-title"
              className="mt-2 font-display text-2xl font-bold text-slate-900 dark:text-white"
            >
              {unseenBadges[unseenBadges.length - 1].title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {unseenBadges[unseenBadges.length - 1].description}
            </p>

            {unseenBadges.length > 1 && (
              <p className="mt-3 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                +{unseenBadges.length - 1} additional milestone badge
                {unseenBadges.length - 1 > 1 ? 's' : ''} unlocked!
              </p>
            )}

            <button
              type="button"
              disabled={claiming}
              onClick={handleAcknowledgeBadges}
              className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer"
            >
              {claiming ? 'Saving Award...' : 'Claim Award Badge'}
            </button>
          </div>
        </div>
      )}

      {/* Streak & Award Badges Section */}
      {showHubCard && (
        <section className="studio-surface mb-8 rounded-2xl border p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/70">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Learning Streak &amp; Award Badges
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Earn award badges automatically at 2 days, 1 week, 2 weeks, 3 weeks, 1 month, and
                  2 months.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-5 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Current Streak: </span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                  {user.streakDays} {user.streakDays === 1 ? 'day' : 'days'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Best: </span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                  {user.longestStreakDays} {user.longestStreakDays === 1 ? 'day' : 'days'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {STREAK_BADGES.map((badge) => {
              const unlocked = earnedSet.has(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`flex items-start gap-3.5 rounded-xl border p-4 transition-colors ${
                    unlocked
                      ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/30'
                      : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60'
                  }`}
                >
                  <BadgeCrest badge={badge} unlocked={unlocked} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                        {badge.shortLabel}
                      </span>
                      {unlocked ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                          <Check className="h-3.5 w-3.5" />
                          Earned
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">Locked</span>
                      )}
                    </div>
                    <p className="mt-1 font-display text-sm font-bold text-slate-900 dark:text-white">
                      {badge.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {badge.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
