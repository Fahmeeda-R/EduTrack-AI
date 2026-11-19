import React, { useMemo, useState } from 'react';
import { useEduTrack } from '../context/EduTrackContext.tsx';

const COURSES = [
  'All',
  'Pending',
  'Data Structures',
  'Web Technologies',
  'Java',
  'Python',
  'Operating Systems',
  'English',
  'DBMS',
];

export const AssignmentsView: React.FC = () => {
  const {
    assignments,
    openAssignmentSubmission,
    createAssignment,
    setActiveScreen,
    showToast,
  } = useEduTrack();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'due' | 'weight' | 'priority'>('due');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // New Task Form
  const [newTitle, setNewTitle] = useState('');
  const [newCourse, setNewCourse] = useState('Operating Systems');
  const [newDueDate, setNewDueDate] = useState('2024-10-28');
  const [newWeight, setNewWeight] = useState('15');
  const [newPriority, setNewPriority] = useState('High');
  const [aiBreakdown, setAiBreakdown] = useState(true);

  const pendingCount = assignments.filter(
    (a) => a.status !== 'graded' && a.status !== 'submitted'
  ).length;
  const urgentCount = assignments.filter(
    (a) => a.priority === 'Urgent' && a.status !== 'graded' && a.status !== 'submitted'
  ).length;
  const doneCount = assignments.filter(
    (a) => a.status === 'graded' || a.status === 'submitted'
  ).length;

  const filteredAssignments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list = assignments.filter((a) => {
      const matchesSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.course.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (selectedFilter === 'All') return true;
      if (selectedFilter === 'Pending') {
        return a.status !== 'graded' && a.status !== 'submitted';
      }
      return a.course === selectedFilter;
    });

    const priorityRank: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Normal: 3 };
    return [...list].sort((a, b) => {
      if (sortBy === 'weight') return b.weight - a.weight;
      if (sortBy === 'priority') return (priorityRank[a.priority] ?? 3) - (priorityRank[b.priority] ?? 3);
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [assignments, searchQuery, selectedFilter, sortBy]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await createAssignment({
      title: newTitle.trim(),
      course: newCourse,
      dueDate: newDueDate,
      dueLabel: newDueDate,
      priority: newPriority,
      weight: Number(newWeight) || 15,
      guidelines: aiBreakdown
        ? 'AI Milestone Breakdown enabled: Phase 1 Architecture, Phase 2 Implementation, Phase 3 Benchmark Verification.'
        : 'Follow syllabus deliverables.',
    });
    setNewTitle('');
    setDrawerOpen(false);
  };

  return (
    <div className="py-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Assignment Hub</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Track, filter, and prioritize coursework
          </p>
        </div>
        <button
          type="button"
          aria-label="Open AI Study Planner"
          onClick={() => setActiveScreen('ai-study-planner')}
          className="w-11 h-11 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed shadow-sm hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[20px] material-symbols-filled">
            auto_awesome
          </span>
        </button>
      </div>

      {/* Telemetry Stats Row */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-surface-container-low rounded-xl p-3.5 shadow-sm">
          <span className="text-[11px] font-bold text-secondary">Week</span>
          <div className="text-2xl font-bold text-on-surface mt-1 tabular-nums">{pendingCount}</div>
          <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
            Due Soon
          </span>
        </div>
        <div className="bg-error-container/50 rounded-xl p-3.5 shadow-sm">
          <span className="text-[11px] font-bold text-error">Alert</span>
          <div className="text-2xl font-bold text-error mt-1 tabular-nums">{urgentCount}</div>
          <span className="font-mono text-[10px] text-error uppercase tracking-wider font-semibold">
            Urgent
          </span>
        </div>
        <div className="bg-surface-container-low rounded-xl p-3.5 shadow-sm">
          <span className="text-[11px] font-bold text-tertiary">Term</span>
          <div className="text-2xl font-bold text-on-surface mt-1 tabular-nums">{doneCount}</div>
          <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
            Done
          </span>
        </div>
      </div>

      {/* Action Row */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex-1 h-11 bg-primary text-on-primary rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:bg-primary-container transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>New Task</span>
        </button>
        <button
          type="button"
          onClick={() =>
            setSortBy((prev) =>
              prev === 'due' ? 'priority' : prev === 'priority' ? 'weight' : 'due'
            )
          }
          className="h-11 px-4 bg-surface-container-lowest text-on-surface rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-[18px] text-primary">swap_vert</span>
          <span>
            Sort: {sortBy === 'due' ? 'Due Date' : sortBy === 'priority' ? 'Priority' : 'Weight'}
          </span>
        </button>
      </div>

      {/* Search & Filter Chips */}
      <div className="space-y-3">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assignments, courses, tags..."
            className="w-full h-11 pl-10 pr-10 bg-surface-container-lowest text-on-surface placeholder:text-outline text-sm rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {COURSES.map((course) => {
            const active = selectedFilter === course;
            return (
              <button
                key={course}
                type="button"
                onClick={() => setSelectedFilter(course)}
                className={`flex-shrink-0 h-8 px-3.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container shadow-sm'
                }`}
              >
                {course}
                {course === 'All' && ` (${assignments.length})`}
                {course === 'Pending' && ` (${pendingCount})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Planner Insight Banner */}
      <div className="bg-surface-container p-3.5 rounded-xl flex items-start gap-3 shadow-sm">
        <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-[18px]">psychology</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
              Tutor AI Scheduling Tip
            </span>
            <span className="font-mono text-[10px] text-tertiary">98% match</span>
          </div>
          <p className="text-xs text-on-surface mt-0.5">
            Dedicate 90 min tonight to finish{' '}
            <strong className="font-semibold text-secondary">
              Operating Systems: Distributed Process Synchronization
            </strong>{' '}
            to keep tomorrow stress-free.
          </p>
        </div>
      </div>

      {/* Assignment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredAssignments.map((item) => {
          const isGraded = item.status === 'graded';
          const isSubmitted = item.status === 'submitted';
          return (
            <div
              key={item.id}
              className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col justify-between gap-3"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-mono text-[11px] font-bold">
                        {item.course}
                      </span>
                      {item.priority === 'Urgent' && !isGraded && !isSubmitted && (
                        <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[11px] font-bold flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[13px]">alarm</span>
                          Urgent
                        </span>
                      )}
                      {isSubmitted && (
                        <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-semibold">
                          Submitted
                        </span>
                      )}
                      {isGraded && (
                        <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-bold">
                          Grade: {item.gradeLetter || 'A'} ({item.gradeScore ?? 96}%)
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-on-surface mt-1.5 leading-snug">
                      {item.title}
                    </h2>
                    <p className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>

                  {item.thumbnailUrl ? (
                    <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container">
                      <img
                        alt={item.course}
                        src={item.thumbnailUrl}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : isGraded ? (
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-mono font-bold text-sm">
                      {item.gradeScore ?? 96}
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-surface-container text-primary flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[20px]">assignment</span>
                    </div>
                  )}
                </div>

                <div className="bg-surface-container-low rounded-lg p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`material-symbols-outlined text-[16px] ${
                        item.priority === 'Urgent' && !isGraded ? 'text-error' : 'text-secondary'
                      }`}
                    >
                      {isGraded ? 'check_circle' : 'event'}
                    </span>
                    <span
                      className={`font-semibold truncate ${
                        item.priority === 'Urgent' && !isGraded
                          ? 'text-error'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      {item.dueLabel}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-on-surface-variant flex-shrink-0">
                    {item.weight}% Weight
                  </span>
                </div>

                {!isGraded && !isSubmitted && item.progress > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-on-surface-variant font-medium">
                        {item.milestoneText || 'Progress'}
                      </span>
                      <span className="font-mono text-primary font-bold">{item.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                {isGraded ? (
                  <button
                    type="button"
                    onClick={() => openAssignmentSubmission(item.id)}
                    className="w-full h-10 rounded-lg bg-surface-container text-on-surface text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-surface-container-high transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      assessment
                    </span>
                    <span>Review Rubric & AI Breakdown</span>
                  </button>
                ) : isSubmitted ? (
                  <button
                    type="button"
                    onClick={() => openAssignmentSubmission(item.id)}
                    className="w-full h-10 rounded-lg bg-surface-container text-on-surface text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-surface-container-high transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px] text-tertiary">
                      rate_review
                    </span>
                    <span>View Submission & Feedback</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => openAssignmentSubmission(item.id)}
                      className="flex-1 h-10 rounded-lg bg-surface-container text-on-surface text-xs font-semibold flex items-center justify-center gap-1 hover:bg-surface-container-high transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit_note</span>
                      <span>{item.progress > 0 ? 'Continue Draft' : 'Start Assignment'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openAssignmentSubmission(item.id)}
                      className="px-4 h-10 rounded-lg bg-primary text-on-primary text-xs font-semibold flex items-center justify-center gap-1 shadow-sm hover:bg-primary-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">send</span>
                      <span>Submit</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sync Canvas Bar */}
      <div className="flex justify-center pt-2">
        <div className="bg-inverse-surface text-inverse-on-surface px-4 py-2.5 rounded-full shadow-lg flex items-center gap-3">
          <span className="text-xs font-medium">Auto-sync enabled</span>
          <span className="w-px h-3.5 bg-inverse-on-surface/30" />
          <button
            type="button"
            onClick={() => showToast('Synced coursework deadlines with Canvas LMS', 'success')}
            className="text-xs font-semibold text-primary-fixed-dim hover:text-white flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">sync</span>
            <span>Sync Canvas</span>
          </button>
        </div>
      </div>

      {/* New Coursework Task Drawer Modal */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateTask}
            className="w-full max-w-lg bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">edit_calendar</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface">New Coursework Task</h3>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Distributed Systems Final Paper"
                  className="w-full h-11 px-3.5 bg-surface-container-low rounded-lg text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                    Course
                  </label>
                  <select
                    value={newCourse}
                    onChange={(e) => setNewCourse(e.target.value)}
                    className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-sm text-on-surface outline-none"
                  >
                    {COURSES.filter((c) => c !== 'All' && c !== 'Pending').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-sm text-on-surface outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                    Weight (%)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="w-full h-11 px-3.5 bg-surface-container-low rounded-lg text-sm text-on-surface outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-sm text-on-surface outline-none"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Normal">Normal</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    smart_toy
                  </span>
                  <div>
                    <span className="text-xs font-bold text-on-surface block">
                      AI Milestone Breakdown
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      Auto-generate micro steps
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAiBreakdown((v) => !v)}
                  className={`w-10 h-6 rounded-full relative p-0.5 transition-colors ${
                    aiBreakdown ? 'bg-primary' : 'bg-surface-container-highest'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-surface-container-lowest block transition-transform ${
                      aiBreakdown ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex-1 h-11 rounded-lg bg-surface-container text-on-surface text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 h-11 rounded-lg bg-primary text-on-primary text-sm font-semibold shadow-sm"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
