import {ArrowRight, BookOpen, Check, Code2, Layers, ShieldCheck, Terminal, Trophy} from 'lucide-react';
import {motion} from 'motion/react';
import {useState} from 'react';
import {PROGRAMMING_LANGUAGES} from '../data/languages';
import type {LanguageCategory, PublicUser} from '../types/learning';
import {ThemeToggle} from './ThemeToggle';

interface AboutPageProps {
  currentUser: PublicUser | null;
  isDark: boolean;
  onToggleDark: () => void;
  onGoToSignup: () => void;
  onGoToLogin: () => void;
  onGoToWorkspace: () => void;
}

const CATEGORIES: ('All' | LanguageCategory)[] = [
  'All',
  'Core & Systems',
  'Web & Application',
  'Data & Scientific',
  'Functional & Scripting',
];

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function AboutPage({
  currentUser,
  isDark,
  onToggleDark,
  onGoToSignup,
  onGoToLogin,
  onGoToWorkspace,
}: AboutPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<'All' | LanguageCategory>('All');
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [workshopImgFailed, setWorkshopImgFailed] = useState(false);
  const [arenaImgFailed, setArenaImgFailed] = useState(false);

  const totalLanguages = PROGRAMMING_LANGUAGES.length;
  const totalLessons = PROGRAMMING_LANGUAGES.reduce((sum, l) => sum + l.lessons.length, 0);
  const totalFreeLessons = PROGRAMMING_LANGUAGES.reduce(
    (sum, l) => sum + l.lessons.filter((x) => x.isFree).length,
    0
  );
  const totalPaidLessons = totalLessons - totalFreeLessons;
  const totalDrills = PROGRAMMING_LANGUAGES.reduce((sum, l) => sum + l.drills.length, 0);

  const visibleLanguages =
    selectedCategory === 'All'
      ? PROGRAMMING_LANGUAGES
      : PROGRAMMING_LANGUAGES.filter((l) => l.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-900 dark:bg-[#080c14] dark:text-slate-100 transition-colors">
      {/* Top Bar Contract: 3 clean zones */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0b101b]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-4">
          <a
            href="#top"
            className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            Learning HQ
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a
              href="#curriculum"
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Curriculum
            </a>
            <a
              href="#languages"
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Languages
            </a>
            <a
              href="#arena"
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Drills &amp; Arena
            </a>
            <a
              href="#membership"
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Membership
            </a>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <ThemeToggle isDark={isDark} onToggle={onToggleDark} />
            {currentUser ? (
              <button
                type="button"
                onClick={onGoToWorkspace}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Open Workspace
              </button>
            ) : (
              <button
                type="button"
                onClick={onGoToLogin}
                className="rounded-xl bg-slate-900 dark:bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Log in
              </button>
            )}
          </div>
        </div>
      </header>

      <main id="top">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0b101b]">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-12 px-6 py-16 lg:grid-cols-12 lg:py-24">
            <div className="flex flex-col justify-center lg:col-span-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {totalLanguages} Languages &amp; Web Stacks <span aria-hidden="true">·</span>{' '}
                {totalLessons} From-Scratch Lessons
              </p>
              <h1 className="mt-4 text-balance font-display text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl leading-[1.06]">
                Learn coding from &ldquo;Hello, World!&rdquo; to real engineering.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
                Learning HQ teaches complete beginners and advancing developers step by step—from
                printing your very first line and writing comments to rapid syntax drills and the
                timer-free Coding Arena across {totalLanguages} essential languages, including
                Python, HTML, CSS, JavaScript, SQL, ABAP, PL/SQL, and Ladder Logic.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#get-started"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
                >
                  Explore Learning HQ
                  <ArrowRight className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={onGoToLogin}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Already have an account? Log in
                </button>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-6 border-t border-slate-200/80 dark:border-slate-800 pt-6">
                <div>
                  <p className="font-mono text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                    {totalLanguages}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Languages &amp; markup
                  </p>
                </div>
                <div>
                  <p className="font-mono text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                    {totalFreeLessons}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Free starter lessons
                  </p>
                </div>
                <div>
                  <p className="font-mono text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                    {totalDrills}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Interactive drills
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="studio-surface h-full min-h-[300px] overflow-hidden rounded-2xl border p-2">
                <div className="h-full w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900">
                  {heroImgFailed ? (
                    <div className="flex h-full min-h-[340px] flex-col items-center justify-center bg-slate-900 p-8 text-slate-100">
                      <Terminal className="h-10 w-10 text-blue-400" />
                      <p className="mt-3 font-display text-lg font-semibold">
                        Learning HQ Engineering Studio
                      </p>
                    </div>
                  ) : (
                    <img
                      src="/assets/aistudio/Cheerful_Coding_Workshop_Selfie_714295be.webp"
                      alt="Students learning to write code together during a bright Learning HQ workshop session"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgFailed(true)}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Smooth Transition Section 2: Curriculum Architecture */}
        <motion.section
          id="curriculum"
          initial={{opacity: 0, y: 24}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true, amount: 0.2}}
          transition={{duration: 0.55, ease: EASE_OUT}}
          className="border-b border-slate-200/80 dark:border-slate-800/80 bg-[#f7f8fb] dark:bg-[#080c14] py-20"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-12 px-6 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="studio-surface h-full min-h-[300px] overflow-hidden rounded-2xl border p-2">
                <div className="h-full w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900">
                  {workshopImgFailed ? (
                    <div className="flex h-full min-h-[300px] flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 p-8 text-slate-700 dark:text-slate-200">
                      <BookOpen className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                      <p className="mt-3 font-display text-lg font-semibold">
                        Structured Technical Curriculum
                      </p>
                    </div>
                  ) : (
                    <img
                      src="/src/assets/images/about_curriculum_craft_1795513684457.jpg"
                      alt="Learners studying programming foundations in a bright studio"
                      referrerPolicy="no-referrer"
                      onError={() => setWorkshopImgFailed(true)}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center lg:col-span-7">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Built Truly From Scratch
              </p>
              <h2 className="mt-2 text-balance font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Every track opens with &ldquo;Hello, World!&rdquo; and grows line by line.
              </h2>

              <div className="mt-8 divide-y divide-slate-200/80 dark:divide-slate-800 border-y border-slate-200/80 dark:border-slate-800">
                <div className="py-5">
                  <div className="flex items-start gap-4">
                    <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                        01. From Zero to Real Code (Answers Kept Hidden)
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        Start at Lesson 01 with what the language does and a pure &ldquo;Hello,
                        World!&rdquo; example, then move through comments, variables, data types,
                        arithmetic, conditionals, loops, functions, and lists. Exercises never give
                        away answers—use the Socratic AI Study Guide to learn the reasoning.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="py-5">
                  <div className="flex items-start gap-4">
                    <Layers className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                        02. Multi-Section Rapid Drills with Readiness Briefing
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        No drill clock ever starts until you read the briefing and confirm you are
                        ready. Verify each question cleanly to unlock the next, then advance across
                        sections seamlessly.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="py-5">
                  <div className="flex items-start gap-4">
                    <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                        03. Timer-Free Coding Arena &amp; Streak Award Badges
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        Enter the Coding Arena with a guided briefing and zero timer pressure so you
                        can think clearly. Log in regularly to unlock streak award badges at 2 days,
                        1 week, 2 weeks, and beyond.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Smooth Transition Section 3: Complete 50-Language Directory */}
        <motion.section
          id="languages"
          initial={{opacity: 0, y: 24}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true, amount: 0.08}}
          transition={{duration: 0.55, ease: EASE_OUT}}
          className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0b101b] py-20"
        >
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Complete Language Index
                </p>
                <h2 className="mt-2 text-balance font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {totalLanguages} languages &amp; web technologies taught from scratch.
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {visibleLanguages.map((lang) => (
                <div
                  key={lang.id}
                  className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-[#f9fafc] dark:bg-[#0f1625] p-4 transition-colors hover:border-blue-500/60 dark:hover:border-blue-500/60 hover:bg-white dark:hover:bg-[#131b2e]"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-400 dark:text-slate-500 tabular-nums">
                      {String(lang.rank).padStart(2, '0')}
                    </span>
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      {lang.fileExt}
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-base font-semibold text-slate-900 dark:text-white">
                    {lang.name}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2">
                    {lang.tagline}
                  </p>
                  <p className="mt-3 border-t border-slate-200/70 dark:border-slate-800 pt-2.5 text-xs text-slate-500 dark:text-slate-400">
                    {lang.lessons.length} lessons <span aria-hidden="true">·</span>{' '}
                    {lang.drills.length} drills <span aria-hidden="true">·</span>{' '}
                    {lang.arena.length} arena
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Smooth Transition Section 4: Practice & Arena */}
        <motion.section
          id="arena"
          initial={{opacity: 0, y: 24}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true, amount: 0.2}}
          transition={{duration: 0.55, ease: EASE_OUT}}
          className="border-b border-slate-200/80 dark:border-slate-800/80 bg-[#f7f8fb] dark:bg-[#080c14] py-20"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-12 px-6 lg:grid-cols-12">
            <div className="flex flex-col justify-center lg:col-span-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Built for Active Recall
              </p>
              <h2 className="mt-2 text-balance font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Practice in the timer-free Coding Arena after every milestone.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Reading syntax is only half the work. Learning HQ pairs every lesson with a focused
                inline exercise, confirms your readiness before starting Drills, and opens dedicated
                timer-free Coding Arenas where every line of saved code persists to your account.
              </p>

              <div className="mt-8 grid grid-cols-3 gap-6 border-t border-slate-200/80 dark:border-slate-800 pt-6">
                <div>
                  <p className="font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
                    {totalLanguages}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Languages indexed
                  </p>
                </div>
                <div>
                  <p className="font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
                    {totalLessons}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Guided lessons &amp; exercises
                  </p>
                </div>
                <div>
                  <p className="font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
                    {totalDrills}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Syntax &amp; debug drills
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="studio-surface h-full min-h-[300px] overflow-hidden rounded-2xl border p-2">
                <div className="h-full w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900">
                  {arenaImgFailed ? (
                    <div className="flex h-full min-h-[300px] flex-col items-center justify-center bg-slate-900 p-8 text-slate-100">
                      <Code2 className="h-10 w-10 text-blue-400" />
                      <p className="mt-3 font-display text-lg font-semibold">
                        Interactive Coding Arena
                      </p>
                    </div>
                  ) : (
                    <img
                      src="/src/assets/images/about_arena_practice_1795513684848.jpg"
                      alt="Developer desk with laptop, mechanical keyboard, and algorithm notebook"
                      referrerPolicy="no-referrer"
                      onError={() => setArenaImgFailed(true)}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Smooth Transition Section 5: Membership & Final Sign Up / Log In CTA */}
        <motion.section
          id="membership"
          initial={{opacity: 0, y: 24}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true, amount: 0.2}}
          transition={{duration: 0.55, ease: EASE_OUT}}
          className="bg-white dark:bg-[#0b101b] py-20"
        >
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Transparent Access Tiers
              </p>
              <h2 className="mt-2 text-balance font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Start free on beginner lessons, upgrade when you go deeper.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Every account begins free with the first 10 beginner lessons and starter Arena
                access across all {totalLanguages} languages ({totalFreeLessons} free lessons).
                Unlock intermediate and advanced lessons anytime with Learning HQ Membership.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-[#f9fafc] dark:bg-[#0f1625] p-6">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    For Beginners Starting Out
                  </p>
                  <h3 className="mt-1 font-display text-xl font-bold text-slate-900 dark:text-white">
                    Free Starter
                  </h3>
                  <p className="mt-4 font-mono text-3xl font-semibold text-slate-900 dark:text-white tabular-nums">
                    ₦0
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Open immediately after sign up
                  </p>
                  <ul className="mt-6 space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>
                        First 10 lessons open free across all {totalLanguages} languages (
                        {totalFreeLessons} lessons)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>All beginner exercises, rapid drills &amp; streak awards</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>Starter Coding Arena challenges &amp; AI Study Guide</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="studio-surface flex flex-col justify-between rounded-2xl border-2 border-blue-600 p-6">
                <div>
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    For Active Learners
                  </p>
                  <h3 className="mt-1 font-display text-xl font-bold text-slate-900 dark:text-white">
                    Monthly Member
                  </h3>
                  <p className="mt-4 font-mono text-3xl font-semibold text-slate-900 dark:text-white tabular-nums">
                    ₦5,000
                    <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                      {' '}
                      / month
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    5 thousand naira billed monthly via Moniepoint
                  </p>
                  <ul className="mt-6 space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                      <span>
                        Unlocks all {totalPaidLessons} intermediate &amp; advanced lessons
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                      <span>Full Mastery Coding Arena challenges</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                      <span>Priority admin verification &amp; email confirmation</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 dark:bg-slate-800/90 p-6 text-white">
                <div>
                  <p className="text-xs font-medium text-slate-300">For Full-Year Mastery</p>
                  <h3 className="mt-1 font-display text-xl font-bold text-white">
                    Yearly Member
                  </h3>
                  <p className="mt-4 font-mono text-3xl font-semibold text-white tabular-nums">
                    ₦60,000
                    <span className="text-sm font-normal text-slate-300"> / year</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-300">
                    ₦5,000 × 12 months = ₦60,000 annual access
                  </p>
                  <ul className="mt-6 space-y-2.5 text-sm text-slate-200">
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span>12 full months of all {totalLanguages} languages &amp; deep tracks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span>All custom lessons &amp; Mastery Arena challenges</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span>Moniepoint: 7062449465 · Enenche Dominion</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Final Scroll Conversion Block */}
            <motion.div
              id="get-started"
              initial={{opacity: 0, y: 18}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, amount: 0.3}}
              transition={{duration: 0.5, ease: EASE_OUT}}
              className="studio-surface mt-14 rounded-2xl border p-8 sm:p-10"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-xl">
                  <h3 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Ready to start writing code across {totalLanguages} languages?
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Create your free student account to receive your welcome email, pick your
                    starting language, and open beginner lessons from scratch.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  {currentUser ? (
                    <button
                      type="button"
                      onClick={onGoToWorkspace}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Continue to Workspace
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={onGoToSignup}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Sign up for free
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={onGoToLogin}
                        className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Already have an account? Log in
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>
      </main>

      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-[#f7f8fb] dark:bg-[#080c14] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center">
          <p className="font-medium text-slate-700 dark:text-slate-300">
            Learning HQ — Structured Lessons, Guided Drills &amp; Coding Arena
          </p>
          <p>Membership Bank: Moniepoint · Account 7062449465 · Enenche Dominion</p>
        </div>
      </footer>
    </div>
  );
}
