import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useEduTrack } from '../context/EduTrackContext.tsx';

// ─── Types ───────────────────────────────────────────────────────────────────

type MessageRole = 'user' | 'bot' | 'system';

interface Message {
  id: number;
  role: MessageRole;
  text: string;
  timestamp: string;
  rating?: 'up' | 'down' | null;
  quickReplies?: string[];
}

interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  { id: 'academics',  label: 'Academic Help',    icon: 'school',        color: 'text-primary',   bg: 'bg-primary/10' },
  { id: 'technical',  label: 'Tech Support',     icon: 'build_circle',  color: 'text-secondary', bg: 'bg-secondary/10' },
  { id: 'financial',  label: 'Financial Aid',    icon: 'savings',       color: 'text-tertiary',  bg: 'bg-tertiary/10' },
  { id: 'wellbeing',  label: 'Wellbeing',        icon: 'favorite',      color: 'text-error',     bg: 'bg-error/10' },
  { id: 'campus',     label: 'Campus Services',  icon: 'location_city', color: 'text-primary',   bg: 'bg-primary/10' },
  { id: 'other',      label: 'Other',            icon: 'help_outline',  color: 'text-outline',   bg: 'bg-surface-container' },
];

const QUICK_STARTERS = [
  'How do I register for courses?',
  'What are the library hours?',
  'How do I pay my tuition fees?',
  'What is the attendance policy?',
  'How do I get a bonafide certificate?',
  'Where is the student health centre?',
];

const FAQ_ITEMS = [
  { q: 'How do I reset my student portal password?', a: 'Visit the Student Portal → Forgot Password. Enter your registered email and follow the OTP steps. Contact IT at Ext. 1234 for further help.' },
  { q: 'When does the next semester begin?', a: 'Semester 1 typically starts in August and Semester 2 in January. Check academics.university.edu for the exact academic calendar.' },
  { q: 'How do I apply for leave of absence?', a: "Submit a Leave of Absence form via the Student Portal → Academics → Leave Applications. Dean's approval is required for more than 2 weeks." },
  { q: 'Is internship credit available?', a: 'Yes! Up to 6 credits are available for approved industry internships. Register via the Career Services Portal and submit the supervisor evaluation form after completion.' },
  { q: 'What is the attendance policy?', a: 'A minimum of 75% attendance is required per subject to be eligible for examinations. Students below this threshold must apply for condonation with valid medical certificates.' },
  { q: 'How do I get a bonafide certificate?', a: "Request it via Student Portal → Documents → Bonafide Certificate. Processing time: 1–2 working days. Collect from the Registrar's Office with your ID card." },
];

type ChatView = 'home' | 'chat' | 'faq' | 'history';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid(): number { return Date.now() + Math.random(); }
function getTimestamp(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Local fallback knowledge base (used when API unavailable)
const LOCAL_KB: Record<string, string> = {
  registration: 'Course registration opens 2 weeks before each semester. Log in to the Student Portal → Academics → Course Registration. Prerequisites must be cleared first.',
  library: 'The Central Library is open Mon–Sat 8am–10pm and Sun 10am–6pm. Digital resources are available 24/7 at lib.university.edu.',
  fee: 'Tuition fees can be paid online via the Student Portal (Net Banking / UPI / Card), at the Finance Office, or by bank transfer. Instalment plans are available.',
  attendance: 'A minimum of 75% attendance is required per subject. Students below this must apply for condonation with valid documentation.',
  transcript: "Official transcripts can be requested via the Registrar's Office portal. Processing takes 3–5 working days. Express processing (24hrs) costs ₹500 extra.",
  hostel: 'Hostel allocation is based on merit and distance from campus. Contact hostel@university.edu or visit the Hostel Office, Block H.',
  scholarship: 'Various scholarships are available: Merit, Need-based, Sports, and Government schemes. Applications open every June and December.',
  health: 'The Student Health Centre is located in Block D, Ground Floor. Open Mon–Fri 8am–6pm and Sat 9am–1pm. Emergency: 1800-XXX-XXXX.',
  wifi: 'Campus WiFi (EduNet-5G) covers all buildings. Use your student ID and password. For connectivity issues, raise a ticket at helpdesk.university.edu.',
  default: "Thanks for reaching out! I'm connecting to the AI support system. If that fails, please email support@university.edu or call +91-80-2345-6789 (Mon–Fri 9am–5pm).",
};

function localFallback(query: string): string {
  const q = query.toLowerCase();
  const map: [string[], string][] = [
    [['register', 'registration', 'course', 'enrol'], 'registration'],
    [['library', 'book', 'hours', 'open'], 'library'],
    [['fee', 'fees', 'tuition', 'payment', 'pay'], 'fee'],
    [['attendance', 'absent', '75%'], 'attendance'],
    [['transcript', 'certificate', 'records'], 'transcript'],
    [['hostel', 'dorm', 'accommodation', 'room'], 'hostel'],
    [['scholarship', 'financial aid', 'bursary'], 'scholarship'],
    [['health', 'medical', 'doctor', 'mental', 'counsell'], 'health'],
    [['wifi', 'wi-fi', 'internet', 'network', 'it support'], 'wifi'],
  ];
  for (const [kws, key] of map) {
    if (kws.some((kw) => q.includes(kw))) return LOCAL_KB[key];
  }
  return LOCAL_KB.default;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const TypingIndicator: React.FC = () => (
  <div className="flex items-end gap-2 mb-3">
    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
      <span className="material-symbols-outlined text-on-primary text-[14px]">support_agent</span>
    </div>
    <div className="bg-surface-container-low rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-outline animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }}
        />
      ))}
    </div>
  </div>
);

const MessageBubble: React.FC<{
  msg: Message;
  onRate: (id: number, r: 'up' | 'down') => void;
  onQuickReply: (v: string) => void;
}> = ({ msg, onRate, onQuickReply }) => {
  const isUser = msg.role === 'user';

  if (msg.role === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[11px] font-semibold text-outline bg-surface-container px-3 py-1 rounded-full">
          {msg.text}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-end gap-2 mb-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mb-1">
          <span className="material-symbols-outlined text-on-primary text-[14px]">support_agent</span>
        </div>
      )}
      <div className={`flex flex-col max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-primary text-on-primary rounded-br-sm'
              : 'bg-surface-container-low text-on-surface rounded-bl-sm border border-outline-variant/20'
          }`}
        >
          {msg.text}
        </div>

        <div className={`flex items-center gap-1.5 mt-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[10px] text-outline">{msg.timestamp}</span>
          {!isUser && (
            <div className="flex gap-0.5">
              <button
                onClick={() => onRate(msg.id, 'up')}
                className={`p-0.5 rounded transition-colors ${msg.rating === 'up' ? 'text-primary' : 'text-outline hover:text-primary'}`}
              >
                <span className="material-symbols-outlined text-[13px]">thumb_up</span>
              </button>
              <button
                onClick={() => onRate(msg.id, 'down')}
                className={`p-0.5 rounded transition-colors ${msg.rating === 'down' ? 'text-error' : 'text-outline hover:text-error'}`}
              >
                <span className="material-symbols-outlined text-[13px]">thumb_down</span>
              </button>
            </div>
          )}
        </div>

        {!isUser && msg.quickReplies && msg.quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {msg.quickReplies.map((qr) => (
              <button
                key={qr}
                onClick={() => onQuickReply(qr)}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full border border-primary/40 text-primary hover:bg-primary hover:text-on-primary transition-all"
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

const FaqItem: React.FC<{ q: string; a: string; onAsk: (q: string) => void }> = ({ q, a, onAsk }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="px-5 py-3">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-start justify-between gap-3 text-left">
        <span className="text-sm font-semibold text-on-surface">{q}</span>
        <span className={`material-symbols-outlined text-[20px] text-outline flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-on-surface-variant leading-relaxed mt-2">{a}</p>
            <button
              onClick={() => onAsk(q)}
              className="mt-2 text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[13px]">chat</span>
              Ask in chat
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main SupportChatbot Page View ───────────────────────────────────────────

const SupportChatbot: React.FC = () => {
  const { firebaseUser } = useEduTrack();
  const [view, setView] = useState<ChatView>('home');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionLabel, setSessionLabel] = useState('General Support');
  const [sessionCategory, setSessionCategory] = useState<string | undefined>(undefined);
  const [chatHistory, setChatHistory] = useState<{ id: number; label: string; preview: string; date: string }[]>([]);
  const [inputFocused, setInputFocused] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping]);

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    if (firebaseUser) {
      try {
        const token = await firebaseUser.getIdToken();
        return { Authorization: `Bearer ${token}` };
      } catch { return {}; }
    }
    return {};
  }, [firebaseUser]);

  const addBotMessage = useCallback((text: string, quickReplies?: string[], delayMs = 0) => {
    setIsTyping(true);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [...prev, {
          id: uid(), role: 'bot', text, timestamp: getTimestamp(),
          rating: null, quickReplies,
        }]);
        resolve();
      }, delayMs);
    });
  }, []);

  // Convert messages to AI history format
  const buildHistory = useCallback((msgs: Message[]) =>
    msgs
      .filter((m) => m.role === 'user' || m.role === 'bot')
      .map((m) => ({ role: m.role === 'user' ? 'user' as const : 'assistant' as const, content: m.text })),
    []
  );

  const callSupportApi = useCallback(async (
    message: string,
    history: Message[],
    category?: string
  ): Promise<{ reply: string; suggestedFollowups: string[] }> => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/ai/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ message, history: buildHistory(history), category }),
      });
      if (!res.ok) throw new Error('API error');
      return await res.json() as { reply: string; suggestedFollowups: string[] };
    } catch {
      return { reply: localFallback(message), suggestedFollowups: [] };
    }
  }, [getAuthHeaders, buildHistory]);

  const startChat = useCallback(async (category?: Category) => {
    const label = category?.label ?? 'General Support';
    setSessionLabel(label);
    setSessionCategory(category?.id);
    const initMsgs: Message[] = [{
      id: uid(), role: 'system', text: `Session started — ${label}`, timestamp: getTimestamp(),
    }];
    setMessages(initMsgs);
    setView('chat');

    setIsTyping(true);
    const { reply, suggestedFollowups } = await callSupportApi(
      `Hello, I need help with ${label}`,
      [],
      category?.id
    );
    setIsTyping(false);
    setMessages((prev) => [...prev, {
      id: uid(), role: 'bot',
      text: `👋 Hi! I'm your EduTrack Support assistant. ${reply}`,
      timestamp: getTimestamp(), rating: null,
      quickReplies: suggestedFollowups.length ? suggestedFollowups : QUICK_STARTERS.slice(0, 3),
    }]);
  }, [callSupportApi]);

  const handleSend = useCallback(async (text?: string) => {
    const query = (text ?? inputValue).trim();
    if (!query || isTyping) return;
    setInputValue('');

    const userMsg: Message = { id: uid(), role: 'user', text: query, timestamp: getTimestamp() };
    setMessages((prev) => {
      const updated = [...prev, userMsg];

      // Kick off async AI call
      (async () => {
        setIsTyping(true);
        const { reply, suggestedFollowups } = await callSupportApi(query, updated, sessionCategory);
        setIsTyping(false);
        setMessages((m) => [...m, {
          id: uid(), role: 'bot', text: reply, timestamp: getTimestamp(),
          rating: null,
          quickReplies: suggestedFollowups.length ? suggestedFollowups : undefined,
        }]);
      })();

      return updated;
    });
  }, [inputValue, isTyping, callSupportApi, sessionCategory]);

  const handleQuickReply = useCallback((v: string) => handleSend(v), [handleSend]);

  const handleRate = useCallback((id: number, r: 'up' | 'down') => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, rating: r } : m));
  }, []);

  const handleEndChat = useCallback(() => {
    const preview = messages.filter((m) => m.role === 'user').slice(-1)[0]?.text ?? 'No messages';
    setChatHistory((prev) => [{
      id: uid(), label: sessionLabel, preview,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    }, ...prev.slice(0, 9)]);
    setMessages([]);
    setView('home');
  }, [messages, sessionLabel]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const goToChat = () => messages.length ? setView('chat') : startChat();

  return (
    <div className="max-w-2xl mx-auto py-6">
      {/* Header Card */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm mb-4 overflow-hidden">
        <div className="bg-primary px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-on-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[22px]">support_agent</span>
            </div>
            <div>
              <p className="text-sm font-bold text-on-primary">EduTrack Support · AI Powered</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                <span className="text-[11px] text-on-primary/80 font-medium">Online · Gemini AI</span>
              </div>
            </div>
          </div>
          {view === 'chat' && (
            <button
              onClick={handleEndChat}
              className="text-xs font-semibold text-on-primary/80 hover:text-on-primary border border-on-primary/30 px-3 py-1.5 rounded-full transition-colors"
            >
              End Chat
            </button>
          )}
        </div>

        {/* Nav Tabs */}
        <div className="flex border-b border-outline-variant/20">
          {([
            ['home',    'home',        'Home'],
            ['chat',    'chat',        'Chat'],
            ['faq',     'help_center', 'FAQ'],
            ['history', 'history',     'History'],
          ] as [ChatView, string, string][]).map(([id, icon, label]) => (
            <button
              key={id}
              onClick={() => id === 'chat' ? goToChat() : setView(id)}
              className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 text-[11px] font-semibold transition-colors border-b-2 ${
                view === id
                  ? 'text-primary border-primary'
                  : 'text-on-surface-variant border-transparent hover:text-on-surface hover:bg-surface-container/50'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Views */}
      <AnimatePresence mode="wait">
        {/* HOME */}
        {view === 'home' && (
          <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-6 mb-4 border border-outline-variant/20 text-center">
              <div className="w-14 h-14 rounded-full bg-primary mx-auto flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-on-primary text-[28px]">support_agent</span>
              </div>
              <h2 className="text-lg font-bold text-on-surface mb-1">How can we help you today?</h2>
              <p className="text-sm text-on-surface-variant mb-4">
                Get instant AI-powered answers about academics, fees, campus life, and more.
              </p>
              <button
                onClick={() => startChat()}
                className="bg-primary text-on-primary font-semibold text-sm px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity shadow-sm"
              >
                Start a Conversation →
              </button>
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-outline px-1 mb-2">Select a topic</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mb-5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => startChat(cat)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-outline-variant/20 hover:border-primary/40 hover:shadow-md transition-all bg-surface-container-lowest group"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cat.bg} ${cat.color} group-hover:scale-110 transition-transform`}>
                    <span className="material-symbols-outlined text-[20px]">{cat.icon}</span>
                  </div>
                  <span className="text-xs font-semibold text-on-surface text-center leading-tight">{cat.label}</span>
                </button>
              ))}
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-outline px-1 mb-2">Quick Questions</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_STARTERS.map((q) => (
                <button
                  key={q}
                  onClick={() => startChat().then(() => handleSend(q))}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* CHAT */}
        {view === 'chat' && (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col h-[520px]">
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {messages.length === 0 && !isTyping && (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[40px] text-outline">chat_bubble_outline</span>
                    <p className="text-sm font-medium">Your conversation will appear here</p>
                  </div>
                )}
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} onRate={handleRate} onQuickReply={handleQuickReply} />
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={chatEndRef} />
              </div>

              <div className={`border-t border-outline-variant/20 px-3 py-3 flex gap-2 items-center transition-shadow ${inputFocused ? 'bg-surface-container-low/40' : ''}`}>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder="Type your question here…"
                  disabled={isTyping}
                  className="flex-1 h-11 px-4 rounded-full bg-surface-container text-on-surface placeholder:text-outline text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-60"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isTyping}
                  className="w-11 h-11 flex-shrink-0 rounded-full bg-primary text-on-primary flex items-center justify-center hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </button>
              </div>
            </div>

            {messages.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {QUICK_STARTERS.slice(0, 3).map((q) => (
                  <button
                    key={q}
                    onClick={() => handleQuickReply(q)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* FAQ */}
        {view === 'faq' && (
          <motion.div key="faq" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm divide-y divide-outline-variant/20">
              <div className="px-5 py-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">help_center</span>
                <span className="font-bold text-sm text-on-surface">Frequently Asked Questions</span>
              </div>
              {FAQ_ITEMS.map((item, i) => (
                <FaqItem
                  key={i}
                  q={item.q}
                  a={item.a}
                  onAsk={(q) => { startChat().then(() => handleSend(q)); }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* HISTORY */}
        {view === 'history' && (
          <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-outline-variant/20 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">history</span>
                <span className="font-bold text-sm text-on-surface">Chat History</span>
                {chatHistory.length > 0 && (
                  <span className="ml-auto text-xs font-semibold text-outline bg-surface-container px-2 py-0.5 rounded-full">
                    {chatHistory.length} session{chatHistory.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {chatHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[40px] text-outline">history</span>
                  <p className="text-sm font-medium">No previous conversations</p>
                  <button onClick={() => setView('home')} className="text-xs font-semibold text-primary hover:underline">
                    Start your first chat →
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-outline-variant/20">
                  {chatHistory.map((s) => (
                    <div key={s.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-surface-container/50 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-primary text-[18px]">chat</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-primary">{s.label}</p>
                        <p className="text-sm text-on-surface font-medium truncate mt-0.5">{s.preview}</p>
                        <p className="text-[11px] text-outline mt-0.5">{s.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-center text-[11px] text-outline mt-5 flex items-center justify-center gap-1">
        <span className="material-symbols-outlined text-[13px] text-green-500">verified_user</span>
        Secure · 256-bit TLS · Powered by Gemini AI
      </p>
    </div>
  );
};

export default SupportChatbot;

// ─── Floating Chatbot Widget ──────────────────────────────────────────────────
// Use <ChatbotWidget /> in AppShell to show a floating FAB on all screens

type WidgetView = 'closed' | 'home' | 'chat';

export const ChatbotWidget: React.FC = () => {
  const { firebaseUser, activeScreen } = useEduTrack();
  const [open, setOpen] = useState(false);
  const [widgetView, setWidgetView] = useState<WidgetView>('home');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Hide on login or the dedicated chatbot page
  if (activeScreen === 'login' || activeScreen === 'support-chatbot') return null;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping]);

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    if (firebaseUser) {
      try {
        const token = await firebaseUser.getIdToken();
        return { Authorization: `Bearer ${token}` };
      } catch { return {}; }
    }
    return {};
  }, [firebaseUser]);

  const addBotMsg = useCallback((text: string, quickReplies?: string[]) => {
    setIsTyping(true);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setIsTyping(false);
        const msg: Message = { id: uid(), role: 'bot', text, timestamp: getTimestamp(), rating: null, quickReplies };
        setMessages((p) => [...p, msg]);
        if (!open) setUnread((u) => u + 1);
        resolve();
      }, 800);
    });
  }, [open]);

  const buildHistory = (msgs: Message[]) =>
    msgs.filter((m) => m.role === 'user' || m.role === 'bot')
      .map((m) => ({ role: m.role === 'user' ? 'user' as const : 'assistant' as const, content: m.text }));

  const callApi = useCallback(async (message: string, history: Message[]) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/ai/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ message, history: buildHistory(history) }),
      });
      if (!res.ok) throw new Error('API error');
      return await res.json() as { reply: string; suggestedFollowups: string[] };
    } catch {
      return { reply: localFallback(message), suggestedFollowups: [] };
    }
  }, [getAuthHeaders]);

  const handleOpen = useCallback(async () => {
    setOpen(true);
    setUnread(0);
    setWidgetView('chat');
    if (messages.length === 0) {
      setIsTyping(true);
      const { reply, suggestedFollowups } = await callApi('Hello, I just opened the chat widget', []);
      setIsTyping(false);
      setMessages([{
        id: uid(), role: 'bot',
        text: `👋 Hi! I'm EduTrack Support. ${reply}`,
        timestamp: getTimestamp(), rating: null,
        quickReplies: suggestedFollowups.length ? suggestedFollowups : QUICK_STARTERS.slice(0, 3),
      }]);
    }
  }, [messages, callApi]);

  const handleSend = useCallback(async (text?: string) => {
    const query = (text ?? inputValue).trim();
    if (!query || isTyping) return;
    setInputValue('');
    const userMsg: Message = { id: uid(), role: 'user', text: query, timestamp: getTimestamp() };
    setMessages((prev) => {
      const updated = [...prev, userMsg];
      (async () => {
        setIsTyping(true);
        const { reply, suggestedFollowups } = await callApi(query, updated);
        setIsTyping(false);
        setMessages((m) => [...m, {
          id: uid(), role: 'bot', text: reply, timestamp: getTimestamp(), rating: null,
          quickReplies: suggestedFollowups.length ? suggestedFollowups : undefined,
        }]);
      })();
      return updated;
    });
  }, [inputValue, isTyping, callApi]);

  const handleRate = (id: number, r: 'up' | 'down') => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, rating: r } : m));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 z-[200] flex flex-col items-end gap-3">
      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="widget-panel"
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-80 sm:w-96 bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/20 flex flex-col overflow-hidden"
            style={{ maxHeight: '480px' }}
          >
            {/* Widget Header */}
            <div className="bg-primary px-4 py-3 flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-on-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[18px]">support_agent</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-on-primary truncate">EduTrack Support</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                  <span className="text-[10px] text-on-primary/75 font-medium">AI-Powered · Online</span>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-on-primary/70 hover:text-on-primary hover:bg-on-primary/10 transition-colors flex-shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 min-h-0">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} onRate={handleRate} onQuickReply={(v) => handleSend(v)} />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-outline-variant/20 px-3 py-2.5 flex gap-2 items-center flex-shrink-0">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question…"
                disabled={isTyping}
                className="flex-1 h-9 px-3 rounded-full bg-surface-container text-on-surface placeholder:text-outline text-xs outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-60"
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isTyping}
                className="w-9 h-9 flex-shrink-0 rounded-full bg-primary text-on-primary flex items-center justify-center hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <span className="material-symbols-outlined text-[17px]">send</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={open ? () => setOpen(false) : handleOpen}
        className="relative w-14 h-14 rounded-full bg-primary text-on-primary shadow-xl flex items-center justify-center hover:opacity-90 transition-opacity"
        aria-label="Open Support Chat"
      >
        <span className="material-symbols-outlined text-[26px]">
          {open ? 'close' : 'support_agent'}
        </span>
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-on-error text-[10px] font-bold rounded-full flex items-center justify-center shadow">
            {unread}
          </span>
        )}
      </motion.button>
    </div>
  );
};
