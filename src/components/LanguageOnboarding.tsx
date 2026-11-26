import {ArrowRight, CheckCircle2, LogOut, Search} from 'lucide-react';
import {motion} from 'motion/react';
import {useMemo, useState} from 'react';
import {PROGRAMMING_LANGUAGES} from '../data/languages';
import type {LanguageCategory, PublicUser} from '../types/learning';
import {ThemeToggle} from './ThemeToggle';

interface LanguageOnboardingProps {
  token: string;
  user: PublicUser;
  isDark: boolean;
  onToggleDark: () => void;
  onLanguageChosen: (updatedUser: PublicUser) => void;
  onLogout: () => void;
}

const CATEGORIES: ('All' | LanguageCategory)[] = [
  'All',
  'Core & Systems',
  'Web & Application',
  'Data & Scientific',
  'Functional & Scripting',
];

export function LanguageOnboarding({
  token,
  user,
  isDark,
  onToggleDark,
  onLanguageChosen,
  onLogout,
}: LanguageOnboardingProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | LanguageCategory>('All');
  const [selectedLangId, setSelectedLangId] = useState<string>('python');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return PROGRAMMING_LANGUAGES.filter((lang) => {
      const catMatch = categoryFilter === 'All' || lang.category === categoryFilter;
      const textMatch =
        !q ||
        lang.name.toLowerCase().includes(q) ||
        lang.paradigm.toLowerCase().includes(q) ||
        lang.tagline.toLowerCase().includes(q) ||
        String(lang.rank) === q;
      return catMatch && textMatch;
    });
  }, [searchQuery, categoryFilter]);

  const selectedLanguage = useMemo(() => {
    return (
      PROGRAMMING_LANGUAGES.find((l) => l.id === selectedLangId) ??
      PROGRAMMING_LANGUAGES[0]
    );
  }, [selectedLangId]);

  const handleConfirm = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({preferredLanguageId: selectedLangId}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not save your language selection.');
        return;
      }
      onLanguageChosen(data.user);
    } catch {
      setError('Network error saving your language choice.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-900 dark:bg-[#080c14] dark:text-slate-100 flex flex-col transition-colors">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0b101b]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0">
            Learning HQ
          </span>

          <div className="flex items-center gap-3 shrink-0">
            <ThemeToggle isDark={isDark} onToggle={onToggleDark} />
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <motion.div
          initial={{opacity: 0, y: 12}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.25, ease: [0.16, 1, 0.3, 1]}}
        >
          <div className="studio-surface flex flex-col gap-6 rounded-2xl border p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                First-Time Setup <span aria-hidden="true">·</span> Choose Your Starting Track
              </p>
              <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
                Welcome, {user.name}. Choose your starting language.
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Pick any of our {PROGRAMMING_LANGUAGES.length} languages and web technologies below.
                Every track starts right from &ldquo;Hello, World!&rdquo;, and your progress is
                saved automatically so you can resume anytime.
              </p>
            </div>

            <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
              <button
                type="button"
                disabled={saving}
                onClick={handleConfirm}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>
                  {saving ? 'Saving Track...' : `Start Learning ${selectedLanguage.name}`}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selected:{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedLanguage.name}
                </span>{' '}
                ({selectedLanguage.fileExt})
              </p>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 px-4 py-3 text-xs font-medium text-red-700 dark:text-red-300"
            >
              {error}
            </p>
          )}

          {/* Filter Toolbar */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-200/70 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat === 'All' ? `All ${PROGRAMMING_LANGUAGES.length} Languages` : cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Python, HTML, ABAP, SQL..."
                aria-label={`Search ${PROGRAMMING_LANGUAGES.length} programming languages`}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* 50-Language Grid */}
          <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {filteredLanguages.map((lang) => {
              const isSelected = lang.id === selectedLangId;
              return (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setSelectedLangId(lang.id)}
                  className={`flex flex-col justify-between rounded-xl border p-5 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 dark:border-blue-500 dark:bg-blue-950/50'
                      : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0e1422] hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono font-semibold text-slate-400 dark:text-slate-500 tabular-nums">
                        {String(lang.rank).padStart(2, '0')} · {lang.fileExt}
                      </span>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-300">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Selected
                        </span>
                      )}
                    </div>

                    <h2 className="mt-2 font-display text-base font-bold text-slate-900 dark:text-white">
                      {lang.name}
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {lang.tagline}
                    </p>
                  </div>

                  <p className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {lang.category} <span aria-hidden="true">·</span> 10 Free Lessons
                  </p>
                </button>
              );
            })}
          </div>

          {filteredLanguages.length === 0 && (
            <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No programming languages matched your search.
            </p>
          )}
        </motion.div>
      </main>
    </div>
  );
}
