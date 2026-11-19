import React, { useMemo, useState } from 'react';
import { useEduTrack } from '../context/EduTrackContext.tsx';
import type { AssignmentItem } from '../types/edutrack.ts';

interface GeneratedRubricTier {
  criterion: string;
  points: number;
  excellentDescriptor: string;
  proficientDescriptor: string;
}

const COURSES = [
  'All Courses',
  'Operating Systems',
  'Data Structures',
  'Web Technologies',
  'Java',
  'Python',
  'DBMS',
];

export const FacultyView: React.FC = () => {
  const {
    assignments,
    updateAssignment,
    setActiveScreen,
    showToast,
  } = useEduTrack();

  const [selectedCourse, setSelectedCourse] = useState('Operating Systems');
  const [cohortModalOpen, setCohortModalOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [reviewAssignment, setReviewAssignment] = useState<AssignmentItem | null>(null);

  // Faculty AI Rubric Generator State
  const [specInput, setSpecInput] = useState(
    'POSIX threads, counting semaphores, deadlock avoidance, and Valgrind memory audit'
  );
  const [generatedRubric, setGeneratedRubric] = useState<GeneratedRubricTier[] | null>(null);
  const [rubricLoading, setRubricLoading] = useState(false);

  const visibleAssignments = useMemo(() => {
    if (selectedCourse === 'All Courses') return assignments;
    const filtered = assignments.filter((a) => a.course === selectedCourse);
    return filtered.length > 0 ? filtered : assignments;
  }, [assignments, selectedCourse]);

  const handleExportGradebookCsv = () => {
    const rows = [
      ['Course', 'Assignment', 'Due Date', 'Status', 'Score', 'Weight'],
      ...assignments.map((a) => [
        a.course,
        `"${a.title.replace(/"/g, '""')}"`,
        a.dueDate,
        a.status,
        a.gradeScore != null ? String(a.gradeScore) : 'Pending',
        `${a.weight}%`,
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edutrack_gradebook_export.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported Gradebook CSV', 'success');
  };

  const handleGenerateRubric = async () => {
    if (rubricLoading) return;
    setRubricLoading(true);
    try {
      const res = await fetch('/api/ai/generate-rubric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentTitle: `${selectedCourse} Capstone Lab`,
          course: selectedCourse,
          specText: specInput,
        }),
      });
      if (!res.ok) throw new Error('Rubric generation failed');
      const data = await res.json();
      setGeneratedRubric(data.rubric || []);
      showToast('4-tier grading rubric synthesized', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to generate rubric';
      showToast(msg, 'error');
    } finally {
      setRubricLoading(false);
    }
  };

  return (
    <div className="py-5 space-y-5">
      {/* Faculty Role Banner */}
      <div className="bg-surface-container-low rounded-2xl p-4 sm:p-5 border border-outline-variant/25 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-primary text-on-primary text-[11px] font-bold">
            Faculty Portal
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-on-surface mt-1.5">
            Course &amp; Assignment Manager
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Prof. Marcus Vance · Computer Science Dept · Manage syllabus &amp; AI-graded
            submissions
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveScreen('dashboard')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/30 text-xs font-semibold text-on-surface shadow-sm transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
          Student Hub
        </button>
      </div>

      {/* Active Course Selector & Quick Actions */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/25 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined">dns</span>
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Active Term · 64 Enrolled
            </p>
            <select
              aria-label="Active Faculty Course"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="text-sm font-bold text-on-surface bg-transparent outline-none cursor-pointer"
            >
              {COURSES.map((c) => (
                <option key={c} value={c}>
                  {c} · Section A (MWF 10:00 AM)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveScreen('assignment-publisher')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-sm hover:opacity-90"
          >
            <span className="material-symbols-outlined text-[16px]">add_task</span>+ New Assignment
          </button>
          <button
            type="button"
            onClick={() => setActiveScreen('announcements-manager')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold hover:opacity-90"
          >
            <span className="material-symbols-outlined text-[16px]">campaign</span>+ Announcement
          </button>
        </div>
      </div>

      {/* 4-Card Telemetry Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 shadow-sm">
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span>Active Labs</span>
            <span className="material-symbols-outlined text-[18px] text-primary">
              pending_actions
            </span>
          </div>
          <div className="text-2xl font-bold text-on-surface mt-2">
            {assignments.filter((a) => a.status !== 'graded').length}
          </div>
          <div className="text-[11px] text-secondary font-semibold mt-0.5">Ongoing this week</div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 shadow-sm">
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span>Submissions</span>
            <span className="material-symbols-outlined text-[18px] text-primary">
              mark_email_read
            </span>
          </div>
          <div className="text-2xl font-bold text-on-surface mt-2">58 / 64</div>
          <div className="text-[11px] text-secondary font-semibold mt-0.5">91% turn-in rate</div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 shadow-sm">
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span>Pending Review</span>
            <span className="material-symbols-outlined text-[18px] text-tertiary">rate_review</span>
          </div>
          <div className="text-2xl font-bold text-on-surface mt-2">6</div>
          <div className="text-[11px] text-on-surface-variant font-semibold mt-0.5">
            Awaiting AI sync
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveScreen('gradebook')}
          className="text-left bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 shadow-sm hover:bg-surface-container-low transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span>Class Avg Score</span>
            <span className="material-symbols-outlined text-[18px] text-primary">query_stats</span>
          </div>
          <div className="text-2xl font-bold text-on-surface mt-2">87.4%</div>
          <div className="text-[11px] text-primary font-semibold mt-0.5">+2.1% vs midterm</div>
        </button>
      </div>

      {/* Midterm Retention Alert */}
      <div className="bg-error-container/30 border border-error/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-xl bg-error text-on-error flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">priority_high</span>
          </span>
          <div>
            <p className="text-sm font-bold text-on-surface">
              Midterm Retention Alert · Action Recommended
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              3 students flagged for low participation (&lt;45% lab engagement) before next
              week&apos;s midterm.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              showToast('Encouragement outreach queued for 3 flagged students', 'success')
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">send</span>
            Send Encouragement Email
          </button>
          <button
            type="button"
            onClick={() => setCohortModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs font-semibold text-on-surface"
          >
            View Cohort
          </button>
        </div>
      </div>

      {/* Assignment Registry */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-on-surface">Assignment Registry</h2>
            <p className="text-xs text-on-surface-variant">
              Live telemetry and rubric grading queues
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportGradebookCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export Gradebook CSV
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visibleAssignments.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/25 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold capitalize">
                  {item.status.replace('_', ' ')}
                </span>
                <span className="text-on-surface-variant font-medium">{item.dueLabel}</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface line-clamp-2">{item.title}</h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  {item.course} · Weight {item.weight}%
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/15">
                <button
                  type="button"
                  onClick={() => setReviewAssignment(item)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold"
                >
                  <span className="material-symbols-outlined text-[15px]">checklist_rtl</span>
                  Review Submissions &amp; AI Rubrics
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const nextStatus = item.status === 'graded' ? 'in_progress' : 'graded';
                    await updateAssignment(item.id, {
                      status: nextStatus,
                      gradeScore: nextStatus === 'graded' ? 94 : null,
                      gradeLetter: nextStatus === 'graded' ? 'A' : null,
                      progress: nextStatus === 'graded' ? 100 : 65,
                    });
                    showToast(
                      nextStatus === 'graded' ? 'Marked cohort graded (Avg 94%)' : 'Reopened queue',
                      'success'
                    );
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface"
                >
                  {item.status === 'graded' ? 'Reopen' : 'Publish Grades'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Faculty AI Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/25 space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
            <h2 className="text-base font-bold text-on-surface">
              Faculty AI Rubric Generator
            </h2>
          </div>
          <p className="text-xs text-on-surface-variant">
            Auto-generate 4-tier grading rubrics instantly from an assignment specification or
            syllabus summary.
          </p>
          <textarea
            rows={2}
            value={specInput}
            onChange={(e) => setSpecInput(e.target.value)}
            className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs text-on-surface outline-none focus:border-primary"
          />
          <button
            type="button"
            disabled={rubricLoading}
            onClick={handleGenerateRubric}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-sm hover:opacity-90 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">
              {rubricLoading ? 'sync' : 'architecture'}
            </span>
            <span>{rubricLoading ? 'Generating Rubric...' : 'Generate 4-Tier Rubric'}</span>
          </button>

          {generatedRubric && (
            <div className="space-y-2 pt-2">
              {generatedRubric.map((tier, idx) => (
                <div
                  key={idx}
                  className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/20 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-bold text-on-surface">
                    <span>{tier.criterion}</span>
                    <span className="text-primary">{tier.points} pts</span>
                  </div>
                  <p className="text-on-surface-variant">
                    <strong>Excellent:</strong> {tier.excellentDescriptor}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/25 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-on-surface">
                <span className="material-symbols-outlined text-primary">policy</span>
                Academic Integrity Scan
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-bold">
                100% Scanned
              </span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              All 58 submissions in Web Technologies &amp; Operating Systems pre-scanned against
              git repositories and institutional solution benchmarks.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-secondary pt-1">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span>0 critical violations found</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAuditModalOpen(true)}
            className="w-full py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors"
          >
            View Integrity Audit Report
          </button>
        </div>
      </div>

      {/* Cohort Modal */}
      {cohortModalOpen && (
        <div
          onClick={() => setCohortModalOpen(false)}
          className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-5 shadow-2xl border border-outline-variant/30 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-on-surface">Flagged Retention Cohort</h3>
              <button
                type="button"
                onClick={() => setCohortModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {[
                ['Jordan Patel', '38% lab engagement · Missed Semaphore checkoff'],
                ['Maya Lin', '42% lab engagement · Needs midterm study plan'],
                ['Devon Brooks', '44% lab engagement · Pending Git repo link'],
              ].map(([name, note]) => (
                <div key={name} className="p-3 rounded-xl bg-surface-container-low">
                  <p className="font-bold text-on-surface">{name}</p>
                  <p className="text-on-surface-variant mt-0.5">{note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Submission Review Modal */}
      {reviewAssignment && (
        <div
          onClick={() => setReviewAssignment(null)}
          className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-outline-variant/30 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-on-surface truncate">
                AI Rubric Queue · {reviewAssignment.course}
              </h3>
              <button
                type="button"
                onClick={() => setReviewAssignment(null)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <p className="text-xs font-semibold text-on-surface">{reviewAssignment.title}</p>
            <div className="space-y-2 text-xs">
              {[
                ['Elena Rostova', '96 / 100 (AI Pre-Verified)', '0 memory leaks · IEEE report attached'],
                ['Liam O’Connor', '91 / 100 (AI Pre-Verified)', 'Passed 18/20 stress tests'],
                ['Aria Chen', '89 / 100 (Awaiting TA Check)', 'Minor mutex cleanup warning'],
              ].map(([student, score, detail]) => (
                <div
                  key={student}
                  className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-bold text-on-surface">{student}</p>
                    <p className="text-on-surface-variant">{detail}</p>
                  </div>
                  <span className="font-bold text-primary whitespace-nowrap">{score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Integrity Audit Modal */}
      {auditModalOpen && (
        <div
          onClick={() => setAuditModalOpen(false)}
          className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-5 shadow-2xl border border-outline-variant/30 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-on-surface">Integrity Audit Summary</h3>
              <button
                type="button"
                onClick={() => setAuditModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              58/58 student repositories cleared automated AST similarity analysis and commit-history
              verification. Average originality confidence: 99.4%.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
