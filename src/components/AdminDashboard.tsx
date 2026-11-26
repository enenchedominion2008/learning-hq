import {
  BookOpen,
  Check,
  CreditCard,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Users,
  X,
} from 'lucide-react';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {PROGRAMMING_LANGUAGES} from '../data/languages';
import type {AdminOverviewData, MembershipTier} from '../types/learning';
import {ThemeToggle} from './ThemeToggle';

interface AdminDashboardProps {
  token: string;
  isDark: boolean;
  onToggleDark: () => void;
  onOpenStudentWorkspace: () => void;
  onCurriculumUpdated: () => void;
  onLogout: () => void;
}

type AdminTab = 'requests' | 'students' | 'curriculum';

export function AdminDashboard({
  token,
  isDark,
  onToggleDark,
  onOpenStudentWorkspace,
  onCurriculumUpdated,
  onLogout,
}: AdminDashboardProps) {
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('requests');
  const [requestFilter, setRequestFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>(
    'all'
  );
  const [studentQuery, setStudentQuery] = useState('');
  const [selectedLangId, setSelectedLangId] = useState('python');

  // Custom lesson creation form
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonSummary, setNewLessonSummary] = useState('');
  const [newLessonCode, setNewLessonCode] = useState('');
  const [newLessonOutput, setNewLessonOutput] = useState('');
  const [newLessonIsFree, setNewLessonIsFree] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const fetchOverview = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/overview', {
        headers: {Authorization: `Bearer ${token}`},
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to load admin overview.');
        return;
      }
      setData(json);
    } catch {
      setError('Network error loading admin console.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOverview(false);
    const timer = window.setInterval(() => {
      fetchOverview(true);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [fetchOverview]);

  const handleReviewPayment = async (
    requestId: string,
    decision: 'approved' | 'rejected'
  ) => {
    setStatusNotice(null);
    const res = await fetch(`/api/admin/memberships/${requestId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({decision}),
    });
    if (res.ok) {
      const json = await res.json();
      const mailNote = json?.emailStatus?.deliveryNote
        ? ` ${json.emailStatus.deliveryNote}`
        : '';
      setStatusNotice(
        decision === 'approved'
          ? `Membership transfer approved and student access unlocked.${mailNote}`
          : 'Membership request marked as rejected.'
      );
      await fetchOverview(true);
    }
  };

  const handleSetMembershipTier = async (
    userId: string,
    membershipStatus: MembershipTier
  ) => {
    setStatusNotice(null);
    const res = await fetch(`/api/admin/users/${userId}/membership`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({membershipStatus}),
    });
    if (res.ok) {
      setStatusNotice(`Updated student membership tier to ${membershipStatus}.`);
      await fetchOverview(true);
    }
  };

  const handleToggleLessonLock = async (lessonId: string, nextIsFree: boolean) => {
    setStatusNotice(null);
    const res = await fetch('/api/admin/lessons/lock', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({lessonId, isFree: nextIsFree}),
    });
    if (res.ok) {
      setStatusNotice(
        `Updated lesson access to ${nextIsFree ? 'Open Free' : 'Member Only'}.`
      );
      await fetchOverview(true);
      onCurriculumUpdated();
    }
  };

  const handlePublishLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishing(true);
    setStatusNotice(null);
    try {
      const res = await fetch('/api/admin/lessons/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          languageId: selectedLangId,
          title: newLessonTitle,
          summary: newLessonSummary,
          codeExample: newLessonCode,
          expectedOutput: newLessonOutput,
          isFree: newLessonIsFree,
        }),
      });
      if (res.ok) {
        setNewLessonTitle('');
        setNewLessonSummary('');
        setNewLessonCode('');
        setNewLessonOutput('');
        setStatusNotice('Published custom lesson to curriculum.');
        await fetchOverview(true);
        onCurriculumUpdated();
      }
    } finally {
      setPublishing(false);
    }
  };

  const filteredRequests = useMemo(() => {
    if (!data) return [];
    if (requestFilter === 'all') return data.paymentRequests;
    return data.paymentRequests.filter((r) => r.status === requestFilter);
  }, [data, requestFilter]);

  const filteredStudents = useMemo(() => {
    if (!data) return [];
    const q = studentQuery.trim().toLowerCase();
    if (!q) return data.users;
    return data.users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.membershipStatus.toLowerCase().includes(q)
    );
  }, [data, studentQuery]);

  const onlineSet = useMemo(() => {
    return new Set(data?.onlineUserIds ?? []);
  }, [data]);

  const selectedLanguage = useMemo(() => {
    return (
      PROGRAMMING_LANGUAGES.find((l) => l.id === selectedLangId) ??
      PROGRAMMING_LANGUAGES[0]
    );
  }, [selectedLangId]);

  const languageLessons = useMemo(() => {
    if (!data) return selectedLanguage.lessons;
    const custom = data.customLessons[selectedLanguage.id] ?? [];
    return [...selectedLanguage.lessons, ...custom].map((l) => ({
      ...l,
      isFree:
        typeof data.lessonLockOverrides[l.id] === 'boolean'
          ? data.lessonLockOverrides[l.id]
          : l.isFree,
    }));
  }, [data, selectedLanguage]);

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-900 dark:bg-[#080c14] dark:text-slate-100 flex flex-col transition-colors">
      {/* Admin Top Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0b101b]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0">
              Learning HQ Admin
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <ThemeToggle isDark={isDark} onToggle={onToggleDark} />
            <button
              type="button"
              onClick={onOpenStudentWorkspace}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Preview Student Workspace
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:hover:bg-blue-500 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Live Administrator Console <span aria-hidden="true">·</span> Moniepoint 7062449465
              (Enenche Dominion)
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Real-Time Users, Logins &amp; Membership Approvals
            </h1>
          </div>

          <button
            type="button"
            onClick={() => fetchOverview(false)}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Live Data
          </button>
        </div>

        {statusNotice && (
          <div className="mt-5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-xs font-medium text-emerald-800 dark:text-emerald-300">
            {statusNotice}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 px-4 py-3 text-xs font-medium text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Live KPI Strip — strictly real accounts and active sessions */}
        {loading && !data ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
              />
            ))}
          </div>
        ) : (
          data && (
            <>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Currently Logged-In
                  </p>
                  <p className="mt-2 font-mono text-2xl font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                    {data.stats.loggedInUsers}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Registered Students
                  </p>
                  <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
                    {data.stats.totalStudents}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Active Paid Members
                  </p>
                  <p className="mt-2 font-mono text-2xl font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {data.stats.activeMembers}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Pending Transfers
                  </p>
                  <p className="mt-2 font-mono text-2xl font-semibold text-amber-700 dark:text-amber-400 tabular-nums">
                    {data.stats.pendingRequests}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Monthly Run-Rate (NGN)
                  </p>
                  <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
                    ₦{data.stats.monthlyRevenueEstimateNaira.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="mt-8 flex flex-wrap items-center gap-1 rounded-lg bg-slate-200/70 dark:bg-slate-800 p-1 w-fit">
                <button
                  type="button"
                  onClick={() => setActiveTab('requests')}
                  className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'requests'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  Membership Requests ({data.stats.pendingRequests} pending)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('students')}
                  className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'students'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  Student Accounts ({data.users.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('curriculum')}
                  className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'curriculum'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  {PROGRAMMING_LANGUAGES.length}-Language Curriculum
                </button>
              </div>

              {/* TAB 1: MEMBERSHIP PAYMENT REQUESTS */}
              {activeTab === 'requests' && (
                <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                    <div>
                      <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                        Moniepoint Transfer Queue
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Verify transfers to 7062449465 (Enenche Dominion) — Monthly ₦5,000 or
                        Yearly ₦60,000.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
                      {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setRequestFilter(f)}
                          className={`rounded-md px-3 py-1 text-xs font-medium capitalize cursor-pointer ${
                            requestFilter === f
                              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="px-6 py-3 font-semibold">Student</th>
                          <th className="px-6 py-3 font-semibold">Plan</th>
                          <th className="px-6 py-3 font-semibold text-right">Amount</th>
                          <th className="px-6 py-3 font-semibold">Sender &amp; Ref</th>
                          <th className="px-6 py-3 font-semibold">Status</th>
                          <th className="px-6 py-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {filteredRequests.map((req) => (
                          <tr
                            key={req.id}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                          >
                            <td className="px-6 py-3.5">
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {req.userName}
                              </p>
                              <p className="text-slate-500 dark:text-slate-400">{req.userEmail}</p>
                            </td>
                            <td className="px-6 py-3.5 capitalize font-medium text-slate-700 dark:text-slate-300">
                              {req.plan}
                            </td>
                            <td className="px-6 py-3.5 text-right font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                              ₦{req.amountNaira.toLocaleString()}
                            </td>
                            <td className="px-6 py-3.5">
                              <p className="text-slate-800 dark:text-slate-200">{req.senderName}</p>
                              <p className="font-mono text-slate-500 dark:text-slate-400">
                                {req.referenceNote}
                              </p>
                            </td>
                            <td className="px-6 py-3.5">
                              <span
                                className={`font-semibold capitalize ${
                                  req.status === 'approved'
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : req.status === 'rejected'
                                      ? 'text-red-700 dark:text-red-400'
                                      : 'text-amber-700 dark:text-amber-400'
                                }`}
                              >
                                {req.status}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              {req.status === 'pending' ? (
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleReviewPayment(req.id, 'approved')}
                                    className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleReviewPayment(req.id, 'rejected')}
                                    className="inline-flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500">Reviewed</span>
                              )}
                            </td>
                          </tr>
                        ))}

                        {filteredRequests.length === 0 && (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-6 py-10 text-center text-slate-500 dark:text-slate-400"
                            >
                              No live membership transfer requests yet. When a student submits a
                              Moniepoint transfer confirmation, it will appear here immediately.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: STUDENT ACCOUNTS */}
              {activeTab === 'students' && (
                <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                    <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                      Live Student Accounts
                    </h2>
                    <div className="relative w-full sm:w-72">
                      <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={studentQuery}
                        onChange={(e) => setStudentQuery(e.target.value)}
                        placeholder="Filter by name, email, or plan..."
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-950"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="px-6 py-3 font-semibold">Learner</th>
                          <th className="px-6 py-3 font-semibold">Session</th>
                          <th className="px-6 py-3 font-semibold text-right">Lessons</th>
                          <th className="px-6 py-3 font-semibold text-right">Drills</th>
                          <th className="px-6 py-3 font-semibold text-right">Arena</th>
                          <th className="px-6 py-3 font-semibold text-right">XP</th>
                          <th className="px-6 py-3 font-semibold">Membership Tier</th>
                          <th className="px-6 py-3 font-semibold text-right">Manage Tier</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {filteredStudents.map((u) => {
                          const isOnline = onlineSet.has(u.id);
                          return (
                            <tr
                              key={u.id}
                              className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                            >
                              <td className="px-6 py-3.5">
                                <p className="font-semibold text-slate-900 dark:text-white">
                                  {u.name}
                                </p>
                                <p className="text-slate-500 dark:text-slate-400">{u.email}</p>
                              </td>
                              <td className="px-6 py-3.5 font-semibold">
                                {isOnline ? (
                                  <span className="text-emerald-700 dark:text-emerald-400">
                                    Online
                                  </span>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-500">
                                    Offline
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-3.5 text-right font-mono tabular-nums">
                                {u.completedLessons.length}
                              </td>
                              <td className="px-6 py-3.5 text-right font-mono tabular-nums">
                                {u.completedDrills.length}
                              </td>
                              <td className="px-6 py-3.5 text-right font-mono tabular-nums">
                                {u.completedArena.length}
                              </td>
                              <td className="px-6 py-3.5 text-right font-mono font-semibold tabular-nums">
                                {u.xp}
                              </td>
                              <td className="px-6 py-3.5 capitalize font-semibold">
                                <span
                                  className={
                                    u.membershipStatus === 'free'
                                      ? 'text-slate-600 dark:text-slate-400'
                                      : 'text-emerald-700 dark:text-emerald-400'
                                  }
                                >
                                  {u.membershipStatus}
                                </span>
                              </td>
                              <td className="px-6 py-3.5 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  {(['free', 'monthly', 'yearly'] as MembershipTier[]).map((t) => (
                                    <button
                                      key={t}
                                      type="button"
                                      onClick={() => handleSetMembershipTier(u.id, t)}
                                      className={`rounded border px-2.5 py-1 text-[11px] font-semibold capitalize cursor-pointer ${
                                        u.membershipStatus === t
                                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                      }`}
                                    >
                                      {t}
                                    </button>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        {filteredStudents.length === 0 && (
                          <tr>
                            <td
                              colSpan={8}
                              className="px-6 py-10 text-center text-slate-500 dark:text-slate-400"
                            >
                              No registered students yet. As learners sign up and log in, their
                              live accounts and sessions will appear here.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: CURRICULUM & LOCK CONTROL */}
              {activeTab === 'curriculum' && (
                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
                  <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                      <div>
                        <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                          Lesson Access Control
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Lessons 1–10 are open free by default. Toggle any lesson below.
                        </p>
                      </div>

                      <select
                        value={selectedLangId}
                        onChange={(e) => setSelectedLangId(e.target.value)}
                        aria-label="Select programming language"
                        className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-600"
                      >
                        {PROGRAMMING_LANGUAGES.map((lang) => (
                          <option key={lang.id} value={lang.id}>
                            {lang.rank}. {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
                      {languageLessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex flex-wrap items-center justify-between gap-4 py-3.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {String(lesson.index).padStart(2, '0')}. {lesson.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {lesson.level} <span aria-hidden="true">·</span> {lesson.summary}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleLessonLock(lesson.id, !lesson.isFree)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                              lesson.isFree
                                ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950'
                                : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950'
                            }`}
                          >
                            {lesson.isFree
                              ? 'Open Free (Click to Lock)'
                              : 'Member Only (Click to Open)'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Publish New Lesson */}
                  <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <Plus className="h-4 w-4" />
                      <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                        Add Custom Lesson to {selectedLanguage.name}
                      </h2>
                    </div>

                    <form onSubmit={handlePublishLesson} className="mt-4 space-y-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                          Lesson Title
                        </label>
                        <input
                          type="text"
                          required
                          value={newLessonTitle}
                          onChange={(e) => setNewLessonTitle(e.target.value)}
                          placeholder={`e.g. File I/O in ${selectedLanguage.name}`}
                          className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                          Summary
                        </label>
                        <input
                          type="text"
                          required
                          value={newLessonSummary}
                          onChange={(e) => setNewLessonSummary(e.target.value)}
                          placeholder="Brief one-line description"
                          className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                          Code Example ({selectedLanguage.fileExt})
                        </label>
                        <textarea
                          rows={4}
                          required
                          value={newLessonCode}
                          onChange={(e) => setNewLessonCode(e.target.value)}
                          placeholder={`Write ${selectedLanguage.name} example code...`}
                          className="code-editor mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-100 outline-none focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                          Expected Output
                        </label>
                        <input
                          type="text"
                          value={newLessonOutput}
                          onChange={(e) => setNewLessonOutput(e.target.value)}
                          placeholder="e.g. Done"
                          className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 font-mono text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-600"
                        />
                      </div>

                      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newLessonIsFree}
                          onChange={(e) => setNewLessonIsFree(e.target.checked)}
                          className="rounded border-slate-300 dark:border-slate-600 text-blue-600"
                        />
                        <span>Make this lesson open for free users</span>
                      </label>

                      <button
                        type="submit"
                        disabled={publishing}
                        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
                      >
                        {publishing ? 'Publishing...' : 'Publish Lesson'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </>
          )
        )}
      </main>
    </div>
  );
}
