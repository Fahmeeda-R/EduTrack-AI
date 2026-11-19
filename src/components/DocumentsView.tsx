import React, { useMemo, useRef, useState } from 'react';
import { useEduTrack } from '../context/EduTrackContext.tsx';
import type { DocumentItem } from '../types/edutrack.ts';

const COURSE_FOLDERS = [
  {
    course: 'Data Structures',
    subtitle: 'Trees, Graphs & Heaps',
    icon: 'account_tree',
  },
  {
    course: 'Web Technologies',
    subtitle: 'HTML, CSS & Node.js',
    icon: 'language',
  },
  {
    course: 'Operating Systems',
    subtitle: 'Processes & Concurrency',
    icon: 'memory',
  },
  {
    course: 'DBMS',
    subtitle: 'SQL & Normalization',
    icon: 'database',
  },
];

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(12, Math.round(bytes / 1024))} KB`;
}

export const DocumentsView: React.FC = () => {
  const {
    documents,
    addDocument,
    removeDocument,
    sendTutorMessage,
    setActiveScreen,
    showToast,
  } = useEduTrack();

  const [selectedFolder, setSelectedFolder] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'size'>('recent');
  const [ocrOpen, setOcrOpen] = useState(false);
  const [ocrTitle, setOcrTitle] = useState('');
  const [ocrCourse, setOcrCourse] = useState('Operating Systems');
  const [ocrNotes, setOcrNotes] = useState('');

  const [askDoc, setAskDoc] = useState<DocumentItem | null>(null);
  const [askPrompt, setAskPrompt] = useState('');
  const [askingAi, setAskingAi] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const storageBreakdown = useMemo(() => {
    const pdfBytes = documents
      .filter((d) => d.fileType === 'pdf')
      .reduce((sum, d) => sum + d.sizeBytes, 0);
    const codeBytes = documents
      .filter((d) => d.fileType === 'code')
      .reduce((sum, d) => sum + d.sizeBytes, 0);
    const audioBytes = documents
      .filter((d) => d.fileType !== 'pdf' && d.fileType !== 'code')
      .reduce((sum, d) => sum + d.sizeBytes, 0);
    const totalMb = ((pdfBytes + codeBytes + audioBytes) / (1024 * 1024)).toFixed(1);
    const pdfPct = Math.max(24, Math.min(55, Math.round((pdfBytes / 12000000) * 100)));
    const codePct = Math.max(12, Math.min(25, Math.round((codeBytes / 12000000) * 100)));
    const audioPct = Math.max(8, Math.min(20, Math.round((audioBytes / 12000000) * 100)));
    return { totalMb, pdfPct, codePct, audioPct };
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const base =
      selectedFolder === 'All'
        ? documents
        : documents.filter((d) => d.course === selectedFolder);
    return [...base].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'size') return b.sizeBytes - a.sizeBytes;
      return b.id - a.id;
    });
  }, [documents, selectedFolder, sortBy]);

  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const fileType = ['c', 'cpp', 'py', 'java', 'ts', 'tsx', 'js', 'sql'].includes(ext)
      ? 'code'
      : ['mp3', 'wav', 'txt', 'md'].includes(ext)
      ? 'audio'
      : 'pdf';
    await addDocument({
      name: file.name,
      course: selectedFolder === 'All' ? 'Operating Systems' : selectedFolder,
      fileType,
      sizeBytes: file.size || 640000,
      sizeLabel: formatBytes(file.size || 640000),
      summary: `Uploaded ${file.name} (${formatBytes(file.size || 640000)}) for semantic course study.`,
    });
    e.target.value = '';
  };

  const handleOcrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ocrTitle.trim()) return;
    await addDocument({
      name: `${ocrTitle.trim().replace(/\s+/g, '_')}_OCR.pdf`,
      course: ocrCourse,
      fileType: 'pdf',
      sizeBytes: 920000,
      sizeLabel: '900 KB',
      summary:
        ocrNotes.trim() ||
        `Digitized whiteboard/notebook scan for ${ocrCourse}: ${ocrTitle.trim()}`,
    });
    setOcrTitle('');
    setOcrNotes('');
    setOcrOpen(false);
  };

  const handleAskDocumentAi = async (queryText: string) => {
    if (!askDoc || !queryText.trim() || askingAi) return;
    setAskingAi(true);
    try {
      await sendTutorMessage({
        prompt: `${queryText.trim()} (Referencing ${askDoc.name})`,
        courseScope: askDoc.course,
        documentContext: `${askDoc.name}: ${askDoc.summary}`,
      });
      setAskDoc(null);
      setAskPrompt('');
      setActiveScreen('ai-assistant');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to ask AI about document';
      showToast(msg, 'error');
    } finally {
      setAskingAi(false);
    }
  };

  const handleDownloadSummary = (doc: DocumentItem) => {
    const blob = new Blob(
      [
        `EduTrack AI Course Resource Summary\nTitle: ${doc.name}\nCourse: ${doc.course}\nSize: ${doc.sizeLabel}\n\nSummary:\n${doc.summary}\n`,
      ],
      { type: 'text/plain;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.name.replace(/\.[^/.]+$/, '')}_summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded summary for ${doc.name}`, 'success');
  };

  return (
    <div className="py-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">My Documents</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Course slides, syllabi, reading packets, &amp; notes
          </p>
        </div>
        <span className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
          <span className="material-symbols-outlined">folder_special</span>
        </span>
      </div>

      {/* Neural Index Banner */}
      <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/25 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
        </div>
        <div>
          <p className="text-sm font-bold text-on-surface">Neural Index Active</p>
          <p className="text-xs text-on-surface-variant">
            EduTrack AI has indexed {documents.length} course documents across your workspace for
            instant tutor questions.
          </p>
        </div>
      </div>

      {/* Storage Capacity */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/20 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
            <span className="material-symbols-outlined text-primary text-[20px]">cloud_queue</span>
            <span>Storage Capacity</span>
          </div>
          <span className="text-xs font-semibold text-on-surface-variant">
            {storageBreakdown.totalMb} MB indexed / 15 GB quota
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-surface-container overflow-hidden flex gap-0.5">
          <div className="bg-primary h-full" style={{ width: `${storageBreakdown.pdfPct}%` }} />
          <div
            className="bg-secondary h-full"
            style={{ width: `${storageBreakdown.codePct}%` }}
          />
          <div
            className="bg-tertiary h-full"
            style={{ width: `${storageBreakdown.audioPct}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            PDFs
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
            Code
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-tertiary" />
            Audio / Notes
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFilePicked}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[20px]">upload_file</span>
          <span>Upload Document</span>
        </button>
        <button
          type="button"
          onClick={() => setOcrOpen(true)}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-surface-container-lowest hover:bg-surface-container text-on-surface text-sm font-semibold border border-outline-variant/30 shadow-sm transition-colors"
        >
          <span className="material-symbols-outlined text-[20px] text-primary">
            document_scanner
          </span>
          <span>OCR Scan</span>
        </button>
      </div>

      {/* Course Folders */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-on-surface">
            Course Folders ({COURSE_FOLDERS.length} active)
          </h2>
          <button
            type="button"
            onClick={() => setSelectedFolder('All')}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
          >
            <span>{selectedFolder === 'All' ? 'Showing all' : 'View all'}</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {COURSE_FOLDERS.map((folder) => {
            const folderDocs = documents.filter((d) => d.course === folder.course);
            const active = selectedFolder === folder.course;
            return (
              <button
                key={folder.course}
                type="button"
                onClick={() => setSelectedFolder(active ? 'All' : folder.course)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  active
                    ? 'bg-primary-fixed/40 border-primary shadow-sm'
                    : 'bg-surface-container-lowest border-outline-variant/20 hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">folder</span>
                  </span>
                  <span className="text-[11px] font-bold text-on-surface-variant">
                    {folderDocs.length} {folderDocs.length === 1 ? 'file' : 'files'}
                  </span>
                </div>
                <p className="text-sm font-bold text-on-surface mt-2.5 truncate">{folder.course}</p>
                <p className="text-xs text-on-surface-variant truncate">{folder.subtitle}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Documents */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">history_edu</span>
            <span>
              {selectedFolder === 'All' ? 'Recent Documents' : `${selectedFolder} Resources`}
            </span>
          </h2>
          <button
            type="button"
            onClick={() =>
              setSortBy((prev) =>
                prev === 'recent' ? 'name' : prev === 'name' ? 'size' : 'recent'
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">sort</span>
            <span className="capitalize">Sort: {sortBy}</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[22px]">
                    {doc.fileType === 'code'
                      ? 'code'
                      : doc.fileType === 'audio'
                      ? 'graphic_eq'
                      : 'picture_as_pdf'}
                  </span>
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-on-surface truncate">{doc.name}</p>
                    {doc.aiSynced && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">
                        <span className="material-symbols-outlined text-[12px]">bolt</span>
                        AI Synced
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {doc.course} · {doc.sizeLabel} · {doc.lastReadLabel}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setAskDoc(doc)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined text-[15px]">smart_toy</span>
                  Ask AI
                </button>
                <button
                  type="button"
                  aria-label={`Download summary for ${doc.name}`}
                  onClick={() => handleDownloadSummary(doc)}
                  className="w-9 h-9 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${doc.name}`}
                  onClick={() => removeDocument(doc.id)}
                  className="w-9 h-9 rounded-lg hover:bg-error-container/40 flex items-center justify-center text-error transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* OCR Scan Modal */}
      {ocrOpen && (
        <div
          onClick={() => setOcrOpen(false)}
          className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleOcrSubmit}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-5 shadow-2xl border border-outline-variant/30 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">document_scanner</span>
                OCR Handwritten Note Scan
              </h3>
              <button
                type="button"
                onClick={() => setOcrOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Scan Title
                </label>
                <input
                  required
                  type="text"
                  value={ocrTitle}
                  onChange={(e) => setOcrTitle(e.target.value)}
                  placeholder="e.g., OS Lecture 7 Whiteboard Notes"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Course Folder
                </label>
                <select
                  value={ocrCourse}
                  onChange={(e) => setOcrCourse(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface outline-none focus:border-primary"
                >
                  {COURSE_FOLDERS.map((f) => (
                    <option key={f.course} value={f.course}>
                      {f.course}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Extracted Key Points
                </label>
                <textarea
                  rows={3}
                  value={ocrNotes}
                  onChange={(e) => setOcrNotes(e.target.value)}
                  placeholder="Optional key definitions or equations detected on page..."
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOcrOpen(false)}
                className="px-4 py-2 rounded-xl bg-surface-container text-on-surface text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-sm"
              >
                Save &amp; Index OCR PDF
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ask AI About Document Sheet */}
      {askDoc && (
        <div
          onClick={() => setAskDoc(null)}
          className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-outline-variant/30 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                <h3 className="text-base font-bold text-on-surface truncate">
                  Ask AI About {askDoc.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAskDoc(null)}
                className="w-9 h-9 rounded-full hover:bg-surface-container flex items-center justify-center flex-shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant bg-surface-container-low p-3 rounded-xl">
              {askDoc.summary}
            </p>

            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-outline">
                Quick queries
              </p>
              <button
                type="button"
                disabled={askingAi}
                onClick={() =>
                  handleAskDocumentAi(`Summarize key concepts and exam takeaways from ${askDoc.name}`)
                }
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors"
              >
                <span>Summarize core trade-offs &amp; key theorems</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
              <button
                type="button"
                disabled={askingAi}
                onClick={() =>
                  handleAskDocumentAi(
                    `Generate 3 practice exam questions with concise solutions based on ${askDoc.name}`
                  )
                }
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors"
              >
                <span>Generate 3 practice flashcards</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskDocumentAi(askPrompt);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={askPrompt}
                onChange={(e) => setAskPrompt(e.target.value)}
                placeholder="Ask a specific question about this document..."
                className="flex-1 bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/30 text-sm text-on-surface outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={!askPrompt.trim() || askingAi}
                className="w-11 h-11 rounded-xl bg-primary text-on-primary flex items-center justify-center disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {askingAi ? 'sync' : 'send'}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
