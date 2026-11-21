import React, { useState } from 'react';
import { useEduTrack } from '../context/EduTrackContext.tsx';

export const DashboardView: React.FC = () => {
  const {
    userProfile,
    assignments,
    announcements,
    setActiveScreen,
    openAssignmentSubmission,
    updateAssignment,
    addStudyBlock,
    showToast,
  } = useEduTrack();

  const [flashcardOpen, setFlashcardOpen] = useState(false);
  const [cardIdx, setCardIdx] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);

  const flashcards = [
    {
      course: 'Operating Systems',
      front: 'What are the 4 Coffman conditions required for a deadlock?',
      back: '1. Mutual Exclusion, 2. Hold and Wait, 3. No Preemption, 4. Circular Wait.',
    },
    {
      course: 'DBMS',
      front: 'When is a relation in Boyce-Codd Normal Form (BCNF)?',
      back: 'For every non-trivial functional dependency X → Y, X must be a superkey.',
    },
    {
      course: 'Data Structures',
      front: 'What is the worst-case time complexity of AVL tree search, insertion, and deletion?',
      back: 'O(log n), guaranteed by height-balance factor ∈ {-1, 0, +1} via single/double rotations.',
    },
  ];

  const totalCount = assignments.length;
  const completedCount = assignments.filter(
    (a) => a.status === 'graded' || a.status === 'submitted'
  ).length;
  const pendingCount = totalCount - completedCount;
  const urgentCount = assignments.filter(
    (a) => a.priority === 'Urgent' && a.status !== 'graded' && a.status !== 'submitted'
  ).length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const firstName = userProfile.displayName.split(' ')[0] || 'Elena';

  const toggleTaskDone = async (id: number, currentlyDone: boolean) => {
    await updateAssignment(id, {
      status: currentlyDone ? 'in_progress' : 'graded',
      progress: currentlyDone ? 50 : 100,
    });
    showToast(currentlyDone ? 'Task reopened' : 'Task marked complete!', 'success');
  };

  const handleAddAiSuggestionToPlan = async () => {
    await addStudyBlock({
      title: 'Deep Focus: Operating Systems Process Synchronization Lab',
      course: 'Operating Systems',
      priority: 'High Priority',
      timeRange: '03:00 PM – 05:00 PM',
      durationLabel: '120 min',
      targetText: 'Complete mutex lock hierarchy & Valgrind concurrency profile',
      blockType: 'Library Hub',
    });
    setActiveScreen('ai-study-planner');
  };

  return (
    <div className="py-5 space-y-6">
      {/* Greeting Banner */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-5 shadow-sm">
        <div className="absolute -right-10 -bottom-10 w-36 h-36 rounded-full bg-secondary-container/20 blur-2xl pointer-events-none" />
        <div className="flex items-start justify-between relative z-10 gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed text-[11px] font-semibold mb-1.5">
              Fall Term 2024
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              Good Morning, {firstName}!
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1 flex items-center gap-1.5 flex-wrap">
              <span>{userProfile.department}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-primary">
                {pendingCount} active tasks remaining
              </span>
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-[24px]">school</span>
          </div>
        </div>
      </div>

      {/* Student Support Hub Quick Access Banner */}
      <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[22px]">support_agent</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-on-surface">Student Support &amp; AI Helpdesk</h2>
              <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-700 text-[10px] font-bold">
                Online
              </span>
            </div>
            <p className="text-xs text-on-surface-variant truncate mt-0.5">
              Tuition fee payments, course registration, attendance rules, transcripts &amp; FAQs
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActiveScreen('support-chatbot')}
          className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition-opacity shadow-xs cursor-pointer flex-shrink-0"
        >
          <span>Open Support Hub</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>

      {/* Metrics Grid (2 cols mobile, 4 cols desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setActiveScreen('assignments')}
          className="text-left bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col justify-between hover:bg-surface-container-low/60 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">menu_book</span>
            </span>
            <span className="text-[11px] font-semibold text-on-surface-variant">Active Term</span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-on-surface leading-none tabular-nums">
              {totalCount}
            </div>
            <div className="text-xs font-semibold text-on-surface-variant mt-1">Total Tasks</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveScreen('assignments')}
          className="text-left bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col justify-between hover:bg-surface-container-low/60 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-lg bg-secondary-container/30 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[10px] font-bold">
              {urgentCount} Urgent
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-primary leading-none tabular-nums">
              {pendingCount}
            </div>
            <div className="text-xs font-semibold text-on-surface-variant mt-1">Pending</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveScreen('assignments')}
          className="text-left bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col justify-between hover:bg-surface-container-low/60 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[18px] material-symbols-filled">
                check_circle
              </span>
            </span>
            <span className="text-[11px] font-semibold text-secondary tabular-nums">
              {progressPct}% Done
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-on-surface leading-none tabular-nums">
              {completedCount}
            </div>
            <div className="text-xs font-semibold text-on-surface-variant mt-1">Completed</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveScreen('calendar')}
          className="text-left bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col justify-between hover:bg-surface-container-low/60 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
              <span className="material-symbols-outlined text-[18px]">alarm</span>
            </span>
            <span className="text-[11px] font-bold text-primary">&lt; 48 hrs</span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-primary leading-none tabular-nums">
              {Math.max(1, urgentCount + 1)}
            </div>
            <div className="text-xs font-semibold text-on-surface-variant mt-1">Closing Soon</div>
          </div>
        </button>
      </div>

      {/* Semester Academic Progress */}
      <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-on-surface">Semester Academic Progress</h2>
            <p className="text-xs text-on-surface-variant">
              {completedCount} of {totalCount} tasks fulfilled
            </p>
          </div>
          <span className="text-lg font-bold text-primary tabular-nums">{progressPct}%</span>
        </div>
        <div className="relative pt-1 pb-5">
          <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-secondary to-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="absolute left-[45%] top-0 flex flex-col items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm" />
            <span className="text-[10px] font-semibold text-on-surface-variant mt-2">Midterm</span>
          </div>
          <div className="absolute right-[10%] top-0 flex flex-col items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
            <span className="text-[10px] font-semibold text-on-surface-variant mt-2">Finals</span>
          </div>
        </div>
      </div>

      {/* Desktop 2-Column Split: AI Study Suggestion + Critical Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* AI Contextual Study Suggestion */}
        <div className="lg:col-span-7 bg-surface-container-low rounded-xl p-5 shadow-sm flex flex-col justify-between border border-outline-variant/20">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                <span className="material-symbols-outlined text-[15px] material-symbols-filled">
                  auto_awesome
                </span>
                <span>AI Study Suggestion · High Priority</span>
              </div>
              <span className="font-mono text-xs text-on-surface-variant font-semibold">
                96% fit
              </span>
            </div>
            <p className="text-sm text-on-surface leading-relaxed mt-2">
              Prioritize{' '}
              <span className="font-semibold text-primary">
                Operating Systems: Process Synchronization Lab
              </span>{' '}
              submission. Based on your Google Calendar sync, you have an open{' '}
              <span className="font-semibold">2-hour window today at 3:00 PM</span>.
            </p>
            <div className="mt-3 p-3 bg-surface-container-lowest rounded-lg flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-[20px] text-secondary">
                  schedule
                </span>
                <span className="text-xs font-semibold text-on-surface truncate">
                  Free Slot: 3:00 PM - 5:00 PM
                </span>
              </div>
              <span className="text-[11px] font-semibold bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded">
                Library Hub
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 mt-4">
            <button
              type="button"
              onClick={handleAddAiSuggestionToPlan}
              className="flex-1 h-11 px-4 rounded-lg bg-primary text-on-primary text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:bg-primary-container transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">playlist_add</span>
              <span>Add to Plan</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveScreen('ai-assistant')}
              className="h-11 px-4 rounded-lg bg-surface-container-lowest text-on-surface-variant text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">forum</span>
              <span>Ask Tutor</span>
            </button>
          </div>
        </div>

        {/* Critical Deadlines */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-surface-container-lowest rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-on-surface">Critical Deadlines</h2>
            <button
              type="button"
              onClick={() => setActiveScreen('calendar')}
              className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline"
            >
              <span className="material-symbols-outlined text-[16px]">sync</span>
              <span>Calendar Sync</span>
            </button>
          </div>
          <div className="space-y-2.5 flex-1">
            {assignments
              .filter((a) => a.status !== 'graded' && a.status !== 'submitted')
              .slice(0, 3)
              .map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => openAssignmentSubmission(a.id)}
                  className="w-full text-left bg-surface-container-low hover:bg-surface-container p-3 rounded-xl transition-colors flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        a.priority === 'Urgent'
                          ? 'bg-error-container text-on-error-container'
                          : 'bg-secondary-fixed text-on-secondary-fixed-variant'
                      }`}
                    >
                      {a.dueLabel}
                    </span>
                    <span className="font-mono text-[11px] text-primary font-bold">
                      {a.course}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-on-surface truncate">{a.title}</p>
                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                    <span>Weight: {a.weight}%</span>
                    <span className="font-semibold text-primary">Open Submission →</span>
                  </div>
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Latest Assignments & Campus Bulletins */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-on-surface">Latest Assignments</h2>
              <p className="text-xs text-on-surface-variant">Track status & submissions</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveScreen('assignments')}
              className="text-sm font-semibold text-primary flex items-center gap-1 hover:underline"
            >
              <span>View All ({totalCount})</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>

          <div className="space-y-3">
            {assignments.slice(0, 4).map((item) => {
              const isDone = item.status === 'graded' || item.status === 'submitted';
              return (
                <div
                  key={item.id}
                  className={`bg-surface-container-lowest p-4 rounded-xl shadow-sm space-y-2.5 ${
                    isDone ? 'opacity-90' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        type="button"
                        aria-label={`Mark ${item.title} complete`}
                        onClick={() => toggleTaskDone(item.id, isDone)}
                        className={`w-6 h-6 mt-0.5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                          isDone
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container text-transparent hover:text-outline'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[17px]">check</span>
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              item.priority === 'Urgent'
                                ? 'bg-error-container text-on-error-container'
                                : 'bg-secondary-fixed text-on-secondary-fixed-variant'
                            }`}
                          >
                            {item.priority}
                          </span>
                          <span className="font-mono text-xs text-secondary font-semibold">
                            {item.course}
                          </span>
                        </div>
                        <h3
                          className={`text-sm font-semibold text-on-surface mt-1 ${
                            isDone ? 'line-through' : ''
                          }`}
                        >
                          {item.title}
                        </h3>
                        <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px] text-primary">
                            event
                          </span>
                          <span>{item.dueLabel}</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary flex-shrink-0 tabular-nums">
                      {item.gradeScore ? `${item.gradeScore}%` : `${item.progress}%`}
                    </span>
                  </div>

                  {!isDone && (
                    <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[11px] text-on-surface-variant">{item.milestoneText}</span>
                    <button
                      type="button"
                      onClick={() => openAssignmentSubmission(item.id)}
                      className="text-xs font-semibold text-primary flex items-center gap-0.5 hover:underline"
                    >
                      <span>{isDone ? 'Review' : 'Continue'}</span>
                      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Campus Bulletins + Spaced Repetition */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[20px] text-primary">campaign</span>
              <h2 className="text-lg font-bold text-on-surface">Campus Bulletins</h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveScreen('announcements')}
              className="text-sm font-semibold text-primary hover:underline"
            >
              All Updates
            </button>
          </div>

          <div className="space-y-3">
            {announcements.slice(0, 2).map((ann) => (
              <div
                key={ann.id}
                className="bg-surface-container-lowest p-4 rounded-xl shadow-sm space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-primary font-semibold uppercase tracking-wider">
                    {ann.author}
                  </span>
                  <span className="text-xs text-on-surface-variant">{ann.dateLabel.split('·')[0]}</span>
                </div>
                <h3 className="text-sm font-semibold text-on-surface">{ann.title}</h3>
                <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                  {ann.body}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveScreen('announcements')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline pt-1"
                >
                  <span>Read Full Bulletin</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_outward</span>
                </button>
              </div>
            ))}
          </div>

          {/* Spaced Repetition Quick Card */}
          <div className="bg-surface-container-low rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-secondary-container/40 flex items-center justify-center text-primary flex-shrink-0">
              <span className="material-symbols-outlined text-[20px]">psychology</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-on-surface truncate">
                Spaced Repetition Active
              </p>
              <p className="text-xs text-on-surface-variant truncate">
                3 flashcard decks queued for OS, DBMS & Data Structures tonight.
              </p>
            </div>
            <button
              type="button"
              aria-label="Review flashcards"
              onClick={() => {
                setCardFlipped(false);
                setFlashcardOpen(true);
              }}
              className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm hover:bg-surface-container transition-colors flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* Flashcard Review Modal */}
      {flashcardOpen && (
        <div
          onClick={() => setFlashcardOpen(false)}
          className="fixed inset-0 z-50 bg-inverse-surface/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-container-lowest rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-primary uppercase">
                {flashcards[cardIdx].course} · Card {cardIdx + 1}/{flashcards.length}
              </span>
              <button
                type="button"
                onClick={() => setFlashcardOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setCardFlipped((v) => !v)}
              className="w-full min-h-[150px] p-5 rounded-xl bg-surface-container-low text-left flex flex-col justify-between transition-colors hover:bg-surface-container"
            >
              <span className="text-[11px] font-bold uppercase text-secondary">
                {cardFlipped ? 'Answer' : 'Prompt (Tap to Reveal)'}
              </span>
              <p className="text-base font-semibold text-on-surface my-3">
                {cardFlipped ? flashcards[cardIdx].back : flashcards[cardIdx].front}
              </p>
              <span className="text-xs text-primary font-semibold">
                {cardFlipped ? 'Tap to show question' : 'Tap to flip'}
              </span>
            </button>
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setCardFlipped(false);
                  setCardIdx((i) => (i - 1 + flashcards.length) % flashcards.length);
                }}
                className="px-4 h-10 rounded-lg bg-surface-container text-on-surface text-xs font-semibold"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => {
                  setCardFlipped(false);
                  setCardIdx((i) => (i + 1) % flashcards.length);
                }}
                className="px-4 h-10 rounded-lg bg-primary text-on-primary text-xs font-semibold"
              >
                Next Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
