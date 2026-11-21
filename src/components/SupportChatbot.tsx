import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useEduTrack } from '../context/EduTrackContext.tsx';

// ─── Types ───────────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'bot' | 'system';

export interface ChatMessage {
  id: number;
  role: MessageRole;
  text: string;
  timestamp: string;
  rating?: 'up' | 'down' | null;
  quickReplies?: string[];
}

export interface ChatCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
  color: string;
  bg: string;
}

interface SavedSession {
  id: number;
  label: string;
  preview: string;
  date: string;
  messages: ChatMessage[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const SUPPORT_CATEGORIES: ChatCategory[] = [
  {
    id: 'academics',
    label: 'Academic Advising',
    icon: 'school',
    description: 'Course registration, prerequisites, syllabus, credit rules',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    id: 'finance',
    label: 'Fees & Financial Aid',
    icon: 'savings',
    description: 'Tuition payment, instalments, scholarships, dues',
    color: 'text-tertiary',
    bg: 'bg-tertiary/10',
  },
  {
    id: 'library',
    label: 'Library & E-Resources',
    icon: 'local_library',
    description: 'Book borrowing, digital journal access, study rooms',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
  },
  {
    id: 'exams',
    label: 'Exams & Transcripts',
    icon: 'assignment_turned_in',
    description: 'Exam schedules, hall tickets, grades, revaluation, bonafide',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    id: 'wellness',
    label: 'Student Wellbeing',
    icon: 'favorite',
    description: 'Health centre, confidential counseling, medical leave',
    color: 'text-error',
    bg: 'bg-error/10',
  },
  {
    id: 'campus',
    label: 'IT & Campus Life',
    icon: 'wifi',
    description: 'Campus Wi-Fi, portal access, hostel, mess, transport',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
  },
];

export const QUICK_STARTERS = [
  'How do I register for courses this semester?',
  'What are the Central Library hours and borrowing rules?',
  'How do I pay tuition fees online or set up instalments?',
  'What is the university attendance requirement for exams?',
  'How do I request an official transcript or bonafide certificate?',
  'Where is the Student Health Centre and counseling service located?',
];

export const FAQ_DATABASE = [
  {
    q: 'How do I reset my student portal login credentials?',
    a: 'Visit the Student Portal and click **Forgot Password**. Enter your university roll number and registered email address to receive an OTP. If your account remains locked, email helpdesk@university.edu or visit Block A, Room 204.',
    category: 'campus',
  },
  {
    q: 'When does course registration open and what are credit limits?',
    a: 'Registration opens 2 weeks before classes start (Academics → Course Registration). Standard undergraduate workload is 18–24 credit hours per semester. Department Dean approval is required for credits exceeding 24.',
    category: 'academics',
  },
  {
    q: 'What is the attendance policy and how do I apply for medical condonation?',
    a: 'A minimum of **75% attendance** per registered course is mandatory. If you miss class due to illness, submit a Medical Condonation request with official hospital discharge documentation to your department office within 3 working days.',
    category: 'academics',
  },
  {
    q: 'How can I pay tuition fees and can I request an instalment schedule?',
    a: 'Fees are paid securely on the Student Portal using UPI, Net Banking, or Debit/Credit Cards. Receipts generate instantly. To apply for a split 2-part instalment plan, submit the Finance Request form to the Bursar Office before the start of the semester.',
    category: 'finance',
  },
  {
    q: 'How do I access IEEE, ACM, and ScienceDirect journals from off-campus?',
    a: 'Log into **lib.university.edu** using your standard student portal username and password. The university EZProxy gateway provides transparent off-campus authenticated access to all subscribed digital databases.',
    category: 'library',
  },
  {
    q: 'How do I request an official academic transcript or Bonafide Certificate?',
    a: 'Submit an e-request via **Documents → Request Certificate**. Standard processing takes 2–3 business days. Digital verified PDF transcripts with cryptographic signatures are free. Physical stamped copies can be picked up at the Registrar Office (Block A).',
    category: 'exams',
  },
  {
    q: 'Are confidential student psychological counseling sessions free?',
    a: 'Yes, 100% confidential mental wellness counseling is completely free for all enrolled students. Book an in-person or telehealth session at the Student Health Centre (Block D) or call the 24/7 campus care line: **1800-419-CARE**.',
    category: 'wellness',
  },
  {
    q: 'How do I connect to campus EduTrack-5G Wi-Fi on my laptop and phone?',
    a: 'Select **EduTrack-5G**, set EAP Method to **PEAP**, Phase 2 to **MSCHAPv2**, and enter your student ID and portal password. If prompted for a CA certificate, select "Do not validate" or install the university root certificate from wifi.university.edu.',
    category: 'campus',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid(): number {
  return Date.now() + Math.floor(Math.random() * 10000);
}

function getTimestamp(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format markdown text with bolding, code spans, bullet lists, and paragraphs
 */
export function renderFormattedBotText(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) {
      elements.push(<div key={`blank-${i}`} className="h-1.5" />);
      continue;
    }

    // Bullet point check
    const isBullet = rawLine.startsWith('• ') || rawLine.startsWith('* ') || rawLine.startsWith('- ');
    const lineContent = isBullet ? rawLine.replace(/^[•*-]\s*/, '') : rawLine;

    // Parse bold (**text**) and code (`text`)
    const parts = lineContent.split(/(\*\*.*?\*\*|`.*?`)/g);
    const parsedLine = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pIdx} className="font-semibold text-on-surface">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={pIdx}
            className="px-1.5 py-0.5 rounded bg-surface-container font-mono text-xs text-primary font-medium"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });

    if (isBullet) {
      elements.push(
        <div key={`line-${i}`} className="flex items-start gap-2 pl-1 my-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
          <span className="flex-1">{parsedLine}</span>
        </div>
      );
    } else {
      elements.push(
        <p key={`line-${i}`} className="my-1 leading-relaxed">
          {parsedLine}
        </p>
      );
    }
  }

  return <div className="space-y-0.5">{elements}</div>;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

const MessageBubble: React.FC<{
  msg: ChatMessage;
  onRate: (id: number, rating: 'up' | 'down') => void;
  onQuickReply: (v: string) => void;
  onCopy: (text: string) => void;
}> = ({ msg, onRate, onQuickReply, onCopy }) => {
  const isUser = msg.role === 'user';
  const isSystem = msg.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="text-[11px] font-semibold text-on-surface-variant bg-surface-container px-3.5 py-1 rounded-full border border-outline-variant/30 flex items-center gap-1.5 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          {msg.text}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`flex items-end gap-2.5 mb-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mb-1 shadow-sm">
          <span className="material-symbols-outlined text-on-primary text-[17px]">support_agent</span>
        </div>
      )}

      <div className={`flex flex-col max-w-[82%] sm:max-w-[76%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-xs ${
            isUser
              ? 'bg-primary text-on-primary rounded-br-xs font-medium'
              : 'bg-surface-container-lowest text-on-surface rounded-bl-xs border border-outline-variant/30'
          }`}
        >
          {isUser ? msg.text : renderFormattedBotText(msg.text)}
        </div>

        {/* Action metadata bar */}
        <div className={`flex items-center gap-2 mt-1 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[10px] text-outline font-medium">{msg.timestamp}</span>

          {!isUser && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onRate(msg.id, 'up')}
                className={`p-1 rounded-md transition-colors ${
                  msg.rating === 'up'
                    ? 'text-primary bg-primary/10'
                    : 'text-outline hover:text-primary hover:bg-surface-container'
                }`}
                title="Helpful"
              >
                <span className="material-symbols-outlined text-[13px]">thumb_up</span>
              </button>
              <button
                type="button"
                onClick={() => onRate(msg.id, 'down')}
                className={`p-1 rounded-md transition-colors ${
                  msg.rating === 'down'
                    ? 'text-error bg-error/10'
                    : 'text-outline hover:text-error hover:bg-surface-container'
                }`}
                title="Not helpful"
              >
                <span className="material-symbols-outlined text-[13px]">thumb_down</span>
              </button>
              <button
                type="button"
                onClick={() => onCopy(msg.text)}
                className="p-1 rounded-md text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
                title="Copy message"
              >
                <span className="material-symbols-outlined text-[13px]">content_copy</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick follow-up chips */}
        {!isUser && msg.quickReplies && msg.quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {msg.quickReplies.map((qr) => (
              <button
                key={qr}
                type="button"
                onClick={() => onQuickReply(qr)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/30 text-primary bg-surface-container-lowest hover:bg-primary hover:text-on-primary transition-all shadow-xs text-left"
              >
                {qr}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const TypingDots: React.FC = () => (
  <div className="flex items-end gap-2.5 mb-3.5">
    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
      <span className="material-symbols-outlined text-on-primary text-[17px]">support_agent</span>
    </div>
    <div className="bg-surface-container-lowest rounded-2xl rounded-bl-xs px-4 py-3 border border-outline-variant/30 flex items-center gap-1.5 shadow-xs">
      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
      <span className="text-xs font-medium text-on-surface-variant ml-1.5">EduTrack AI is typing...</span>
    </div>
  </div>
);

// ─── Main SupportChatbot Full Page View ────────────────────────────────────────

type ActiveViewTab = 'home' | 'chat' | 'faq' | 'history';

export const SupportChatbot: React.FC = () => {
  const { firebaseUser, showToast } = useEduTrack();
  const [activeTab, setActiveTab] = useState<ActiveViewTab>('home');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionTopic, setSessionTopic] = useState('General Support');
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const [faqSearch, setFaqSearch] = useState('');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  // Persistent session history
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>(() => {
    try {
      const stored = localStorage.getItem('edutrack_chat_sessions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping]);

  // Save history to localStorage
  const saveSessionToHistory = useCallback((topic: string, msgs: ChatMessage[]) => {
    if (msgs.length === 0) return;
    const lastUserMsg = msgs.filter((m) => m.role === 'user').slice(-1)[0];
    const preview = lastUserMsg ? lastUserMsg.text : 'Support discussion';
    const newSession: SavedSession = {
      id: uid(),
      label: topic,
      preview: preview.length > 70 ? preview.slice(0, 67) + '...' : preview,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      messages: msgs,
    };
    setSavedSessions((prev) => {
      const updated = [newSession, ...prev.slice(0, 14)];
      try {
        localStorage.setItem('edutrack_chat_sessions', JSON.stringify(updated));
      } catch {
        /* ignore storage quota */
      }
      return updated;
    });
  }, []);

  const getAuthToken = useCallback(async (): Promise<string | null> => {
    if (firebaseUser) {
      try {
        return await firebaseUser.getIdToken();
      } catch {
        return null;
      }
    }
    return null;
  }, [firebaseUser]);

  // Robust API call to /api/ai/support-chat
  const fetchBotResponse = useCallback(
    async (
      question: string,
      history: ChatMessage[],
      category?: string
    ): Promise<{ reply: string; suggestedFollowups: string[] }> => {
      const formattedHistory = history
        .filter((m) => m.role === 'user' || m.role === 'bot')
        .map((m) => ({
          role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
          content: m.text,
        }));

      try {
        const token = await getAuthToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch('/api/ai/support-chat', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            message: question,
            history: formattedHistory,
            category,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.reply === 'string') {
            return {
              reply: data.reply,
              suggestedFollowups: Array.isArray(data.suggestedFollowups)
                ? data.suggestedFollowups
                : [],
            };
          }
        }
      } catch (err) {
        console.warn('Network call to support chat failed, using fallback:', err);
      }

      // Safe local knowledge answer
      return {
        reply: `Thank you for your question regarding **${question}**. For official assistance, please consult the Student Portal (portal.university.edu) or visit the Student Services Centre in Block A, Room 101. You can also reach our student desk at **support@university.edu** (Mon–Fri, 9am–5pm).`,
        suggestedFollowups: [
          'How do I register for courses?',
          'What are the library hours?',
          'How do I check my attendance?',
        ],
      };
    },
    [getAuthToken]
  );

  // Send message handler (NO React 19 state updater side-effects!)
  const handleSendMessage = useCallback(
    async (text?: string) => {
      const question = (text ?? inputValue).trim();
      if (!question || isTyping) return;
      setInputValue('');

      const userMsg: ChatMessage = {
        id: uid(),
        role: 'user',
        text: question,
        timestamp: getTimestamp(),
      };

      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setIsTyping(true);

      const botResult = await fetchBotResponse(question, nextMessages, activeCategory);

      setIsTyping(false);
      setMessages((curr) => [
        ...curr,
        {
          id: uid(),
          role: 'bot',
          text: botResult.reply,
          timestamp: getTimestamp(),
          quickReplies: botResult.suggestedFollowups,
          rating: null,
        },
      ]);
    },
    [inputValue, isTyping, messages, activeCategory, fetchBotResponse]
  );

  // Start chat with optional initial question or category
  const startChat = useCallback(
    async (category?: ChatCategory, initialQuestion?: string) => {
      const topic = category ? category.label : 'General Support';
      setSessionTopic(topic);
      setActiveCategory(category?.id);
      setActiveTab('chat');

      const welcomeText = category
        ? `👋 Hello! I'm your **EduTrack AI Student Assistant**. You've selected **${category.label}** (${category.description}). How can I assist you today?`
        : `👋 Hello! I'm your **EduTrack AI Student Assistant**. I can help you with course registration, fees, grades, library services, attendance rules, and campus facilities. What can I answer for you?`;

      const initialMsgs: ChatMessage[] = [
        {
          id: uid(),
          role: 'system',
          text: `Channel: ${topic}`,
          timestamp: getTimestamp(),
        },
        {
          id: uid() + 1,
          role: 'bot',
          text: welcomeText,
          timestamp: getTimestamp(),
          quickReplies: QUICK_STARTERS.slice(0, 3),
        },
      ];

      if (initialQuestion) {
        const userMsg: ChatMessage = {
          id: uid() + 2,
          role: 'user',
          text: initialQuestion,
          timestamp: getTimestamp(),
        };
        const conversationWithQuestion = [...initialMsgs, userMsg];
        setMessages(conversationWithQuestion);
        setIsTyping(true);

        const botResult = await fetchBotResponse(initialQuestion, conversationWithQuestion, category?.id);

        setIsTyping(false);
        setMessages([
          ...conversationWithQuestion,
          {
            id: uid() + 3,
            role: 'bot',
            text: botResult.reply,
            timestamp: getTimestamp(),
            quickReplies: botResult.suggestedFollowups,
          },
        ]);
      } else {
        setMessages(initialMsgs);
      }

      setTimeout(() => inputRef.current?.focus(), 150);
    },
    [fetchBotResponse]
  );

  const handleEndSession = useCallback(() => {
    saveSessionToHistory(sessionTopic, messages);
    setMessages([]);
    setActiveTab('home');
    showToast('Conversation saved to Chat History', 'info');
  }, [messages, sessionTopic, saveSessionToHistory, showToast]);

  const handleStartFreshSession = useCallback(() => {
    if (messages.length > 2) {
      saveSessionToHistory(sessionTopic, messages);
    }
    startChat();
  }, [messages, sessionTopic, saveSessionToHistory, startChat]);

  const handleRate = useCallback((id: number, rating: 'up' | 'down') => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, rating } : m)));
    showToast(rating === 'up' ? 'Feedback recorded: Helpful' : 'Feedback recorded', 'info');
  }, [showToast]);

  const handleCopy = useCallback((text: string) => {
    try {
      navigator.clipboard.writeText(text);
      showToast('Copied to clipboard', 'success');
    } catch {
      showToast('Copy not available in this browser', 'info');
    }
  }, [showToast]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredFaqs = useMemo(() => {
    if (!faqSearch.trim()) return FAQ_DATABASE;
    const term = faqSearch.toLowerCase();
    return FAQ_DATABASE.filter(
      (f) => f.q.toLowerCase().includes(term) || f.a.toLowerCase().includes(term)
    );
  }, [faqSearch]);

  const restoreSession = (session: SavedSession) => {
    setSessionTopic(session.label);
    setMessages(session.messages);
    setActiveTab('chat');
  };

  const clearAllHistory = () => {
    setSavedSessions([]);
    localStorage.removeItem('edutrack_chat_sessions');
    showToast('Chat history cleared', 'info');
  };

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-6 px-1">
      {/* ── Top Header Card ───────────────────────────────────────────── */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm mb-4 overflow-hidden">
        <div className="bg-primary px-5 py-4 flex flex-wrap items-center justify-between gap-3 text-on-primary">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-on-primary/15 flex items-center justify-center flex-shrink-0 shadow-inner">
              <span className="material-symbols-outlined text-[24px]">support_agent</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold leading-tight">EduTrack AI Support</h1>
                <span className="px-2 py-0.5 rounded-full bg-on-primary/20 text-[10px] font-bold uppercase tracking-wider">
                  24/7 Active
                </span>
              </div>
              <p className="text-xs text-on-primary/80 mt-0.5">
                Instant answers on admissions, courses, fees, exams, and campus life
              </p>
            </div>
          </div>

          {activeTab === 'chat' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleStartFreshSession}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-on-primary/15 hover:bg-on-primary/25 text-on-primary transition-colors flex items-center gap-1"
                title="Start a new chat"
              >
                <span className="material-symbols-outlined text-[15px]">refresh</span>
                New Chat
              </button>
              <button
                type="button"
                onClick={handleEndSession}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-on-primary text-primary hover:bg-on-primary/90 transition-opacity shadow-xs"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-outline-variant/20 bg-surface-container-low/50">
          {(
            [
              ['home', 'explore', 'Discover'],
              ['chat', 'chat', messages.length > 0 ? `Chat (${messages.filter((m) => m.role === 'user').length})` : 'Live Chat'],
              ['faq', 'help_center', `FAQs (${FAQ_DATABASE.length})`],
              ['history', 'history', `History (${savedSessions.length})`],
            ] as [ActiveViewTab, string, string][]
          ).map(([tabId, icon, label]) => {
            const isActive = activeTab === tabId;
            return (
              <button
                key={tabId}
                type="button"
                onClick={() => {
                  if (tabId === 'chat' && messages.length === 0) {
                    startChat();
                  } else {
                    setActiveTab(tabId);
                  }
                }}
                className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 text-xs font-bold transition-all border-b-2 ${
                  isActive
                    ? 'border-primary text-primary bg-surface-container-lowest'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {/* TAB 1: DISCOVER / HOME */}
        {activeTab === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Hero Banner */}
            <div className="bg-gradient-to-br from-primary/10 via-surface-container-low to-secondary/10 rounded-2xl p-6 border border-outline-variant/30 text-center relative overflow-hidden shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary mx-auto flex items-center justify-center mb-3 shadow-md">
                <span className="material-symbols-outlined text-[30px]">smart_toy</span>
              </div>
              <h2 className="text-lg font-bold text-on-surface mb-1">
                How can we support you today?
              </h2>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto mb-4">
                Ask questions about your courses, exam dates, fee deadlines, hostel allocations, or
                campus facilities.
              </p>
              <button
                type="button"
                onClick={() => startChat()}
                className="inline-flex items-center gap-2 bg-primary text-on-primary font-bold text-xs px-6 py-2.5 rounded-xl shadow-md hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-[17px]">chat</span>
                Start Live Conversation
              </button>
            </div>

            {/* Topic Channels Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">category</span>
                  Help Categories
                </span>
                <span className="text-[11px] text-outline">Select a topic channel</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {SUPPORT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => startChat(cat)}
                    className="p-3.5 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container-low hover:border-primary/50 text-left transition-all group flex items-start gap-3 shadow-xs"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cat.bg} ${cat.color} group-hover:scale-105 transition-transform`}
                    >
                      <span className="material-symbols-outlined text-[22px]">{cat.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                        {cat.label}
                      </p>
                      <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-0.5">
                        {cat.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Starters */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-secondary">flash_on</span>
                  Frequently Asked Questions
                </span>
                <span className="text-[11px] text-outline">Click to ask instantly</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {QUICK_STARTERS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => startChat(undefined, q)}
                    className="p-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest hover:bg-primary/5 hover:border-primary/40 text-left text-xs font-semibold text-on-surface transition-all flex items-center justify-between gap-2 shadow-xs group"
                  >
                    <span className="truncate">{q}</span>
                    <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-primary transition-colors flex-shrink-0">
                      arrow_forward
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Contact Escalate Card */}
            <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px]">contact_support</span>
                </div>
                <div>
                  <p className="font-bold text-on-surface">Need to speak with human staff?</p>
                  <p className="text-on-surface-variant text-[11px]">
                    Student Helpdesk: Block A, Room 101 · Mon–Fri, 9am–5pm · support@university.edu
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  startChat(
                    undefined,
                    'How can I get in touch with an official university counselor or department advisor?'
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container font-semibold text-primary border border-outline-variant/30"
              >
                Advisor Contacts
              </button>
            </div>
          </motion.div>
        )}

        {/* TAB 2: LIVE CHAT */}
        {activeTab === 'chat' && (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col h-[560px]">
              {/* Chat Sub-header */}
              <div className="px-4 py-2.5 border-b border-outline-variant/20 bg-surface-container-low/40 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                  <span className="text-xs font-bold text-on-surface truncate">{sessionTopic}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleStartFreshSession}
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[13px]">refresh</span>
                    Clear Session
                  </button>
                </div>
              </div>

              {/* Messages Thread */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {messages.length === 0 && !isTyping && (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-on-surface-variant py-10">
                    <span className="material-symbols-outlined text-[42px] text-outline">
                      chat_bubble_outline
                    </span>
                    <p className="text-xs font-semibold">Your conversation starts here</p>
                    <p className="text-[11px] text-outline max-w-xs text-center">
                      Ask about fees, course registration, attendance policies, or exam schedules.
                    </p>
                  </div>
                )}

                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    onRate={handleRate}
                    onQuickReply={(val) => handleSendMessage(val)}
                    onCopy={handleCopy}
                  />
                ))}

                {isTyping && <TypingDots />}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-outline-variant/20 p-3 bg-surface-container-low/30">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question about your courses, fees, or campus life..."
                    disabled={isTyping}
                    className="flex-1 h-11 px-4 rounded-xl bg-surface-container text-on-surface placeholder:text-outline text-xs outline-none focus:ring-2 focus:ring-primary/40 transition-all disabled:opacity-60 border border-outline-variant/30"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isTyping}
                    className="h-11 px-4 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex-shrink-0"
                  >
                    <span>Send</span>
                    <span className="material-symbols-outlined text-[16px]">send</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: FAQ KNOWLEDGE BASE */}
        {activeTab === 'faq' && (
          <motion.div
            key="faq"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Search Input */}
            <div className="relative">
              <span className="material-symbols-outlined text-[18px] text-outline absolute left-3.5 top-1/2 -translate-y-1/2">
                search
              </span>
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Search university FAQs (e.g., fee, Wi-Fi, attendance, transcript)..."
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-container-lowest text-on-surface placeholder:text-outline text-xs border border-outline-variant/30 outline-none focus:ring-2 focus:ring-primary/30 shadow-xs"
              />
              {faqSearch && (
                <button
                  type="button"
                  onClick={() => setFaqSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* FAQ Accordion List */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm divide-y divide-outline-variant/20 overflow-hidden">
              {filteredFaqs.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant text-xs">
                  <p>No matching FAQs found for "{faqSearch}".</p>
                  <button
                    type="button"
                    onClick={() => startChat(undefined, faqSearch)}
                    className="mt-2 text-primary font-bold hover:underline"
                  >
                    Ask EduTrack AI in Chat →
                  </button>
                </div>
              ) : (
                filteredFaqs.map((item, idx) => {
                  const isOpen = openFaqIdx === idx;
                  return (
                    <div key={idx} className="p-4">
                      <button
                        type="button"
                        onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                        className="w-full flex items-start justify-between gap-3 text-left"
                      >
                        <span className="text-xs font-bold text-on-surface">{item.q}</span>
                        <span
                          className={`material-symbols-outlined text-[18px] text-outline flex-shrink-0 transition-transform ${
                            isOpen ? 'rotate-180 text-primary' : ''
                          }`}
                        >
                          expand_more
                        </span>
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.18 }}
                            className="overflow-hidden"
                          >
                            <div className="text-xs text-on-surface-variant leading-relaxed mt-2.5 pt-2 border-t border-outline-variant/15">
                              {renderFormattedBotText(item.a)}
                            </div>
                            <div className="mt-3 flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => startChat(undefined, `Tell me more about: ${item.q}`)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline bg-primary/5 px-2.5 py-1 rounded-lg"
                              >
                                <span className="material-symbols-outlined text-[14px]">chat</span>
                                Ask further in live chat
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 4: HISTORY */}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-outline-variant/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">history</span>
                  <span className="font-bold text-xs text-on-surface">Previous Discussions</span>
                </div>
                {savedSessions.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllHistory}
                    className="text-[11px] font-semibold text-error hover:underline"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {savedSessions.length === 0 ? (
                <div className="py-16 text-center text-on-surface-variant text-xs space-y-2">
                  <span className="material-symbols-outlined text-[36px] text-outline">history</span>
                  <p className="font-semibold">No saved conversation history yet</p>
                  <p className="text-[11px] text-outline max-w-xs mx-auto">
                    When you finish a support chat session, it will be automatically recorded here.
                  </p>
                  <button
                    type="button"
                    onClick={() => startChat()}
                    className="mt-2 text-primary font-bold hover:underline inline-block"
                  >
                    Start a New Chat →
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-outline-variant/20">
                  {savedSessions.map((session) => (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => restoreSession(session)}
                      className="w-full text-left px-5 py-3.5 hover:bg-surface-container-low transition-colors flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-primary">{session.label}</span>
                          <span className="text-[10px] text-outline">· {session.date}</span>
                        </div>
                        <p className="text-xs text-on-surface font-medium truncate mt-0.5">
                          {session.preview}
                        </p>
                        <p className="text-[10px] text-outline mt-0.5">
                          {session.messages.length} messages in discussion
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-outline group-hover:text-primary transition-colors flex-shrink-0">
                        arrow_forward
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security footer badge */}
      <p className="text-center text-[11px] text-outline mt-5 flex items-center justify-center gap-1.5">
        <span className="material-symbols-outlined text-[14px] text-green-500">verified_user</span>
        <span>Secure 256-bit TLS · EduTrack Student Support · Powered by Gemini AI</span>
      </p>
    </div>
  );
};

export default SupportChatbot;

// ─── Floating Chatbot Widget (FAB) ─────────────────────────────────────────────
// Sits on every screen in the bottom-right corner

export const ChatbotWidget: React.FC = () => {
  const { activeScreen, firebaseUser } = useEduTrack();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const widgetInputRef = useRef<HTMLInputElement>(null);

  // Hide on login screen and when on the dedicated Support Chatbot screen
  if (activeScreen === 'login' || activeScreen === 'support-chatbot') {
    return null;
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping]);

  const getAuthToken = useCallback(async (): Promise<string | null> => {
    if (firebaseUser) {
      try {
        return await firebaseUser.getIdToken();
      } catch {
        return null;
      }
    }
    return null;
  }, [firebaseUser]);

  const handleOpenWidget = useCallback(() => {
    setIsOpen(true);
    setUnreadCount(0);

    // Initial greeting if no messages yet (INSTANT - no artificial slow network delay!)
    if (messages.length === 0) {
      setMessages([
        {
          id: uid(),
          role: 'bot',
          text: `👋 Hi! I'm **EduTrack AI Support**. Ask me anything about your courses, fees, exams, or campus life.`,
          timestamp: getTimestamp(),
          quickReplies: [
            'How do I register for courses?',
            'What are the library hours?',
            'How do I pay fees?',
          ],
        },
      ]);
    }
    setTimeout(() => widgetInputRef.current?.focus(), 150);
  }, [messages.length]);

  const handleSendWidgetMessage = useCallback(
    async (text?: string) => {
      const question = (text ?? inputValue).trim();
      if (!question || isTyping) return;
      setInputValue('');

      const userMsg: ChatMessage = {
        id: uid(),
        role: 'user',
        text: question,
        timestamp: getTimestamp(),
      };

      const updatedHistory = [...messages, userMsg];
      setMessages(updatedHistory);
      setIsTyping(true);

      const formattedHistory = updatedHistory
        .filter((m) => m.role === 'user' || m.role === 'bot')
        .map((m) => ({
          role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
          content: m.text,
        }));

      try {
        const token = await getAuthToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch('/api/ai/support-chat', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            message: question,
            history: formattedHistory,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.reply === 'string') {
            setIsTyping(false);
            setMessages((prev) => [
              ...prev,
              {
                id: uid(),
                role: 'bot',
                text: data.reply,
                timestamp: getTimestamp(),
                quickReplies: data.suggestedFollowups,
              },
            ]);
            return;
          }
        }
      } catch (err) {
        console.warn('Widget API call failed, using safe answer:', err);
      }

      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'bot',
          text: `Thank you for asking about **${question}**. You can check the Student Portal or reach our helpdesk at **support@university.edu** (Block A, Room 101).`,
          timestamp: getTimestamp(),
          quickReplies: ['Library hours', 'Fee payment', 'Attendance rules'],
        },
      ]);
    },
    [inputValue, isTyping, messages, getAuthToken]
  );

  const handleWidgetKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendWidgetMessage();
    }
  };

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-[160] flex flex-col items-end gap-3">
      {/* Floating Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="widget-window"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-[340px] sm:w-[380px] bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col overflow-hidden"
            style={{ maxHeight: '520px' }}
          >
            {/* Widget Top Header */}
            <div className="bg-primary px-4 py-3 flex items-center justify-between text-on-primary flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-on-primary/15 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[18px]">support_agent</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">EduTrack AI Support</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                    <span className="text-[10px] text-on-primary/80 font-medium">Online · Ready</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-on-primary/15 text-on-primary/80 hover:text-on-primary transition-colors"
                  aria-label="Close support chat"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 min-h-[220px] max-h-[360px] bg-surface-container-low/20">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col mb-2.5 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`px-3 py-2 rounded-2xl text-xs leading-relaxed max-w-[85%] shadow-xs ${
                      m.role === 'user'
                        ? 'bg-primary text-on-primary rounded-br-xs font-medium'
                        : 'bg-surface-container-lowest text-on-surface rounded-bl-xs border border-outline-variant/30'
                    }`}
                  >
                    {m.role === 'user' ? m.text : renderFormattedBotText(m.text)}
                  </div>
                  <span className="text-[9px] text-outline mt-0.5 px-1">{m.timestamp}</span>

                  {/* Widget Quick Replies */}
                  {m.role === 'bot' && m.quickReplies && m.quickReplies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5 max-w-[90%]">
                      {m.quickReplies.map((qr) => (
                        <button
                          key={qr}
                          type="button"
                          onClick={() => handleSendWidgetMessage(qr)}
                          className="text-[10px] font-semibold px-2 py-1 rounded-full border border-primary/30 text-primary bg-surface-container-lowest hover:bg-primary hover:text-on-primary transition-all text-left"
                        >
                          {qr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant p-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Footer */}
            <div className="border-t border-outline-variant/20 p-2.5 bg-surface-container-lowest flex items-center gap-1.5 flex-shrink-0">
              <input
                ref={widgetInputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleWidgetKeyDown}
                placeholder="Ask EduTrack AI..."
                disabled={isTyping}
                className="flex-1 h-9 px-3 rounded-xl bg-surface-container text-on-surface placeholder:text-outline text-xs outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30"
              />
              <button
                type="button"
                onClick={() => handleSendWidgetMessage()}
                disabled={!inputValue.trim() || isTyping}
                className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-all flex-shrink-0 shadow-xs"
                aria-label="Send message"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (FAB) */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={isOpen ? () => setIsOpen(false) : handleOpenWidget}
        className="relative w-14 h-14 rounded-2xl bg-primary text-on-primary shadow-xl flex items-center justify-center hover:opacity-95 transition-all border-2 border-surface-container-lowest cursor-pointer"
        aria-label="Toggle student support chat"
      >
        <span className="material-symbols-outlined text-[26px]">
          {isOpen ? 'close' : 'support_agent'}
        </span>
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-on-error text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
            {unreadCount}
          </span>
        )}
      </motion.button>
    </div>
  );
};
