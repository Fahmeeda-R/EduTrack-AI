import React, { useEffect, useState } from 'react';
import { useEduTrack } from '../context/EduTrackContext.tsx';

const LOFI_MODES = ['Lofi: Library', 'Lofi: Rain', 'Lofi: Coffee Shop', 'Lofi: Off'];

const WEEKLY_HOURS = [
  { day: 'M', hours: 3.0, height: 60 },
  { day: 'T', hours: 4.0, height: 80 },
  { day: 'W', hours: 3.5, height: 70, isToday: true },
  { day: 'T', hours: 4.2, height: 84 },
  { day: 'F', hours: 2.5, height: 50 },
  { day: 'S', hours: 3.8, height: 76 },
  { day: 'S', hours: 3.0, height: 60 },
];

export const StudyPlannerView: React.FC = () => {
  const {
    studyBlocks,
    toggleStudyBlockDone,
    regenerateStudyPlanAi,
    setActiveScreen,
    showToast,
  } = useEduTrack();

  const [timerActive, setTimerActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [lofiIndex, setLofiIndex] = useState(0);
  const [activeBlockTitle, setActiveBlockTitle] = useState(
    'Operating Systems: Concurrency Block 1'
  );
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!timerActive) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerActive(false);
          showToast('Focus Pomodoro complete! Take a 5m micro-rest.', 'success');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerActive, showToast]);

  const mins = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, '0');
  const secs = (secondsLeft % 60).toString().padStart(2, '0');

  const completedCount = studyBlocks.filter((b) => b.completed).length;
  const readinessScore = Math.min(98, 82 + completedCount * 6);
  const dashOffset = Math.round(251.2 - (251.2 * readinessScore) / 100);

  const handleToggleTimer = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(25 * 60);
      setTimerActive(true);
      return;
    }
    setTimerActive((v) => !v);
  };

  const handleStartBlockPomodoro = (title: string) => {
    setActiveBlockTitle(title);
    setSecondsLeft(25 * 60);
    setTimerActive(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Pomodoro started for "${title}"`, 'info');
  };

  const handleGeneratePlan = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      await regenerateStudyPlanAi();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to optimize study plan';
      showToast(msg, 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="py-5 space-y-5">
      {/* Sync Badge & Title */}
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">sync_saved_locally</span>
            Auto-synced with Academic Calendar
          </span>
          <span>Today · Oct 24</span>
        </div>
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">AI Study Planner</h1>
        <p className="text-xs sm:text-sm text-on-surface-variant">
          Adaptive daily schedules calculated from assignments &amp; upcoming exam dates.
        </p>
      </div>

      {/* Cognitive Readiness + Auto-Generate */}
      <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/25 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 96 96">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-surface-container-highest"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  className="text-primary transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-on-surface tabular-nums">
                  {readinessScore}%
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                Cognitive Readiness
              </span>
              <h2 className="text-lg font-bold text-on-surface">Optimal Prime State</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Recommended: 3.5 Hours Today · {completedCount}/{studyBlocks.length} Completed
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={generating}
            onClick={handleGeneratePlan}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <span
              className={`material-symbols-outlined text-[18px] ${generating ? 'animate-spin' : ''}`}
            >
              {generating ? 'sync' : 'auto_awesome'}
            </span>
            <span>{generating ? 'Generating Plan...' : "Auto-Generate Today's Plan"}</span>
          </button>
        </div>
      </div>

      {/* Pomodoro Focus Engine */}
      <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/25 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined">timer</span>
            </span>
            <div>
              <h2 className="text-base font-bold text-on-surface">Pomodoro Focus Engine</h2>
              <p className="text-xs text-on-surface-variant">25m Work · 5m Micro-rest</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setLofiIndex((i) => (i + 1) % LOFI_MODES.length)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">headphones</span>
            <span>{LOFI_MODES[lofiIndex]}</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-low rounded-xl p-4">
          <div>
            <div className="font-mono text-4xl font-bold text-on-surface tracking-tight tabular-nums">
              {mins}:{secs}
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              {timerActive ? `Focusing on ${activeBlockTitle}` : `Ready for ${activeBlockTitle}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleTimer}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors ${
                timerActive
                  ? 'bg-tertiary-container text-on-tertiary-container'
                  : 'bg-secondary text-on-secondary'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {secondsLeft === 0 ? 'replay' : timerActive ? 'pause' : 'play_arrow'}
              </span>
              <span>
                {secondsLeft === 0 ? 'Restart' : timerActive ? 'Pause' : 'Start Pomodoro'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTimerActive(false);
                setSecondsLeft(25 * 60);
              }}
              className="px-3 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface-variant transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Today's Focus Blocks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-on-surface">Today&apos;s Focus Blocks</h2>
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">
            {studyBlocks.length} Sessions Scheduled
          </span>
        </div>

        <div className="space-y-3">
          {studyBlocks.map((block) => (
            <div
              key={block.id}
              className={`bg-surface-container-lowest rounded-2xl p-4 border shadow-sm transition-all ${
                block.completed
                  ? 'border-outline-variant/20 opacity-75'
                  : 'border-outline-variant/30'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Toggle completion for ${block.title}`}
                    onClick={() => toggleStudyBlockDone(block.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      block.completed
                        ? 'bg-primary border-primary text-on-primary'
                        : 'border-outline hover:border-primary'
                    }`}
                  >
                    {block.completed && (
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    )}
                  </button>
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-bold">
                    {block.priority}
                  </span>
                  <span className="text-xs font-mono text-on-surface-variant">
                    {block.timeRange}
                  </span>
                </div>
                <span className="text-xs font-bold text-primary">{block.durationLabel}</span>
              </div>

              <h3
                className={`text-base font-bold text-on-surface ${
                  block.completed ? 'line-through' : ''
                }`}
              >
                {block.title}
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Session Target: {block.targetText}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-outline-variant/15">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary">
                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                  {block.blockType}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveScreen('my-documents')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]">menu_book</span>
                    Open Notes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartBlockPomodoro(block.title)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[15px]">play_circle</span>
                    Start Pomodoro
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Study Load */}
      <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/25 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-on-surface">Weekly Study Load</h2>
            <p className="text-xs text-on-surface-variant">Optimal balanced threshold: 24 hrs</p>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-bold">
            <span className="material-symbols-outlined text-[15px]">verified</span>
            Safe Load
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 items-end h-28 pt-3">
          {WEEKLY_HOURS.map((bar, idx) => (
            <div key={idx} className="flex flex-col items-center justify-end h-full gap-1.5">
              {bar.isToday && (
                <span className="text-[10px] font-bold text-primary">{bar.hours}h</span>
              )}
              <div
                className={`w-full max-w-[32px] rounded-t-lg transition-all ${
                  bar.isToday ? 'bg-primary' : 'bg-secondary-container/70'
                }`}
                style={{ height: `${bar.height}%` }}
              />
              <span
                className={`text-[11px] font-bold ${
                  bar.isToday ? 'text-primary' : 'text-on-surface-variant'
                }`}
              >
                {bar.day}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-surface-container-low rounded-xl p-3 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-primary text-[18px]">spa</span>
          <span>Friday buffer detected. 1.5h light revision prevents Saturday fatigue.</span>
        </div>
      </div>
    </div>
  );
};
