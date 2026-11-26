import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  HelpCircle,
  Layers,
  Lock,
  LogOut,
  Menu,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Trophy,
  X,
} from 'lucide-react';
import {useEffect, useMemo, useRef, useState} from 'react';
import {PROGRAMMING_LANGUAGES} from '../data/languages';
import type {
  CurriculumMeta,
  LanguageCategory,
  LessonItem,
  PaymentRequest,
  PublicUser,
} from '../types/learning';
import {evaluateCodeSubmission, type EvaluationResult} from '../utils/codeEvaluator';
import {AITutorPanel} from './AITutorPanel';
import {DrillSession} from './DrillSession';
import {StreakBadgeShowcase} from './StreakBadgeShowcase';
import {ThemeToggle} from './ThemeToggle';

interface LearningWorkspaceProps {
  token: string;
  user: PublicUser;
  latestRequest: PaymentRequest | null;
  curriculumMeta: CurriculumMeta;
  isDark: boolean;
  onToggleDark: () => void;
  onUserUpdated: (user: PublicUser) => void;
  onOpenMembership: () => void;
  onOpenAdminDashboard: () => void;
  onBackToAbout: () => void;
  onLogout: () => void;
}

type WorkspaceMode = 'lessons' | 'drills' | 'arena';

const CATEGORIES: ('All' | LanguageCategory)[] = [
  'All',
  'Core & Systems',
  'Web & Application',
  'Data & Scientific',
  'Functional & Scripting',
];

export function LearningWorkspace({
  token,
  user,
  latestRequest,
  curriculumMeta,
  isDark,
  onToggleDark,
  onUserUpdated,
  onOpenMembership,
  onOpenAdminDashboard,
  onBackToAbout,
  onLogout,
}: LearningWorkspaceProps) {
  const [selectedLangId, setSelectedLangId] = useState<string>(
    user.preferredLanguageId || 'python'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | LanguageCategory>('All');
  const [mode, setMode] = useState<WorkspaceMode>('lessons');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Separate Page State: null = Topics & Subjects Hub; number = Dedicated Lesson Page
  const [activeLessonIndex, setActiveLessonIndex] = useState<number | null>(null);
  const [exerciseCode, setExerciseCode] = useState<string>('');
  const [showHint, setShowHint] = useState(false);
  const [exerciseResult, setExerciseResult] = useState<EvaluationResult | null>(null);
  const [copiedExample, setCopiedExample] = useState(false);

  // Arena state (no timer; guided briefing prompt on entry)
  const [activeArenaIndex, setActiveArenaIndex] = useState<number>(0);
  const [arenaCode, setArenaCode] = useState<string>('');
  const [arenaResult, setArenaResult] = useState<EvaluationResult | null>(null);
  const [showArenaBriefing, setShowArenaBriefing] = useState<boolean>(false);

  const draftTimeoutRef = useRef<number | null>(null);

  const isMember =
    user.role === 'admin' ||
    user.membershipStatus === 'monthly' ||
    user.membershipStatus === 'yearly';

  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return PROGRAMMING_LANGUAGES.filter((lang) => {
      const catMatch = categoryFilter === 'All' || lang.category === categoryFilter;
      const textMatch =
        !q ||
        lang.name.toLowerCase().includes(q) ||
        lang.paradigm.toLowerCase().includes(q) ||
        String(lang.rank) === q;
      return catMatch && textMatch;
    });
  }, [searchQuery, categoryFilter]);

  const activeLanguage = useMemo(() => {
    return (
      PROGRAMMING_LANGUAGES.find((l) => l.id === selectedLangId) ??
      PROGRAMMING_LANGUAGES[0]
    );
  }, [selectedLangId]);

  const combinedLessons: LessonItem[] = useMemo(() => {
    const custom = curriculumMeta.customLessons[activeLanguage.id] ?? [];
    return [...activeLanguage.lessons, ...custom].map((lesson) => {
      const override = curriculumMeta.lessonLockOverrides[lesson.id];
      return {
        ...lesson,
        isFree: typeof override === 'boolean' ? override : lesson.isFree,
      };
    });
  }, [activeLanguage, curriculumMeta]);

  const currentLesson =
    activeLessonIndex !== null ? combinedLessons[activeLessonIndex] ?? null : null;
  const currentArena =
    activeLanguage.arena[activeArenaIndex] ?? activeLanguage.arena[0];

  useEffect(() => {
    if (
      user.preferredLanguageId &&
      PROGRAMMING_LANGUAGES.some((l) => l.id === user.preferredLanguageId)
    ) {
      setSelectedLangId(user.preferredLanguageId);
    }
  }, [user.id]);

  useEffect(() => {
    if (currentLesson) {
      const savedDraft = user.savedCodeDrafts?.[currentLesson.id];
      setExerciseCode(
        typeof savedDraft === 'string' && savedDraft.length > 0
          ? savedDraft
          : currentLesson.exercise.starterCode
      );
      setExerciseResult(null);
      setShowHint(false);
    }
  }, [currentLesson?.id]);

  useEffect(() => {
    if (currentArena) {
      const savedDraft = user.savedCodeDrafts?.[currentArena.id];
      setArenaCode(
        typeof savedDraft === 'string' && savedDraft.length > 0
          ? savedDraft
          : currentArena.starterCode
      );
      setArenaResult(null);
    }
  }, [currentArena?.id, mode]);

  useEffect(() => {
    if (mode === 'arena') {
      setShowArenaBriefing(true);
    }
  }, [mode, activeLanguage.id]);

  useEffect(() => {
    return () => {
      if (draftTimeoutRef.current) {
        window.clearTimeout(draftTimeoutRef.current);
      }
    };
  }, []);

  const flushDraftToServer = async (itemId: string, code: string) => {
    if (draftTimeoutRef.current) {
      window.clearTimeout(draftTimeoutRef.current);
      draftTimeoutRef.current = null;
    }
    try {
      const res = await fetch('/api/progress/draft', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({itemId, code}),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          onUserUpdated(data.user);
        }
      }
    } catch {
      // Non-fatal
    }
  };

  const saveDraftToServer = (itemId: string, code: string) => {
    if (draftTimeoutRef.current) {
      window.clearTimeout(draftTimeoutRef.current);
    }
    draftTimeoutRef.current = window.setTimeout(() => {
      void flushDraftToServer(itemId, code);
    }, 800);
  };

  const recordCompletion = async (
    kind: 'lesson' | 'drill' | 'arena',
    itemId: string,
    extra?: {code?: string; selectedOption?: number}
  ) => {
    try {
      const res = await fetch('/api/progress/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({kind, itemId, ...extra}),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          onUserUpdated(data.user);
        }
      }
    } catch {
      // Non-fatal
    }
  };

  const handleRunExercise = async () => {
    if (!currentLesson) return;
    const res = evaluateCodeSubmission({
      languageId: activeLanguage.id,
      code: exerciseCode,
      expectedKeywords: currentLesson.exercise.expectedKeywords,
      expectedOutput: currentLesson.exercise.expectedOutput,
    });
    setExerciseResult(res);
    if (res.passed) {
      await recordCompletion('lesson', currentLesson.id, {code: exerciseCode});
    } else {
      saveDraftToServer(currentLesson.id, exerciseCode);
    }
  };

  const handleRunArena = async () => {
    if (!currentArena) return;
    const res = evaluateCodeSubmission({
      languageId: activeLanguage.id,
      code: arenaCode,
      expectedKeywords: currentArena.validationKeywords,
      expectedOutput: currentArena.expectedOutput,
    });
    setArenaResult(res);
    if (res.passed) {
      await recordCompletion('arena', currentArena.id, {code: arenaCode});
    } else {
      saveDraftToServer(currentArena.id, arenaCode);
    }
  };

  const handleVerifyDrillCorrect = async (drillId: string, selectedOption: number) => {
    await recordCompletion('drill', drillId, {selectedOption});
  };

  const handleCopyCode = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedExample(true);
      setTimeout(() => setCopiedExample(false), 1800);
    } catch {
      setCopiedExample(false);
    }
  };

  const selectLanguage = async (langId: string, targetMode: WorkspaceMode = 'lessons') => {
    setSelectedLangId(langId);
    setActiveLessonIndex(null);
    setActiveArenaIndex(0);
    setMode(targetMode);
    setMobileMenuOpen(false);
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({preferredLanguageId: langId}),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          onUserUpdated(data.user);
        }
      }
    } catch {
      // Non-fatal
    }
  };

  const openLessonPage = (index: number) => {
    setActiveLessonIndex(index);
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const completedInActiveLang = combinedLessons.filter((l) =>
    user.completedLessons.includes(l.id)
  ).length;
  const progressPct =
    combinedLessons.length > 0
      ? Math.round((completedInActiveLang / combinedLessons.length) * 100)
      : 0;

  const lessonLocked = currentLesson && !currentLesson.isFree && !isMember;
  const arenaLocked = currentArena && !currentArena.isFree && !isMember;

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-900 dark:bg-[#080c14] dark:text-slate-100 flex flex-col transition-colors">
      {/* Top Workspace Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0b101b]/95 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle language sidebar"
              className="rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-slate-700 dark:text-slate-200 lg:hidden cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onBackToAbout}
              className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              Learning HQ
            </button>
          </div>

          <div className="hidden md:flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('lessons');
                setActiveLessonIndex(null);
              }}
              className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === 'lessons'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Topics &amp; Lessons
            </button>
            <button
              type="button"
              onClick={() => setMode('drills')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === 'drills'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Drills
            </button>
            <button
              type="button"
              onClick={() => setMode('arena')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === 'arena'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Trophy className="h-3.5 w-3.5" />
              Coding Arena
            </button>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="hidden sm:inline font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
              {user.streakDays}d streak <span aria-hidden="true">·</span> {user.xp} XP
            </span>
            <ThemeToggle isDark={isDark} onToggle={onToggleDark} />
            {user.role === 'admin' && (
              <button
                type="button"
                onClick={onOpenAdminDashboard}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin Console
              </button>
            )}
            {!isMember && (
              <button
                type="button"
                onClick={onOpenMembership}
                className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Register as Member
              </button>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>

        {/* Mobile Mode Bar */}
        <div className="flex md:hidden border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2 gap-1">
          {(['lessons', 'drills', 'arena'] as WorkspaceMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                if (m === 'lessons') setActiveLessonIndex(null);
              }}
              className={`flex-1 rounded-md py-1.5 text-xs font-semibold capitalize transition-colors cursor-pointer ${
                mode === m
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar: All 50 Languages / Subjects */}
        <aside
          className={`${
            mobileMenuOpen
              ? 'fixed inset-y-0 left-0 z-40 block w-72 bg-white dark:bg-[#0b101b] shadow-xl'
              : 'hidden'
          } lg:static lg:block lg:w-72 lg:shrink-0 border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0b101b]`}
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[160px]">
                    {user.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {isMember
                      ? user.role === 'admin'
                        ? 'Administrator Access'
                        : `${user.membershipStatus === 'yearly' ? 'Yearly' : 'Monthly'} Member`
                      : latestRequest?.status === 'pending'
                        ? 'Free · Transfer Pending'
                        : 'Free Starter Plan'}
                  </p>
                </div>
                {mobileMenuOpen && (
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded p-1 text-slate-500 dark:text-slate-400 lg:hidden cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {!isMember && (
                <button
                  type="button"
                  onClick={onOpenMembership}
                  className="mt-3 w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 px-3 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950 transition-colors cursor-pointer"
                >
                  Register as Member (₦5,000/mo)
                </button>
              )}

              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${PROGRAMMING_LANGUAGES.length} subjects...`}
                  aria-label={`Search ${PROGRAMMING_LANGUAGES.length} programming languages`}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 py-2 pl-8 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-950"
                />
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                      categoryFilter === cat
                        ? 'bg-slate-900 dark:bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat === 'All' ? `All ${PROGRAMMING_LANGUAGES.length}` : cat.split(' & ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 max-h-[calc(100vh-250px)]">
              {filteredLanguages.map((lang) => {
                const isSelected = lang.id === activeLanguage.id;
                const completedCount = lang.lessons.filter((l) =>
                  user.completedLessons.includes(l.id)
                ).length;

                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => selectLanguage(lang.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 tabular-nums w-5 shrink-0">
                        {String(lang.rank).padStart(2, '0')}
                      </span>
                      <span className="truncate">{lang.name}</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 tabular-nums shrink-0">
                      {completedCount}/{lang.lessons.length}
                    </span>
                  </button>
                );
              })}

              {filteredLanguages.length === 0 && (
                <p className="px-3 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  No matching subject found.
                </p>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="mx-auto max-w-5xl">
            <StreakBadgeShowcase
              token={token}
              user={user}
              onUserUpdated={onUserUpdated}
              showHubCard={mode === 'lessons' && activeLessonIndex === null}
            />

            {/* MODE 1A: TOPICS & SUBJECTS HUB PAGE (when no lesson is opened) */}
            {mode === 'lessons' && activeLessonIndex === null && (
              <div>
                {/* Friendly Language Hub Header */}
                <div className="studio-surface rounded-2xl border p-6 sm:p-8">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Subject #{activeLanguage.rank} <span aria-hidden="true">·</span>{' '}
                    {activeLanguage.category} <span aria-hidden="true">·</span>{' '}
                    {activeLanguage.paradigm} <span aria-hidden="true">·</span>{' '}
                    {activeLanguage.fileExt}
                  </p>
                  <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {activeLanguage.name} Curriculum
                      </h1>
                      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                        {activeLanguage.tagline}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openLessonPage(0)}
                      className="inline-flex items-center gap-2 self-start rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>Start Lesson 01</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Clean Progress Meter */}
                  <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Your {activeLanguage.name} progress
                      </span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                        {completedInActiveLang} / {combinedLessons.length} lessons ({progressPct}%)
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-300"
                        style={{width: `${progressPct}%`}}
                      />
                    </div>
                  </div>
                </div>

                {/* All Topics Grid — clicking any card opens a dedicated Lesson Page */}
                <div className="mt-8">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                      Select a lesson to begin
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Lessons 1–10 are open free <span aria-hidden="true">·</span> Deeper lessons
                      unlock with Membership
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {combinedLessons.map((lesson, idx) => {
                      const isCompleted = user.completedLessons.includes(lesson.id);
                      const isLocked = !lesson.isFree && !isMember;

                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          onClick={() => openLessonPage(idx)}
                          className="studio-surface group flex flex-col justify-between rounded-xl border p-5 text-left transition-colors hover:border-blue-600 dark:hover:border-blue-500 cursor-pointer"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="font-mono font-semibold text-slate-400 dark:text-slate-500 tabular-nums">
                                Lesson {String(lesson.index).padStart(2, '0')}
                              </span>
                              {isCompleted ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Completed
                                </span>
                              ) : isLocked ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                                  <Lock className="h-3.5 w-3.5" />
                                  Member Only
                                </span>
                              ) : (
                                <span className="font-medium text-blue-600 dark:text-blue-400">
                                  Open Free
                                </span>
                              )}
                            </div>

                            <h3 className="mt-2 font-display text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {lesson.title}
                            </h3>
                            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                              {lesson.summary}
                            </p>
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 text-xs text-slate-500 dark:text-slate-400">
                            <span>{lesson.level}</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {isLocked ? 'Unlock Lesson' : 'Open Lesson'}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* MODE 1B: DEDICATED LESSON PAGE (Separate page view when a lesson is clicked) */}
            {mode === 'lessons' && activeLessonIndex !== null && currentLesson && (
              <div className="space-y-6">
                {/* Lesson Page Breadcrumb & Back Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <button
                    type="button"
                    onClick={() => setActiveLessonIndex(null)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to {activeLanguage.name} Topics
                  </button>

                  <p className="font-mono text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                    {activeLanguage.name} <span aria-hidden="true">·</span> Lesson{' '}
                    {activeLessonIndex + 1} of {combinedLessons.length}
                  </p>
                </div>

                {lessonLocked ? (
                  <div className="studio-surface rounded-2xl border p-8 sm:p-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                      <Lock className="h-6 w-6" />
                    </div>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                      Member Lesson Locked
                    </p>
                    <h1 className="mt-2 font-display text-2xl font-bold text-slate-900 dark:text-white">
                      {currentLesson.title}
                    </h1>
                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">
                      You have explored the 10 open beginner lessons! Become a Learning HQ Member
                      to unlock deeper {activeLanguage.name} lessons and exercises across all{' '}
                      {PROGRAMMING_LANGUAGES.length} languages.
                    </p>

                    <div className="mx-auto mt-6 max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-left text-xs text-slate-700 dark:text-slate-300 space-y-1">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        Membership Plans
                      </p>
                      <p>
                        Monthly: <span className="font-mono font-semibold">₦5,000 / month</span>
                      </p>
                      <p>
                        Yearly:{' '}
                        <span className="font-mono font-semibold">
                          ₦60,000 / year (₦5,000 × 12)
                        </span>
                      </p>
                      <p>Moniepoint · 7062449465 · Enenche Dominion</p>
                    </div>

                    <button
                      type="button"
                      onClick={onOpenMembership}
                      className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Register as Member
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Lesson Explanation */}
                    <article className="studio-surface rounded-2xl border p-6 sm:p-8">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          Lesson {String(currentLesson.index).padStart(2, '0')}{' '}
                          <span aria-hidden="true">·</span> {currentLesson.level}{' '}
                          <span aria-hidden="true">·</span>{' '}
                          {currentLesson.isFree ? 'Free Lesson' : 'Member Lesson'}
                        </span>
                        {user.completedLessons.includes(currentLesson.id) && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                            Exercise Passed
                          </span>
                        )}
                      </div>

                      <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                        {currentLesson.title}
                      </h1>
                      <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                        {currentLesson.summary}
                      </p>

                      <div className="mt-5 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        {currentLesson.explanation.map((para, i) => (
                          <p key={i}>{para}</p>
                        ))}
                      </div>

                      {/* Annotated Example Code */}
                      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950">
                        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5 text-xs text-slate-400">
                          <span className="font-mono">
                            example{activeLanguage.fileExt}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(currentLesson.codeExample)}
                            className="inline-flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer"
                          >
                            {copiedExample ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-slate-100">
                          <code>{currentLesson.codeExample}</code>
                        </pre>
                      </div>

                      <div className="mt-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                          Key Takeaway
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                          {currentLesson.keyTakeaway}
                        </p>
                      </div>
                    </article>

                    {/* Split Row: Exercise (Left) + AI Study Guide (Right) */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
                      {/* Interactive Exercise (NO answer / expected output shown!) */}
                      <section className="studio-surface lg:col-span-7 rounded-2xl border p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                              Your Turn · Lesson Exercise
                            </p>
                            <h2 className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-white">
                              Write &amp; test your own solution
                            </h2>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setShowHint(!showHint)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <HelpCircle className="h-3.5 w-3.5" />
                              {showHint ? 'Hide Hint' : 'Hint'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setExerciseCode(currentLesson.exercise.starterCode);
                                setExerciseResult(null);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Reset
                            </button>
                          </div>
                        </div>

                        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                          {currentLesson.exercise.prompt}
                        </p>

                        {showHint && (
                          <p className="mt-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 px-4 py-2.5 text-xs text-blue-900 dark:text-blue-200">
                            Hint: {currentLesson.exercise.hint}
                          </p>
                        )}

                        <div className="mt-4">
                          <label htmlFor="lesson-exercise-editor" className="sr-only">
                            Lesson exercise code editor
                          </label>
                          <textarea
                            id="lesson-exercise-editor"
                            value={exerciseCode}
                            onChange={(e) => {
                              const next = e.target.value;
                              setExerciseCode(next);
                              if (currentLesson) {
                                saveDraftToServer(currentLesson.id, next);
                              }
                            }}
                            onBlur={() => {
                              if (currentLesson) {
                                void flushDraftToServer(currentLesson.id, exerciseCode);
                              }
                            }}
                            rows={8}
                            spellCheck={false}
                            className="code-editor w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100 outline-none focus:border-blue-600"
                          />
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Stuck? Ask the AI Study Guide for a concept explanation.
                          </p>
                          <button
                            type="button"
                            onClick={handleRunExercise}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
                          >
                            <Play className="h-3.5 w-3.5" />
                            Check My Code
                          </button>
                        </div>

                        {exerciseResult && (
                          <div
                            className={`mt-4 rounded-xl border p-4 ${
                              exerciseResult.passed
                                ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40'
                                : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40'
                            }`}
                          >
                            <p
                              className={`text-xs font-semibold ${
                                exerciseResult.passed
                                  ? 'text-emerald-800 dark:text-emerald-300'
                                  : 'text-amber-900 dark:text-amber-200'
                              }`}
                            >
                              {exerciseResult.passed ? 'PASSED · +50 XP' : 'KEEP GOING'} —{' '}
                              {exerciseResult.feedback}
                            </p>
                            {exerciseResult.output && (
                              <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-xs text-slate-100">
                                {exerciseResult.output}
                              </pre>
                            )}
                            <ul className="mt-3 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                              {exerciseResult.checks.map((c, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                  <span
                                    className={
                                      c.ok
                                        ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                                        : 'text-red-700 dark:text-red-400'
                                    }
                                  >
                                    {c.ok ? '[PASS]' : '[CHECK]'}
                                  </span>
                                  <span>{c.label}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </section>

                      {/* AI Study Guide Bot */}
                      <div className="lg:col-span-5">
                        <AITutorPanel
                          key={currentLesson.id}
                          token={token}
                          languageName={activeLanguage.name}
                          lessonTitle={currentLesson.title}
                          lessonSummary={currentLesson.summary}
                          exercisePrompt={currentLesson.exercise.prompt}
                          studentCode={exerciseCode}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Dedicated Lesson Page Footer: Previous & Next Lesson Navigation */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800 pt-6">
                  <button
                    type="button"
                    disabled={activeLessonIndex <= 0}
                    onClick={() => openLessonPage(activeLessonIndex - 1)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Previous Lesson
                  </button>

                  {activeLessonIndex < combinedLessons.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => openLessonPage(activeLessonIndex + 1)}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      <span>
                        Next Lesson ({String(activeLessonIndex + 2).padStart(2, '0')})
                      </span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMode('drills')}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                    >
                      <span>Continue to {activeLanguage.name} Drills</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* MODE 2: DRILLS */}
            {mode === 'drills' && (() => {
              const langIdx = PROGRAMMING_LANGUAGES.findIndex(
                (l) => l.id === activeLanguage.id
              );
              const nextLanguage =
                PROGRAMMING_LANGUAGES[(langIdx + 1) % PROGRAMMING_LANGUAGES.length] ??
                PROGRAMMING_LANGUAGES[0];

              return (
                <DrillSession
                  language={activeLanguage}
                  completedDrills={user.completedDrills}
                  savedDrillAnswers={user.savedDrillAnswers ?? {}}
                  nextLanguageName={nextLanguage.name}
                  onVerifyCorrect={handleVerifyDrillCorrect}
                  onContinueToArena={() => setMode('arena')}
                  onNextLanguageDrills={() => selectLanguage(nextLanguage.id, 'drills')}
                  onBackToLessons={() => {
                    setMode('lessons');
                    setActiveLessonIndex(null);
                  }}
                />
              );
            })()}

            {/* MODE 3: CODING ARENA */}
            {mode === 'arena' && (
              <div className="space-y-6">
                {/* Arena Briefing Modal (Same guided notification style as Drills, no timer) */}
                {showArenaBriefing && (
                  <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="arena-ready-title"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
                  >
                    <div className="studio-surface w-full max-w-lg rounded-2xl border p-7">
                      <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                        <Trophy className="h-5 w-5" />
                        <span className="text-xs font-semibold uppercase tracking-wide">
                          {activeLanguage.name} · Coding Arena Briefing
                        </span>
                      </div>

                      <h2
                        id="arena-ready-title"
                        className="mt-3 font-display text-2xl font-bold text-slate-900 dark:text-white"
                      >
                        What is the Coding Arena? Are you ready?
                      </h2>

                      <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        <p>
                          The <strong className="text-slate-900 dark:text-white">Coding Arena</strong>{' '}
                          is where you apply everything you learned to build a complete{' '}
                          {activeLanguage.name} solution from scratch (+100 XP per challenge).
                        </p>
                        <ul className="space-y-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-xs text-slate-700 dark:text-slate-300">
                          <li>1. There is no countdown timer—focus cleanly on solving the problem.</li>
                          <li>
                            2. Review the specification and requirements, then write your solution in
                            the editor.
                          </li>
                          <li>
                            3. Use the <strong className="text-slate-900 dark:text-white">AI Study Guide</strong>{' '}
                            whenever you want a conceptual hint without spoiling the answer.
                          </li>
                        </ul>
                      </div>

                      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowArenaBriefing(false);
                            setMode('lessons');
                            setActiveLessonIndex(null);
                          }}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                          <span>Not Yet, Back to Lessons</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowArenaBriefing(false)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                          <Play className="h-3.5 w-3.5" />
                          <span>Yes, Open Coding Arena</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-b border-slate-200 dark:border-slate-800 pb-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {activeLanguage.arena.map((ch, idx) => {
                      const locked = !ch.isFree && !isMember;
                      const done = user.completedArena.includes(ch.id);
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => setActiveArenaIndex(idx)}
                          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                            activeArenaIndex === idx
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {locked && <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />}
                          {done && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                          <span>{ch.title}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowArenaBriefing(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Arena Briefing</span>
                  </button>
                </div>

                {arenaLocked ? (
                  <div className="studio-surface rounded-2xl border p-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                      <Lock className="h-6 w-6" />
                    </div>
                    <h2 className="mt-4 font-display text-2xl font-bold text-slate-900 dark:text-white">
                      {currentArena.title}
                    </h2>
                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">
                      Mastery Arena challenges are reserved for Learning HQ Members (₦5,000/month
                      or ₦60,000/year).
                    </p>
                    <button
                      type="button"
                      onClick={onOpenMembership}
                      className="mt-6 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Register as Member
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Problem Spec */}
                    <div className="lg:col-span-5 space-y-5">
                      <div className="studio-surface rounded-2xl border p-6 space-y-5">
                        <div>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {currentArena.difficulty} Arena <span aria-hidden="true">·</span> +100
                            XP
                          </p>
                          <h2 className="mt-1 font-display text-xl font-bold text-slate-900 dark:text-white">
                            {currentArena.title}
                          </h2>
                          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            {currentArena.description}
                          </p>
                        </div>

                        <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">
                            Requirements
                          </p>
                          <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                            {currentArena.requirements.map((req, rIdx) => (
                              <li key={rIdx}>
                                {rIdx + 1}. {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <AITutorPanel
                        key={currentArena.id}
                        token={token}
                        languageName={activeLanguage.name}
                        lessonTitle={currentArena.title}
                        lessonSummary={currentArena.description}
                        exercisePrompt={currentArena.description}
                        studentCode={arenaCode}
                      />
                    </div>

                    {/* Arena Editor */}
                    <div className="studio-surface lg:col-span-7 rounded-2xl border p-6 flex flex-col">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                          arena_solution{activeLanguage.fileExt}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setArenaCode(currentArena.starterCode);
                            setArenaResult(null);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Reset Starter
                        </button>
                      </div>

                      <textarea
                        value={arenaCode}
                        onChange={(e) => {
                          const next = e.target.value;
                          setArenaCode(next);
                          if (currentArena) {
                            saveDraftToServer(currentArena.id, next);
                          }
                        }}
                        onBlur={() => {
                          if (currentArena) {
                            void flushDraftToServer(currentArena.id, arenaCode);
                          }
                        }}
                        rows={13}
                        spellCheck={false}
                        aria-label="Coding Arena editor"
                        className="code-editor w-full flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100 outline-none focus:border-blue-600"
                      />

                      <div className="mt-4 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={handleRunArena}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                          <Play className="h-3.5 w-3.5" />
                          Run &amp; Submit Solution
                        </button>
                      </div>

                      {arenaResult && (
                        <div
                          className={`mt-4 rounded-xl border p-4 ${
                            arenaResult.passed
                              ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40'
                              : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40'
                          }`}
                        >
                          <p
                            className={`text-xs font-semibold ${
                              arenaResult.passed
                                ? 'text-emerald-800 dark:text-emerald-300'
                                : 'text-amber-900 dark:text-amber-200'
                            }`}
                          >
                            {arenaResult.passed
                              ? 'ARENA PASSED · +100 XP AWARDED'
                              : 'ARENA CHECK FAILED'}{' '}
                            — {arenaResult.feedback}
                          </p>
                          {arenaResult.output && (
                            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-xs text-slate-100">
                              {arenaResult.output}
                            </pre>
                          )}
                          {arenaResult.passed && activeArenaIndex < activeLanguage.arena.length - 1 && (
                            <div className="mt-3 flex justify-end">
                              <button
                                type="button"
                                onClick={() => setActiveArenaIndex(activeArenaIndex + 1)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                              >
                                <span>Next Challenge</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
