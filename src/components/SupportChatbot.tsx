import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ─── Types ───────────────────────────────────────────────────────────────────

type MessageRole = 'user' | 'bot' | 'system';

interface Message {
  id: number;
  role: MessageRole;
  text: string;
  timestamp: string;
  isTyping?: boolean;
  quickReplies?: QuickReply[];
  rating?: 'up' | 'down' | null;
}

interface QuickReply {
  label: string;
  value: string;
  icon?: string;
}

interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  { id: 'academics',  label: 'Academic Help',     icon: 'school',           color: 'bg-primary/10 text-primary' },
  { id: 'technical',  label: 'Technical Support',  icon: 'build_circle',     color: 'bg-secondary/10 text-secondary' },
  { id: 'financial',  label: 'Financial Aid',      icon: 'savings',          color: 'bg-tertiary/10 text-tertiary' },
  { id: 'wellbeing',  label: 'Student Wellbeing',  icon: 'favorite',         color: 'bg-error/10 text-error' },
  { id: 'campus',     label: 'Campus Services',    icon: 'location_city',    color: 'bg-primary/10 text-primary' },
  { id: 'other',      label: 'Other Enquiries',    icon: 'help_outline',     color: 'bg-outline/20 text-on-surface-variant' },
];

const GLOBAL_QUICK_REPLIES: QuickReply[] = [
  { label: '📋 Admission Status', value: 'What is my admission status?' },
  { label: '📅 Course Registration', value: 'How do I register for courses?' },
  { label: '💳 Fee Payment', value: 'How do I pay my tuition fees?' },
  { label: '📚 Library Hours', value: 'What are the library hours?' },
  { label: '🎓 Graduation Requirements', value: 'What are the graduation requirements?' },
  { label: '🩺 Health Services', value: 'Where is the student health centre?' },
];

const KNOWLEDGE_BASE: Record<string, string> = {
  admission: 'Your admission status can be tracked via the Student Portal under **My Applications**. For updates, contact admissions@university.edu or call +91-80-2345-6789 (Mon–Fri, 9am–5pm).',
  registration: 'Course registration opens **2 weeks before each semester**. Log in to the Student Portal → Academics → Course Registration. Prerequisites must be cleared first. Need help? Visit the Registrar\'s Office, Block A, Room 104.',
  fee: 'Tuition fees can be paid online via the Student Portal (Net Banking / UPI / Card), at the Finance Office (Block B), or by bank transfer. Instalment plans are available — apply before the semester starts.',
  library: 'The Central Library is open **Mon–Sat 8am–10pm** and **Sun 10am–6pm**. Digital resources are available 24/7 at lib.university.edu. Contact library@university.edu for remote access.',
  graduation: 'Graduation requirements: 160 credit hours, CGPA ≥ 6.0, cleared all dues, and completed the exit survey. Submit your graduation application 1 semester in advance via the Student Portal.',
  health: 'The Student Health Centre is located in **Block D, Ground Floor**, open Mon–Fri 8am–6pm and Sat 9am–1pm. Emergency contacts: 1800-XXX-XXXX (24×7). Mental health counselling is free for all students.',
  transcript: 'Official transcripts can be requested via the Registrar\'s Office portal. Processing takes **3–5 working days**. Express processing (24hrs) costs ₹500 extra. Digital transcripts are free.',
  hostel: 'Hostel allocation is based on merit and distance from campus. Apply during admission. Contact hostel@university.edu or visit the Hostel Office, Block H. Waiting list status is on the Student Portal.',
  scholarship: 'Various scholarships are available: Merit, Need-based, Sports, and Government schemes. Check all active scholarships at scholarships.university.edu. Applications open every June and December.',
  wifi: 'Campus WiFi (EduNet-5G) covers all buildings. Use your student ID and password to connect. For connectivity issues, raise a ticket at helpdesk.university.edu or call IT Support: Ext. 1234.',
  parking: 'Student parking is available in Lot P2 (behind Block C) and P4 (near Sports Complex). Register your vehicle at security.university.edu. Monthly pass: ₹300. Daily: ₹30.',
  default: 'Thanks for reaching out! I didn\'t find a specific answer, but I can help you get in touch with the right team. You can also:\n- **Email us:** support@university.edu\n- **Call:** +91-80-2345-6789 (Mon–Fri 9am–5pm)\n- **Visit:** Student Services Centre, Block A, Room 101\n\nWould you like to explore another topic?',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTimestamp(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function uid(): number {
  return Date.now() + Math.random();
}

function matchKnowledge(query: string): string {
  const q = query.toLowerCase();
  const keyMap: [string[], string][] = [
    [['admission', 'apply', 'applied', 'status', 'application'], 'admission'],
    [['register', 'registration', 'course', 'enrol', 'enroll', 'subject'], 'registration'],
    [['fee', 'fees', 'tuition', 'payment', 'pay', 'finance'], 'fee'],
    [['library', 'book', 'resource', 'hours', 'open'], 'library'],
    [['graduation', 'graduate', 'degree', 'cgpa', 'requirement'], 'graduation'],
    [['health', 'medical', 'doctor', 'mental', 'counsell', 'wellness'], 'health'],
    [['transcript', 'certificate', 'records', 'marksheet'], 'transcript'],
    [['hostel', 'dorm', 'accommodation', 'room', 'housing'], 'hostel'],
    [['scholarship', 'financial aid', 'bursary', 'grant'], 'scholarship'],
    [['wifi', 'wi-fi', 'internet', 'network', 'connectivity', 'it support'], 'wifi'],
    [['parking', 'vehicle', 'car', 'bike', 'lot'], 'parking'],
  ];

  for (const [keywords, key] of keyMap) {
    if (keywords.some((kw) => q.includes(kw))) {
      return KNOWLEDGE_BASE[key];
    }
  }
  return KNOWLEDGE_BASE.default;
}

function formatBotText(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const parts = line.split(/\*\*(.+?)\*\*/g);
    const formatted = parts.map((part, j) => (j % 2 === 1 ? <strong key={j}>{part}</strong> : part));
    return <React.Fragment key={i}>{formatted}{i < lines.length - 1 && <br />}</React.Fragment>;
  });
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
  onRate: (id: number, rating: 'up' | 'down') => void;
  onQuickReply: (value: string) => void;
}> = ({ msg, onRate, onQuickReply }) => {
  const isUser = msg.role === 'user';
  const isSystem = msg.role === 'system';

  if (isSystem) {
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
      initial={{ opacity: 0, y: 8 }}
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
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-primary text-on-primary rounded-br-sm'
              : 'bg-surface-container-low text-on-surface rounded-bl-sm border border-outline-variant/20'
          }`}
        >
          {isUser ? msg.text : formatBotText(msg.text)}
        </div>

        <div className={`flex items-center gap-2 mt-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[10px] text-outline">{msg.timestamp}</span>
          {!isUser && (
            <div className="flex gap-0.5">
              <button
                onClick={() => onRate(msg.id, 'up')}
                className={`p-0.5 rounded transition-colors ${msg.rating === 'up' ? 'text-primary' : 'text-outline hover:text-primary'}`}
                title="Helpful"
              >
                <span className="material-symbols-outlined text-[14px]">thumb_up</span>
              </button>
              <button
                onClick={() => onRate(msg.id, 'down')}
                className={`p-0.5 rounded transition-colors ${msg.rating === 'down' ? 'text-error' : 'text-outline hover:text-error'}`}
                title="Not helpful"
              >
                <span className="material-symbols-outlined text-[14px]">thumb_down</span>
              </button>
            </div>
          )}
        </div>

        {!isUser && msg.quickReplies && msg.quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {msg.quickReplies.map((qr) => (
              <button
                key={qr.value}
                onClick={() => onQuickReply(qr.value)}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full border border-primary/40 text-primary hover:bg-primary hover:text-on-primary transition-all"
              >
                {qr.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const CategoryCard: React.FC<{ cat: Category; onClick: (cat: Category) => void }> = ({ cat, onClick }) => (
  <button
    onClick={() => onClick(cat)}
    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border border-outline-variant/20 hover:border-primary/40 hover:shadow-md transition-all bg-surface-container-lowest group`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cat.color} group-hover:scale-110 transition-transform`}>
      <span className="material-symbols-outlined text-[20px]">{cat.icon}</span>
    </div>
    <span className="text-xs font-semibold text-on-surface text-center leading-tight">{cat.label}</span>
  </button>
);

// ─── Main Chatbot View ────────────────────────────────────────────────────────

type ChatView = 'home' | 'chat' | 'history' | 'faq';

const SupportChatbot: React.FC = () => {
  const [view, setView] = useState<ChatView>('home');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionLabel, setSessionLabel] = useState('');
  const [chatHistory, setChatHistory] = useState<{ id: number; label: string; preview: string; date: string }[]>([]);
  const [inputFocused, setInputFocused] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping]);

  const addBotMessage = useCallback((text: string, quickReplies?: QuickReply[], delayMs = 900) => {
    setIsTyping(true);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [...prev, {
          id: uid(),
          role: 'bot',
          text,
          timestamp: getTimestamp(),
          quickReplies,
          rating: null,
        }]);
        resolve();
      }, delayMs);
    });
  }, []);

  const startChat = useCallback(async (category?: Category) => {
    const label = category ? category.label : 'General Support';
    setSessionLabel(label);
    setMessages([{
      id: uid(),
      role: 'system',
      text: `Session started — ${label}`,
      timestamp: getTimestamp(),
    }]);
    setView('chat');

    await addBotMessage(
      `👋 Hello! I\'m **EduTrack Support**, your AI student services assistant.\n\nYou selected **${label}**. How can I help you today?`,
      GLOBAL_QUICK_REPLIES.slice(0, 4),
      800
    );
  }, [addBotMessage]);

  const handleSend = useCallback(async (text?: string) => {
    const query = (text ?? inputValue).trim();
    if (!query || isTyping) return;
    setInputValue('');

    setMessages((prev) => [...prev, {
      id: uid(),
      role: 'user',
      text: query,
      timestamp: getTimestamp(),
    }]);

    const response = matchKnowledge(query);
    await addBotMessage(response, [
      { label: '🔁 Ask another question', value: 'I have another question' },
      { label: '📞 Contact Support', value: 'How do I contact a human agent?' },
    ]);
  }, [inputValue, isTyping, addBotMessage]);

  const handleQuickReply = useCallback((value: string) => {
    handleSend(value);
  }, [handleSend]);

  const handleRate = useCallback((id: number, rating: 'up' | 'down') => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, rating } : m));
  }, []);

  const handleEndChat = useCallback(() => {
    const preview = messages.filter(m => m.role === 'user').slice(-1)[0]?.text ?? 'No messages';
    setChatHistory((prev) => [{
      id: uid(),
      label: sessionLabel,
      preview,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    }, ...prev.slice(0, 9)]);
    setMessages([]);
    setView('home');
  }, [messages, sessionLabel]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const FAQ_ITEMS = [
    { q: 'How do I reset my student portal password?', a: 'Visit portal.university.edu → Forgot Password. Enter your registered email and follow the OTP verification steps. Contact IT at Ext. 1234 if you face issues.' },
    { q: 'When does the next semester begin?', a: 'The academic calendar is published on the university website. Typically, Semester 1 starts in August and Semester 2 in January. Check academics.university.edu for exact dates.' },
    { q: 'How do I apply for leave of absence?', a: 'Submit a Leave of Absence form via the Student Portal → Academics → Leave Applications. Dean\'s approval is required for more than 2 weeks. Contact your department advisor for guidance.' },
    { q: 'Is internship credit available?', a: 'Yes! Internship credits (up to 6 credits) are available for approved industry internships. Register via the Career Services Portal and submit the supervisor evaluation form after completion.' },
    { q: 'How do I get a bonafide certificate?', a: 'Request a bonafide certificate via the Student Portal → Documents → Bonafide Certificate. Processing time: 1–2 working days. Collect from the Registrar\'s Office with your ID card.' },
    { q: 'What is the attendance policy?', a: 'A minimum of 75% attendance is required per subject to be eligible for examinations. Students below this threshold must apply for condonation with valid medical certificates.' },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto py-6">

      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm mb-4 overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-on-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[22px]">support_agent</span>
            </div>
            <div>
              <p className="text-sm font-bold text-on-primary leading-tight">EduTrack Support</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                <span className="text-[11px] text-on-primary/80 font-medium">Online · Avg reply under 1 min</span>
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
            ['home',    'home',         'Home'],
            ['chat',    'chat',         'Chat'],
            ['faq',     'help_center',  'FAQ'],
            ['history', 'history',      'History'],
          ] as [ChatView, string, string][]).map(([id, icon, label]) => (
            <button
              key={id}
              onClick={() => id === 'chat' ? (messages.length ? setView('chat') : startChat()) : setView(id)}
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

      {/* ── View: Home ────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {view === 'home' && (
          <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Hero */}
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-6 mb-4 border border-outline-variant/20 text-center">
              <div className="w-14 h-14 rounded-full bg-primary mx-auto flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-on-primary text-[28px]">support_agent</span>
              </div>
              <h2 className="text-lg font-bold text-on-surface mb-1">How can we help you?</h2>
              <p className="text-sm text-on-surface-variant mb-4">
                Get instant answers about academics, fees, campus life, and more.
              </p>
              <button
                onClick={() => startChat()}
                className="bg-primary text-on-primary font-semibold text-sm px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity shadow-sm"
              >
                Start a Conversation →
              </button>
            </div>

            {/* Categories */}
            <p className="text-xs font-bold uppercase tracking-wider text-outline px-1 mb-2">Select a topic</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mb-5">
              {CATEGORIES.map((cat) => (
                <CategoryCard key={cat.id} cat={cat} onClick={startChat} />
              ))}
            </div>

            {/* Quick Actions */}
            <p className="text-xs font-bold uppercase tracking-wider text-outline px-1 mb-2">Quick Questions</p>
            <div className="flex flex-wrap gap-2">
              {GLOBAL_QUICK_REPLIES.map((qr) => (
                <button
                  key={qr.value}
                  onClick={() => { startChat().then(() => handleSend(qr.value)); }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                >
                  {qr.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── View: Chat ───────────────────────────────────────────────── */}
        {view === 'chat' && (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Chat Window */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col h-[520px]">
              {/* Messages */}
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

              {/* Input Bar */}
              <div className={`border-t border-outline-variant/20 px-3 py-3 flex gap-2 items-end transition-shadow ${inputFocused ? 'shadow-inner bg-surface-container-low/50' : ''}`}>
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder="Type your question here…"
                    disabled={isTyping}
                    className="w-full h-11 px-4 rounded-full bg-surface-container text-on-surface placeholder:text-outline text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-60"
                  />
                </div>
                <button
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isTyping}
                  className="w-11 h-11 flex-shrink-0 rounded-full bg-primary text-on-primary flex items-center justify-center hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </button>
              </div>
            </div>

            {/* Suggested Replies below chat */}
            {messages.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {GLOBAL_QUICK_REPLIES.slice(0, 3).map((qr) => (
                  <button
                    key={qr.value}
                    onClick={() => handleQuickReply(qr.value)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                  >
                    {qr.label}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── View: FAQ ────────────────────────────────────────────────── */}
        {view === 'faq' && (
          <motion.div key="faq" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm divide-y divide-outline-variant/20">
              <div className="px-5 py-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">help_center</span>
                <span className="font-bold text-sm text-on-surface">Frequently Asked Questions</span>
              </div>
              {FAQ_ITEMS.map((item, i) => (
                <FaqItem key={i} question={item.q} answer={item.a} onAskMore={(q) => { startChat().then(() => handleSend(q)); }} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── View: History ─────────────────────────────────────────────── */}
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
                  {chatHistory.map((session) => (
                    <div key={session.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-surface-container/50 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-primary text-[18px]">chat</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-primary">{session.label}</p>
                        <p className="text-sm text-on-surface font-medium truncate mt-0.5">{session.preview}</p>
                        <p className="text-[11px] text-outline mt-0.5">{session.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <p className="text-center text-[11px] text-outline mt-5 flex items-center justify-center gap-1">
        <span className="material-symbols-outlined text-[14px] text-green-500">verified_user</span>
        Secure · 256-bit TLS · EduTrack AI Student Support
      </p>
    </div>
  );
};

// ─── FAQ Accordion Item ───────────────────────────────────────────────────────

const FaqItem: React.FC<{ question: string; answer: string; onAskMore: (q: string) => void }> = ({
  question, answer, onAskMore,
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="px-5 py-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-3 text-left"
      >
        <span className="text-sm font-semibold text-on-surface">{question}</span>
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
            <p className="text-sm text-on-surface-variant leading-relaxed mt-2">{answer}</p>
            <button
              onClick={() => onAskMore(question)}
              className="mt-2 text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">chat</span>
              Ask in chat
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupportChatbot;
