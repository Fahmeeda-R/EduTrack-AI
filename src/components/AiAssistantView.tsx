import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useEduTrack } from '../context/EduTrackContext.tsx';

const COURSE_SCOPES = [
  'Operating Systems',
  'Data Structures',
  'Web Technologies',
  'Java',
  'Python',
  'DBMS',
  'English',
];

const STUDY_STARTERS = [
  {
    icon: 'lock_clock',
    title: 'Deadlock Conditions (Coffman)',
    subtitle: 'Mutual exclusion & circular wait',
    scope: 'Operating Systems',
    prompt:
      'Summarize the 4 Coffman deadlock conditions and show how resource ordering prevents circular wait in POSIX threads.',
  },
  {
    icon: 'route',
    title: 'Dijkstra vs A* Search',
    subtitle: 'Heuristics & shortest path cost',
    scope: 'Data Structures',
    prompt:
      'Compare Dijkstra algorithm vs A* search in weighted graphs, including time complexity and admissible heuristic guarantees.',
  },
  {
    icon: 'database',
    title: 'DBMS B-Tree Indexing',
    subtitle: 'Balanced multi-way search trees',
    scope: 'DBMS',
    prompt:
      'Explain how B+ Tree indexing accelerates PostgreSQL range queries compared to sequential scans and hash indexes.',
  },
  {
    icon: 'memory',
    title: 'Java Memory Model & Volatile',
    subtitle: 'Visibility, happens-before & atomic ops',
    scope: 'Java',
    prompt:
      'Explain the Java Memory Model happens-before guarantee and when to use volatile vs synchronized or AtomicInteger.',
  },
];

interface SavedFlashcard {
  id: number;
  course: string;
  question: string;
  answer: string;
}

export const AiAssistantView: React.FC = () => {
  const {
    userProfile,
    chatMessages,
    documents,
    sendTutorMessage,
    clearTutorChat,
    showToast,
  } = useEduTrack();

  const [courseScope, setCourseScope] = useState<string>('Operating Systems');
  const [selectedDocId, setSelectedDocId] = useState<number | null>(documents[0]?.id ?? null);
  const [promptInput, setPromptInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [failedRequest, setFailedRequest] = useState<{
    prompt: string;
    scope: string;
    simplify: boolean;
  } | null>(null);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [savedFlashcards, setSavedFlashcards] = useState<SavedFlashcard[]>([
    {
      id: 1,
      course: 'Operating Systems',
      question: 'What differentiates a POSIX Mutex from a Counting Semaphore?',
      answer:
        'A Mutex enforces strict thread ownership (only the locking thread may unlock), whereas a Counting Semaphore uses wait/post signaling across threads without ownership.',
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatMessages.length, isSending]);

  const groundedDoc = useMemo(
    () => documents.find((d) => d.id === selectedDocId) || documents[0] || null,
    [documents, selectedDocId]
  );

  const firstName = userProfile.displayName.split(' ')[0] || 'Elena';

  const handleSend = async (
    customPrompt?: string,
    customScope?: string,
    simplify = false,
    retry = false
  ) => {
    const text = (customPrompt ?? promptInput).trim();
    if (!text || isSending) return;
    const scope = customScope || courseScope;
    if (!customPrompt) setPromptInput('');
    setChatError(null);
    setFailedRequest(null);
    setIsSending(true);
    try {
      await sendTutorMessage({
        prompt: text,
        courseScope: scope,
        documentContext: groundedDoc
          ? `${groundedDoc.name}: ${groundedDoc.summary}`
          : undefined,
        simplify,
        retry,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to reach Tutor AI';
      setChatError(msg);
      setFailedRequest({ prompt: text, scope, simplify });
      showToast(msg, 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied to clipboard`, 'success');
    } catch {
      showToast('Copy unavailable in this browser context', 'info');
    }
  };

  const handleAddFlashcard = (course: string, content: string) => {
    const snippet = content.replace(/\*\*/g, '').slice(0, 220);
    setSavedFlashcards((prev) => [
      {
        id: Date.now(),
        course,
        question: `Key takeaway for ${course}`,
        answer: snippet + (content.length > 220 ? '...' : ''),
      },
      ...prev,
    ]);
    showToast('Added explanation to Saved Flashcards', 'success');
  };

  return (
    <div className="py-5 space-y-4">
      {/* Header Bar */}
      <div className="bg-surface-container-low rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 border border-outline-variant/20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-on-surface tracking-tight">
                Academic Assistant
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">
                Gemini Tutor
              </span>
            </div>
            <p className="text-xs text-on-surface-variant truncate">
              Data Structures, Web Technologies, Java, Python, Operating Systems, DBMS &amp; English
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNotesModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-lowest hover:bg-surface-container text-on-surface text-xs font-semibold shadow-sm border border-outline-variant/20 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">bookmark</span>
            <span>Saved Notes ({savedFlashcards.length})</span>
          </button>
          <button
            type="button"
            onClick={clearTutorChat}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[16px]">edit_square</span>
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Study Starters */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">tune</span>
            Study Starters
          </span>
          <span className="text-[11px] font-medium text-secondary">
            Course context synced
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {STUDY_STARTERS.map((starter) => (
            <button
              key={starter.title}
              type="button"
              onClick={() => {
                setCourseScope(starter.scope);
                handleSend(starter.prompt, starter.scope);
              }}
              className="text-left bg-surface-container-lowest hover:bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 shadow-sm transition-colors group"
            >
              <div className="flex items-center gap-2 text-primary font-bold text-xs">
                <span className="material-symbols-outlined text-[17px]">{starter.icon}</span>
                <span className="truncate">{starter.title}</span>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1 truncate">
                {starter.subtitle}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Grounded Document Bar */}
      {documents.length > 0 && (
        <div className="bg-surface-container-low rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 border border-outline-variant/20">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0">
              picture_as_pdf
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-on-surface truncate">
                {groundedDoc?.name || 'OS_Process_Synchronization_Notes.pdf'}
              </p>
              <p className="text-[11px] text-on-surface-variant truncate">
                Grounded into prompt context · {groundedDoc?.course}
              </p>
            </div>
          </div>
          <select
            aria-label="Grounded context document"
            value={groundedDoc?.id ?? ''}
            onChange={(e) => setSelectedDocId(Number(e.target.value))}
            className="text-xs font-semibold bg-surface-container-lowest text-on-surface border border-outline-variant/40 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary"
          >
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Conversation Thread */}
      <div className="space-y-4">
        {chatMessages.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-8 text-center border border-outline-variant/20">
            <span className="material-symbols-outlined text-[40px] text-primary">smart_toy</span>
            <h2 className="text-base font-bold text-on-surface mt-2">
              Ready for your next academic question
            </h2>
            <p className="text-xs text-on-surface-variant mt-1 max-w-md mx-auto">
              Select a Study Starter above or ask about algorithms, semaphores, SQL normal forms,
              Spring Boot filters, or technical writing.
            </p>
          </div>
        ) : (
          chatMessages.map((msg, idx) =>
            msg.role === 'user' ? (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-2xl bg-primary text-on-primary rounded-2xl rounded-br-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-[11px] opacity-85 mb-1">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    <span className="font-semibold">
                      {firstName} ({userProfile.role === 'faculty' ? 'Faculty' : 'Student'})
                    </span>
                    <span>·</span>
                    <span>{msg.timestampLabel}</span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ) : (
              <div
                key={msg.id}
                className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 border border-outline-variant/25 shadow-sm space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[17px]">auto_awesome</span>
                    </span>
                    <span className="text-sm font-bold text-on-surface">Tutor Explanation</span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-semibold">
                      {msg.courseScope}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-secondary">
                    Confidence: 99.1% · {msg.timestampLabel}
                  </span>
                </div>

                <div className="text-sm text-on-surface leading-relaxed whitespace-pre-line">
                  {msg.content}
                </div>

                {msg.codeSnippet && (
                  <div className="rounded-xl overflow-hidden border border-outline-variant/30 bg-inverse-surface text-inverse-on-surface">
                    <div className="px-3 py-2 flex items-center justify-between border-b border-outline-variant/20 text-xs">
                      <span className="flex items-center gap-1.5 font-mono font-semibold">
                        <span className="material-symbols-outlined text-[15px]">terminal</span>
                        {msg.codeFilename || 'snippet.txt'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.codeSnippet || '', 'Code snippet')}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-surface/10 text-[11px] font-semibold"
                      >
                        <span className="material-symbols-outlined text-[14px]">content_copy</span>
                        Copy
                      </button>
                    </div>
                    <pre className="p-3 text-xs font-mono overflow-x-auto leading-relaxed">
                      <code>{msg.codeSnippet}</code>
                    </pre>
                  </div>
                )}

                {idx === chatMessages.length - 1 && msg.courseScope === 'Operating Systems' && (
                  <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/20">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-on-surface">
                        Deadlock Prevention Matrix (Coffman Strategies)
                      </span>
                      <span className="font-semibold text-secondary">
                        Circular Wait: Eliminated
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                      {[
                        ['C1', 'Mutex'],
                        ['C2', 'H&W'],
                        ['C3', 'No-P'],
                        ['C4', 'Safe Order · 0% Lock'],
                      ].map(([code, label]) => (
                        <div
                          key={code}
                          className="bg-surface-container-lowest rounded-lg py-2 px-1.5 border border-outline-variant/20"
                        >
                          <div className="font-mono font-bold text-primary">{code}</div>
                          <div className="text-on-surface-variant truncate mt-0.5">{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopy(msg.content, 'Explanation')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]">content_copy</span>
                    Copy Explanation
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddFlashcard(msg.courseScope, msg.content)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]">style</span>
                    Add to Flashcards
                  </button>
                  <button
                    type="button"
                    disabled={isSending}
                    onClick={() =>
                      handleSend(
                        `Simplify this explanation: ${msg.content.slice(0, 350)}`,
                        msg.courseScope,
                        true
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary-fixed text-on-secondary-fixed hover:opacity-90 text-xs font-semibold transition-opacity disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[15px]">psychology</span>
                    Explain Simpler
                  </button>
                </div>
              </div>
            )
          )
        )}

        {isSending && (
          <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/20 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary animate-spin">sync</span>
            <span className="text-xs font-semibold text-on-surface-variant">
              Synthesizing study response from {courseScope} context...
            </span>
          </div>
        )}

        {chatError && !isSending && (
          <div className="bg-error-container/35 rounded-2xl p-4 border border-error/30 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <span className="material-symbols-outlined text-error text-[20px] flex-shrink-0">
                error_outline
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-on-surface">
                  Tutor AI could not complete that response
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5 break-words">{chatError}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {failedRequest && (
                <button
                  type="button"
                  onClick={() =>
                    handleSend(
                      failedRequest.prompt,
                      failedRequest.scope,
                      failedRequest.simplify,
                      true
                    )
                  }
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold shadow-sm hover:opacity-90"
                >
                  <span className="material-symbols-outlined text-[15px]">refresh</span>
                  Retry
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setChatError(null);
                  setFailedRequest(null);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-surface-container text-xs font-semibold text-on-surface"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Sticky Prompt Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="sticky bottom-20 lg:bottom-4 z-20 bg-surface-container-lowest/95 backdrop-blur-md rounded-2xl p-3 border border-outline-variant/30 shadow-lg space-y-2.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[17px] text-primary">library_books</span>
            <span className="text-xs font-semibold text-on-surface-variant">Scope:</span>
            <select
              aria-label="Course Scope"
              value={courseScope}
              onChange={(e) => setCourseScope(e.target.value)}
              className="text-xs font-bold bg-surface-container text-on-surface rounded-lg px-2.5 py-1 outline-none"
            >
              {COURSE_SCOPES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <span className="text-[11px] text-on-surface-variant">
            Grounded in {groundedDoc ? groundedDoc.name : 'course syllabus'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder={`Ask about ${courseScope}, algorithms, syntax, or exam prep...`}
            className="flex-1 bg-surface-container-low text-on-surface placeholder:text-outline text-sm px-3.5 py-2.5 rounded-xl border border-outline-variant/30 outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={!promptInput.trim() || isSending}
            aria-label="Send message"
            className="w-11 h-11 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm hover:opacity-90 disabled:opacity-40 transition-opacity flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
          </button>
        </div>
      </form>

      {/* Saved Notes / Flashcards Modal */}
      {notesModalOpen && (
        <div
          onClick={() => setNotesModalOpen(false)}
          className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-outline-variant/30 space-y-4 max-h-[80vh] flex flex-col"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">style</span>
                <h3 className="text-base font-bold text-on-surface">
                  Saved Tutor Notes &amp; Flashcards
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setNotesModalOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-surface-container flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="overflow-y-auto space-y-3 pr-1">
              {savedFlashcards.map((card) => (
                <div
                  key={card.id}
                  className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-1.5"
                >
                  <span className="inline-block px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">
                    {card.course}
                  </span>
                  <p className="text-xs font-bold text-on-surface">{card.question}</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{card.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
