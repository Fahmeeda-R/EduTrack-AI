import React, { useMemo, useRef, useState } from 'react';
import { useEduTrack } from '../context/EduTrackContext.tsx';
import type { AiRubricResult, SubmittedFileItem } from '../types/edutrack.ts';

const DEFAULT_PREFLIGHT: AiRubricResult = {
  projectedScore: 94,
  gradeLetter: 'Grade A',
  confidence: '98.2%',
  criteria: [
    {
      title: 'Deadlock-free Mutex & Semaphore Logic',
      subtitle: 'Strict locking hierarchy, no race conditions',
      badge: 'Passed (100%)',
      status: 'passed',
    },
    {
      title: 'Thread Concurrency & Test Suite Coverage',
      subtitle: 'Stress test passed 19/20 edge trials; minor spinlock jitter under 64-thread contention.',
      badge: '95%',
      status: 'warning',
    },
    {
      title: 'Technical Documentation & Memory Leak Audit',
      subtitle: 'Valgrind 0-leak clean exit, IEEE benchmark graphs',
      badge: '92%',
      status: 'passed',
    },
    {
      title: 'Academic Integrity Pre-Scan',
      subtitle: 'Global institutional corpus match',
      badge: '100% Original',
      status: 'passed',
    },
  ],
  polishTip:
    'Ensure all POSIX semaphore cleanup handlers call sem_destroy() on early program termination for full memory marks.',
};

export const SubmissionView: React.FC = () => {
  const {
    assignments,
    selectedAssignmentId,
    setActiveScreen,
    updateAssignment,
    runRubricPrecheckAi,
    showToast,
  } = useEduTrack();

  const assignment = useMemo(
    () => assignments.find((a) => a.id === selectedAssignmentId) || assignments[0],
    [assignments, selectedAssignmentId]
  );

  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const [files, setFiles] = useState<SubmittedFileItem[]>(
    assignment?.submittedFiles?.length
      ? assignment.submittedFiles
      : [
          { name: 'process_sync_semaphore.c', size: '3.8 MB', status: 'Ready' },
          { name: 'lab_report_concurrency_benchmarks.pdf', size: '1.4 MB', status: 'Ready' },
        ]
  );
  const [rubric, setRubric] = useState<AiRubricResult>(
    assignment?.aiRubricResult || DEFAULT_PREFLIGHT
  );
  const [scanning, setScanning] = useState(false);
  const [honorChecked, setHonorChecked] = useState(true);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<SubmittedFileItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!assignment) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;
    const added: SubmittedFileItem[] = Array.from(selected).map((f) => ({
      name: f.name,
      size: `${Math.max(0.1, f.size / (1024 * 1024)).toFixed(1)} MB`,
      status: 'Ready',
    }));
    const nextFiles = [...files, ...added];
    setFiles(nextFiles);
    await updateAssignment(assignment.id, { submittedFiles: nextFiles });
    showToast(`Attached ${added.length} file(s)`, 'success');
  };

  const removeFile = async (index: number) => {
    const nextFiles = files.filter((_, i) => i !== index);
    setFiles(nextFiles);
    await updateAssignment(assignment.id, { submittedFiles: nextFiles });
    showToast('Attachment removed', 'info');
  };

  const handleRescan = async () => {
    setScanning(true);
    try {
      const result = await runRubricPrecheckAi(assignment, files);
      setRubric(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI Rubric scan failed';
      showToast(msg, 'error');
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = async () => {
    if (!honorChecked) {
      showToast('Please certify the University Honor Code before submitting.', 'error');
      return;
    }
    await updateAssignment(assignment.id, {
      status: 'submitted',
      progress: 100,
      submittedFiles: files,
      aiRubricResult: rubric,
    });
    setSubmitModalOpen(true);
  };

  const handleSaveDraft = async () => {
    await updateAssignment(assignment.id, {
      status: 'in_progress',
      progress: Math.max(assignment.progress, 65),
      submittedFiles: files,
    });
    showToast('Submission artifacts saved as draft', 'success');
  };

  return (
    <div className="py-5 space-y-5 max-w-4xl mx-auto">
      {/* Back Breadcrumb */}
      <button
        type="button"
        onClick={() => setActiveScreen('assignments')}
        className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors text-xs font-semibold"
      >
        <span className="material-symbols-outlined text-[18px] text-primary">arrow_back</span>
        <span>Back to Assignment Hub</span>
      </button>

      {/* Header Card */}
      <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm space-y-3 relative overflow-hidden">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-semibold">
            <span className="material-symbols-outlined text-[14px] text-primary">memory</span>
            {assignment.course}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant text-[11px] font-medium">
            {assignment.instructor}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-[11px] font-bold ml-auto">
            {assignment.maxPoints} Pts Max
          </span>
        </div>

        <h1 className="text-xl font-bold text-on-surface leading-tight">{assignment.title}</h1>

        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-surface-container-low">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
            </div>
            <div className="min-w-0">
              <span className="text-xs text-on-surface-variant block truncate">
                Due {assignment.dueLabel}
              </span>
              <span className="text-xs font-bold text-primary">
                Weight: {assignment.weight}% of Final Grade
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant text-[11px] font-semibold">
            {assignment.status === 'submitted' ? 'Submitted' : 'Final Submission'}
          </span>
        </div>
      </div>

      {/* Collapsible Lab Guidelines */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setGuidelinesOpen((v) => !v)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-surface-container-low transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">menu_book</span>
            <span className="text-sm font-semibold text-on-surface">
              Lab Guidelines & Deliverables
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full font-semibold">
              2 Files Req.
            </span>
            <span
              className={`material-symbols-outlined text-[20px] text-on-surface-variant transition-transform ${
                guidelinesOpen ? 'rotate-180' : ''
              }`}
            >
              expand_more
            </span>
          </div>
        </button>
        {guidelinesOpen && (
          <div className="px-5 pb-5 pt-2 space-y-3 bg-surface-container-low/40">
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              {assignment.guidelines}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg bg-surface-container-lowest shadow-xs">
                <span className="text-xs font-bold text-primary block mb-0.5">
                  Source Implementation
                </span>
                <p className="font-mono text-[11px] text-on-surface-variant">
                  .ZIP or source files with clean build scripts
                </p>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-lowest shadow-xs">
                <span className="text-xs font-bold text-secondary block mb-0.5">
                  IEEE Bench Report
                </span>
                <p className="font-mono text-[11px] text-on-surface-variant">
                  .PDF formatted, max 6 pages + traces
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submission Upload */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-on-surface">Submission Upload</span>
            <span className="text-xs text-on-surface-variant">({files.length} attached)</span>
          </div>
          <span className="font-mono text-xs text-on-surface-variant">Max: 50MB</span>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-surface-container-low/70 hover:bg-surface-container rounded-xl p-6 text-center flex flex-col items-center justify-center gap-2 border border-dashed border-outline-variant transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-surface-container-lowest text-primary shadow-sm flex items-center justify-center">
            <span className="material-symbols-outlined text-[26px]">cloud_upload</span>
          </div>
          <p className="text-sm font-semibold text-on-surface">
            Drop solution files or <span className="text-primary underline">Browse Files</span>
          </p>
          <p className="text-xs text-on-surface-variant">
            Supported: .ZIP, .PDF, .PY, .C, .CPP, .JAVA
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </button>

        {/* Attached Files */}
        <div className="space-y-2">
          {files.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="bg-surface-container-lowest rounded-xl p-3 shadow-sm flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary-fixed/60 text-primary flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px]">
                    {file.name.endsWith('.pdf') ? 'description' : 'terminal'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-on-surface truncate">{file.name}</p>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <span className="font-mono">{file.size}</span>
                    <span>·</span>
                    <span className="text-primary font-semibold flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      {file.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Inspect file"
                  onClick={() => setPreviewFile(file)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                </button>
                <button
                  type="button"
                  aria-label="Delete file"
                  onClick={() => removeFile(idx)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container/40"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EduTrack AI Pre-Flight Rubric Module */}
      <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-on-surface">EduTrack AI Pre-Flight</h2>
              <span className="font-mono text-xs text-primary font-semibold">
                Rubric Match: {rubric.confidence} confidence
              </span>
            </div>
          </div>
          <button
            type="button"
            disabled={scanning}
            onClick={handleRescan}
            className="px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-semibold hover:bg-surface-container-high transition-colors flex items-center gap-1 disabled:opacity-60"
          >
            <span
              className={`material-symbols-outlined text-[15px] ${scanning ? 'animate-spin' : ''}`}
            >
              refresh
            </span>
            <span>{scanning ? 'Scanning...' : 'Re-Scan with AI'}</span>
          </button>
        </div>

        {/* Projected Grade Meter */}
        <div className="p-4 rounded-xl bg-surface-container-low flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              Projected Rubric Grade
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-bold text-primary tabular-nums">
                {rubric.projectedScore}
              </span>
              <span className="text-sm text-on-surface-variant">/ 100</span>
              <span className="text-xs font-bold text-primary bg-primary-fixed/80 px-2.5 py-0.5 rounded-full ml-1">
                {rubric.gradeLetter}
              </span>
            </div>
          </div>

          <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-surface-container-highest"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
              />
              <path
                className="text-primary"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray={`${rubric.projectedScore}, 100`}
                strokeLinecap="round"
                strokeWidth="3.5"
              />
            </svg>
            <span className="absolute font-mono text-xs text-primary font-bold">
              {rubric.projectedScore}%
            </span>
          </div>
        </div>

        {/* Criterion Breakdown */}
        <div className="space-y-2">
          {rubric.criteria.map((c, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-surface-container-low/50 flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <span
                  className={`material-symbols-outlined text-[18px] mt-0.5 ${
                    c.status === 'warning' ? 'text-secondary' : 'text-primary'
                  }`}
                >
                  {c.status === 'warning' ? 'warning' : 'verified'}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-on-surface">{c.title}</p>
                  <p className="text-xs text-on-surface-variant">{c.subtitle}</p>
                </div>
              </div>
              <span
                className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded flex-shrink-0 ${
                  c.status === 'warning'
                    ? 'bg-secondary-fixed text-on-secondary-fixed'
                    : 'bg-primary-fixed/60 text-primary'
                }`}
              >
                {c.badge}
              </span>
            </div>
          ))}
        </div>

        {/* AI Polish Tip */}
        <div className="p-3 rounded-lg bg-tertiary-fixed/40 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-tertiary text-[18px] mt-0.5 flex-shrink-0">
            tips_and_updates
          </span>
          <p className="text-xs text-on-surface leading-relaxed">
            <strong className="font-semibold text-tertiary">Quick Polish Tip:</strong>{' '}
            {rubric.polishTip}
          </p>
        </div>
      </div>

      {/* Honor Code */}
      <label className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={honorChecked}
          onChange={(e) => setHonorChecked(e.target.checked)}
          className="mt-1 accent-primary w-4 h-4"
        />
        <div>
          <span className="text-sm font-semibold text-on-surface block">
            University Honor Code & Academic Integrity
          </span>
          <p className="text-xs text-on-surface-variant mt-0.5">
            I certify that this submission represents my own authentic academic work. All
            collaborative references and external libraries are completely attributed.
          </p>
        </div>
      </label>

      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          className="flex-1 h-12 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">task_alt</span>
          <span>Submit Assignment ({assignment.course})</span>
        </button>
        <button
          type="button"
          onClick={handleSaveDraft}
          className="h-12 px-6 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            bookmark
          </span>
          <span>Save as Draft</span>
        </button>
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <div
          onClick={() => setPreviewFile(null)}
          className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-container-lowest rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-on-surface truncate">{previewFile.name}</h3>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low font-mono text-xs text-on-surface-variant space-y-1">
              <p>Artifact: {previewFile.name}</p>
              <p>Size: {previewFile.size}</p>
              <p>Validation: Checksum verified · Ready for archival</p>
            </div>
          </div>
        </div>
      )}

      {/* Submission Confirmation Modal */}
      {submitModalOpen && (
        <div
          onClick={() => setSubmitModalOpen(false)}
          className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center gap-3"
          >
            <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center text-primary shadow-sm">
              <span className="material-symbols-outlined text-[36px]">verified</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface">Assignment Submitted!</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Your lab artifacts and validation reports are safely archived. Receipt hash
              #RAFT-{assignment.id}01-9874 recorded.
            </p>
            <div className="w-full bg-surface-container-low rounded-lg p-3 text-left space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Timestamp</span>
                <span className="font-mono font-semibold text-on-surface">Just now</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">AI Pre-Flight</span>
                <span className="font-mono font-bold text-primary">
                  Passed ({rubric.projectedScore}/100)
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSubmitModalOpen(false);
                setActiveScreen('dashboard');
              }}
              className="w-full h-11 rounded-lg bg-primary text-on-primary text-sm font-bold hover:bg-primary-container transition-colors mt-1"
            >
              Done & Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
