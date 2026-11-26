import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  Play,
  RotateCcw,
} from 'lucide-react';
import {useEffect, useMemo, useRef, useState} from 'react';
import type {DrillItem, ProgrammingLanguage} from '../types/learning';

interface DrillSessionProps {
  language: ProgrammingLanguage;
  completedDrills: string[];
  savedDrillAnswers: Record<string, number>;
  nextLanguageName: string;
  onVerifyCorrect: (drillId: string, selectedOption: number) => Promise<void>;
  onContinueToArena: () => void;
  onNextLanguageDrills: () => void;
  onBackToLessons: () => void;
}

function formatTimer(secs: number): string {
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export function DrillSession({
  language,
  completedDrills,
  savedDrillAnswers,
  nextLanguageName,
  onVerifyCorrect,
  onContinueToArena,
  onNextLanguageDrills,
  onBackToLessons,
}: DrillSessionProps) {
  const section1Drills = useMemo(
    () => language.drills.filter((d) => d.section === 1),
    [language]
  );
  const section2Drills = useMemo(
    () => language.drills.filter((d) => d.section === 2),
    [language]
  );

  // Determine initial section (if section 1 already finished previously and section 2 is incomplete, open section 2; otherwise 1)
  const initialSection: 1 | 2 = useMemo(() => {
    const s1Done =
      section1Drills.length > 0 &&
      section1Drills.every((d) => completedDrills.includes(d.id));
    const s2Done =
      section2Drills.length > 0 &&
      section2Drills.every((d) => completedDrills.includes(d.id));
    if (s1Done && !s2Done) return 2;
    return 1;
  }, [language.id]);

  const [activeSection, setActiveSection] = useState<1 | 2>(initialSection);
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedbackState, setFeedbackState] = useState<'idle' | 'wrong' | 'verified'>('idle');
  const [sectionCompleted, setSectionCompleted] = useState<boolean>(false);

  // Readiness confirmation modal — timer NEVER runs while showReadyPrompt is true
  const [showReadyPrompt, setShowReadyPrompt] = useState<boolean>(true);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [drillSeconds, setDrillSeconds] = useState<number>(0);
  const [replayingSection, setReplayingSection] = useState<boolean>(false);

  const advanceTimeoutRef = useRef<number | null>(null);

  const sectionDrills: DrillItem[] =
    activeSection === 1 ? section1Drills : section2Drills;

  // Reset when switching programming language
  useEffect(() => {
    if (advanceTimeoutRef.current) {
      window.clearTimeout(advanceTimeoutRef.current);
    }
    setActiveSection(initialSection);
    setQuestionIndex(0);
    setSelectedOption(null);
    setFeedbackState('idle');
    setSectionCompleted(false);
    setShowReadyPrompt(true);
    setTimerRunning(false);
    setDrillSeconds(0);
    setReplayingSection(false);
  }, [language.id, initialSection]);

  // Tick timer ONLY when user chose Yes (timerRunning === true) and section isn't done
  useEffect(() => {
    if (!timerRunning || showReadyPrompt || sectionCompleted) return;
    const id = window.setInterval(() => {
      setDrillSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning, showReadyPrompt, sectionCompleted]);

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current) {
        window.clearTimeout(advanceTimeoutRef.current);
      }
    };
  }, []);

  const currentDrill = sectionDrills[questionIndex] ?? sectionDrills[0];

  const handleStartDrill = () => {
    if (advanceTimeoutRef.current) {
      window.clearTimeout(advanceTimeoutRef.current);
    }
    // Find first incomplete question in this section unless replaying
    const allAlreadyDone =
      sectionDrills.length > 0 &&
      sectionDrills.every((d) => completedDrills.includes(d.id));

    if (allAlreadyDone && !replayingSection) {
      setSectionCompleted(true);
      setShowReadyPrompt(false);
      setTimerRunning(false);
      return;
    }

    const firstPendingIdx = replayingSection
      ? 0
      : Math.max(
          0,
          sectionDrills.findIndex((d) => !completedDrills.includes(d.id))
        );

    setQuestionIndex(firstPendingIdx);
    const q = sectionDrills[firstPendingIdx];
    const savedChoice = q ? savedDrillAnswers[q.id] : undefined;
    setSelectedOption(typeof savedChoice === 'number' && !replayingSection ? savedChoice : null);
    setFeedbackState('idle');
    setSectionCompleted(false);
    setShowReadyPrompt(false);
    setDrillSeconds(0);
    setTimerRunning(true);
  };

  const advanceToNextQuestion = () => {
    if (advanceTimeoutRef.current) {
      window.clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }

    if (questionIndex < sectionDrills.length - 1) {
      const nextIdx = questionIndex + 1;
      setQuestionIndex(nextIdx);
      const nextQ = sectionDrills[nextIdx];
      const savedChoice = nextQ ? savedDrillAnswers[nextQ.id] : undefined;
      setSelectedOption(
        typeof savedChoice === 'number' && !replayingSection ? savedChoice : null
      );
      setFeedbackState('idle');
    } else {
      setSectionCompleted(true);
      setTimerRunning(false);
      setReplayingSection(false);
    }
  };

  const handleVerifyAnswer = async () => {
    if (!currentDrill || selectedOption === null || feedbackState === 'verified') return;

    if (selectedOption === currentDrill.correctIndex) {
      setFeedbackState('verified');
      await onVerifyCorrect(currentDrill.id, selectedOption);
      advanceTimeoutRef.current = window.setTimeout(() => {
        advanceToNextQuestion();
      }, 1100);
    } else {
      setFeedbackState('wrong');
    }
  };

  const switchSection = (sec: 1 | 2, replay = false) => {
    if (advanceTimeoutRef.current) {
      window.clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
    setActiveSection(sec);
    setQuestionIndex(0);
    setSelectedOption(null);
    setFeedbackState('idle');
    setSectionCompleted(false);
    setTimerRunning(false);
    setDrillSeconds(0);
    setReplayingSection(replay);
    setShowReadyPrompt(true);
  };

  const totalCompletedInLang = language.drills.filter((d) =>
    completedDrills.includes(d.id)
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Drill Header & Section Switcher */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {language.name} <span aria-hidden="true">·</span> Practice Drills
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-white">
            {language.name} Rapid Drills
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Verify each answer to progress through the section (+30 XP per drill).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-xs font-medium text-slate-600 dark:text-slate-400 tabular-nums">
            {totalCompletedInLang} / {language.drills.length} completed
          </p>

          <div
            className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 font-mono text-xs tabular-nums ${
              timerRunning
                ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>{formatTimer(drillSeconds)}</span>
            <span className="text-[11px] opacity-75">
              {timerRunning ? 'Active' : 'Paused'}
            </span>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {([1, 2] as const).map((sec) => {
          const drillsInSec = sec === 1 ? section1Drills : section2Drills;
          const doneCount = drillsInSec.filter((d) =>
            completedDrills.includes(d.id)
          ).length;
          const allSecDone =
            drillsInSec.length > 0 && doneCount === drillsInSec.length;

          return (
            <button
              key={sec}
              type="button"
              onClick={() => switchSection(sec, allSecDone)}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                activeSection === sec
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {allSecDone && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              )}
              <span>
                Section {sec}: {sec === 1 ? 'Core Syntax & Output' : 'Applied Logic & Patterns'}
              </span>
              <span className="font-mono text-[11px] opacity-75 tabular-nums">
                ({doneCount}/{drillsInSec.length})
              </span>
            </button>
          );
        })}
      </div>

      {/* Readiness Explanation Popup Modal (Shown BEFORE timer starts) */}
      {showReadyPrompt && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="drill-ready-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
        >
          <div className="studio-surface w-full max-w-lg rounded-2xl border p-7">
            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
              <Layers className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wide">
                {language.name} · Section {activeSection} Briefing
              </span>
            </div>

            <h2
              id="drill-ready-title"
              className="mt-3 font-display text-2xl font-bold text-slate-900 dark:text-white"
            >
              What is a Drill? Are you ready to start?
            </h2>

            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                A <strong className="text-slate-900 dark:text-white">Drill</strong> is a focused
                check-in with {sectionDrills.length} quick questions that sharpen how fast you read{' '}
                {language.name} code, recall keywords, and spot syntax bugs.
              </p>
              <ul className="space-y-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-xs text-slate-700 dark:text-slate-300">
                <li>1. No timer has started yet—take a moment to get comfortable.</li>
                <li>
                  2. Once you choose <strong className="text-slate-900 dark:text-white">Yes</strong>,
                  the timer starts and Question 1 appears.
                </li>
                <li>
                  3. Select an answer and click <strong className="text-slate-900 dark:text-white">Verify Answer</strong>.
                  Once verified correct, the next question comes up automatically.
                </li>
              </ul>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
              <button
                type="button"
                onClick={onBackToLessons}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Not Yet, Back to Lessons</span>
              </button>
              <button
                type="button"
                onClick={handleStartDrill}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Yes, Start Drill Section {activeSection}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Waiting Card behind modal before user clicks Yes */}
      {showReadyPrompt && (
        <div className="studio-surface rounded-2xl border p-8 text-center">
          <p className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Section {activeSection}: {activeSection === 1 ? 'Core Syntax & Output' : 'Applied Logic & Patterns'}
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Timer is paused at <span className="font-mono font-semibold">00:00</span>. Confirm
            when you are ready to begin.
          </p>
          <button
            type="button"
            onClick={() => setShowReadyPrompt(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Open Drill Briefing</span>
          </button>
        </div>
      )}

      {/* Section Completed Summary + NEXT Button to Continue */}
      {!showReadyPrompt && sectionCompleted && (
        <div className="studio-surface rounded-2xl border border-emerald-200 dark:border-emerald-800 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            Section {activeSection} Completed
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold text-slate-900 dark:text-white">
            All {sectionDrills.length} questions verified in {language.name}!
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">
            Your progress and XP have been saved to your account.
            {drillSeconds > 0 && (
              <>
                {' '}
                Section time:{' '}
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {formatTimer(drillSeconds)}
                </span>
                .
              </>
            )}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => switchSection(activeSection, true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retry Section {activeSection}</span>
            </button>

            {activeSection === 1 ? (
              <button
                type="button"
                onClick={() => switchSection(2, false)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <span>Next: Continue to Drill Section 2</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onContinueToArena}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <span>Next: Continue to Coding Arena</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={onNextLanguageDrills}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-5 py-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950 transition-colors cursor-pointer"
                >
                  <span>Next Language Drills ({nextLanguageName})</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Active Single-Question Drill Card */}
      {!showReadyPrompt && !sectionCompleted && currentDrill && (
        <div className="studio-surface rounded-2xl border p-6 sm:p-8">
          {/* Progress Steps inside Section */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {currentDrill.sectionTitle} <span aria-hidden="true">·</span> Question{' '}
              {questionIndex + 1} of {sectionDrills.length}
            </span>

            <div className="flex items-center gap-1.5">
              {sectionDrills.map((d, idx) => {
                const done = completedDrills.includes(d.id);
                const isCurrent = idx === questionIndex;
                return (
                  <span
                    key={d.id}
                    className={`rounded-md px-2.5 py-1 font-mono text-[11px] font-semibold tabular-nums ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : done
                          ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Q{idx + 1}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              {currentDrill.type === 'output'
                ? 'Output Prediction'
                : currentDrill.type === 'fill-blank'
                  ? 'Syntax Fill-in'
                  : 'Bug Spotter'}
            </span>
            {completedDrills.includes(currentDrill.id) && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Previously Verified
              </span>
            )}
          </div>

          <h2 className="mt-2 font-display text-xl font-bold text-slate-900 dark:text-white">
            {currentDrill.title}
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
            {currentDrill.prompt}
          </p>

          <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100">
            <code>{currentDrill.codeSnippet}</code>
          </pre>

          <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {currentDrill.options.map((opt, optIdx) => {
              const isPicked = selectedOption === optIdx;
              const showRight =
                feedbackState === 'verified' && optIdx === currentDrill.correctIndex;
              const showWrong =
                feedbackState === 'wrong' && isPicked && optIdx !== currentDrill.correctIndex;

              return (
                <button
                  key={optIdx}
                  type="button"
                  disabled={feedbackState === 'verified'}
                  onClick={() => {
                    setSelectedOption(optIdx);
                    if (feedbackState === 'wrong') {
                      setFeedbackState('idle');
                    }
                  }}
                  className={`rounded-xl border px-4 py-3 text-left font-mono text-xs transition-colors cursor-pointer ${
                    showRight
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-semibold'
                      : showWrong
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-200'
                        : isPicked
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 font-semibold'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={selectedOption === null || feedbackState === 'verified'}
                onClick={handleVerifyAnswer}
                className="rounded-lg bg-slate-900 dark:bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 dark:hover:bg-blue-500 disabled:opacity-40 transition-colors cursor-pointer"
              >
                Verify Answer
              </button>

              {feedbackState === 'verified' && (
                <button
                  type="button"
                  onClick={advanceToNextQuestion}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  <span>
                    {questionIndex < sectionDrills.length - 1
                      ? 'Next Question'
                      : 'Finish Section'}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {feedbackState === 'verified' && (
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Verified (+30 XP): {currentDrill.explanation}
              </p>
            )}
            {feedbackState === 'wrong' && (
              <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                Not quite — review the snippet and try another option.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
