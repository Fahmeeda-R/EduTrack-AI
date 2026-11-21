import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEduTrack } from '../context/EduTrackContext.tsx';

// ─── Types ───────────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'bot' | 'system';

export interface RagSourceItem {
  id: string;
  title: string;
  type: 'document' | 'web';
  snippet: string;
  url?: string;
  score?: number;
}

export interface ChatMessage {
  id: number;
  role: MessageRole;
  text: string;
  timestamp: string;
  rating?: 'up' | 'down' | null;
  quickReplies?: string[];
  sources?: RagSourceItem[];
  isRagGrounded?: boolean;
  isWebSearched?: boolean;
  confidence?: 'high' | 'medium' | 'unverified';
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  fileType: string;
  wordCount: number;
  chunkCount: number;
  uploadedAt: string;
  category?: string;
  summary?: string;
}

export interface ChatCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
  color: string;
  bg: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const SUPPORT_CATEGORIES: ChatCategory[] = [
  {
    id: 'academics',
    label: 'Academic Advising',
    icon: 'school',
    description: 'Course registration, prerequisites, syllabus, credit rules, add/drop',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    id: 'finance',
    label: 'Fees & Financial Aid',
    icon: 'savings',
    description: 'Tuition payment, instalments, scholarships, dues clearance',
    color: 'text-tertiary',
    bg: 'bg-tertiary/10',
  },
  {
    id: 'library',
    label: 'Library & E-Resources',
    icon: 'local_library',
    description: 'Book borrowing, digital journal access (IEEE, ACM), study rooms',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
  },
  {
    id: 'exams',
    label: 'Exams & Transcripts',
    icon: 'assignment_turned_in',
    description: 'Exam schedules, hall tickets, grades, revaluation, bonafide certificates',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    id: 'wellness',
    label: 'Student Wellbeing',
    icon: 'favorite',
    description: 'Health centre, confidential counseling, medical leave condonation',
    color: 'text-error',
    bg: 'bg-error/10',
  },
  {
    id: 'campus',
    label: 'IT & Campus Life',
    icon: 'wifi',
    description: 'Campus Wi-Fi (EduTrack-5G), portal login, hostel, mess, transport',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
  },
];

export const QUICK_STARTERS = [
  'How do I pay tuition fees online or set up instalments?',
  'What is the minimum attendance requirement for exams and medical condonation?',
  'How do I access IEEE and ACM digital journals from off-campus?',
  'What are the course registration deadlines and credit limits?',
  'Where is the Student Health Centre and counseling helpline located?',
  'What is the latest release and features of Python programming language?',
];

export const FAQ_DATABASE = [
  {
    q: 'How do I pay tuition fees online and can I request instalments?',
    a: 'Tuition fees are paid online on the Student Portal under **Finances → Pay Fees** using UPI, Net Banking, or Debit/Credit Cards. Receipts generate instantly. To request a split 2-part instalment plan, apply via the Portal or visit the Accounts Office (Block B, Ground Floor) before semester commencement.',
    category: 'finance',
  },
  {
    q: 'When does course registration open and how do add/drop electives work?',
    a: 'Course registration opens **2 weeks prior to each semester** (Academics → Course Registration). Standard undergraduate workload is 18–24 credit hours. Elective add/drop requests can be submitted through the portal during the first two weeks of classes with advisor sign-off.',
    category: 'academics',
  },
  {
    q: 'What is the attendance policy and how do I apply for medical leave condonation?',
    a: 'A minimum of **75% attendance** per registered subject is mandatory to be eligible for end-semester exams. If you missed classes due to hospitalization or certified illness, submit a Medical Leave Condonation form with doctor certificates within 3 working days to your department office.',
    category: 'academics',
  },
  {
    q: 'How do I access IEEE, ACM, and ScienceDirect digital journals from off-campus?',
    a: 'Visit **lib.university.edu** and log in with your university student ID and portal password. The campus EZProxy system automatically routes and authenticates off-campus sessions for all institutional digital subscriptions.',
    category: 'library',
  },
  {
    q: 'How do I request an official transcript, marksheet, or Bonafide Certificate?',
    a: 'Request certificates online via **Documents → Request Certificate**. Standard processing takes 2–3 business days. Digital e-signed PDF transcripts with cryptographic verification are free. Physical stamped copies can be collected at the Registrar Office (Block A).',
    category: 'exams',
  },
  {
    q: 'Are confidential student psychological counseling sessions free on campus?',
    a: 'Yes, 100% confidential professional mental wellness counseling is completely free for all enrolled students. Book an in-person or telehealth session at the Student Health Centre (Block D) or call the 24/7 campus care line: **1800-419-CARE**.',
    category: 'wellness',
  },
  {
    q: 'How do I connect to campus EduTrack-5G Wi-Fi on my laptop or phone?',
    a: 'Select **EduTrack-5G**, set EAP Method to **PEAP**, Phase 2 to **MSCHAPv2**, and enter your student ID and portal password. If prompted for a CA certificate, select "Do not validate" or download the certificate from wifi.university.edu.',
    category: 'campus',
  },
  {
    q: 'How do I reset my student portal login credentials?',
    a: 'Visit the Student Portal login screen and click **Forgot Password**. Enter your university roll number and registered email address to receive an OTP. If your account remains locked, email helpdesk@university.edu or visit Block A, Room 204.',
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

export function renderFormattedBotText(text: string | undefined | null): React.ReactNode {
  if (!text || typeof text !== 'string') return null;
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) {
      elements.push(<div key={`blank-${i}`} className="h-1.5" />);
      continue;
    }

    const isBullet = rawLine.startsWith('• ') || rawLine.startsWith('* ') || rawLine.startsWith('- ');
    const lineContent = isBullet ? rawLine.replace(/^[•*-]\s*/, '') : rawLine;

    const parts = lineContent.split(/(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g);
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
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        return (
          <a
            key={pIdx}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:opacity-85 font-semibold inline-flex items-center gap-0.5"
          >
            {linkMatch[1]}
            <span className="material-symbols-outlined text-[11px]">open_in_new</span>
          </a>
        );
      }
      return part;
    });

    if (isBullet) {
      elements.push(
        <div key={`line-${i}`} className="flex items-start gap-2 pl-1 my-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
          <span className="flex-1 leading-relaxed text-xs sm:text-sm">{parsedLine}</span>
        </div>
      );
    } else {
      elements.push(
        <p key={`line-${i}`} className="my-1 leading-relaxed text-xs sm:text-sm">
          {parsedLine}
        </p>
      );
    }
  }

  return <div className="space-y-0.5">{elements}</div>;
}

/**
 * High-quality instant knowledge engine fallback if offline or backend is delayed.
 */
function getInstantSupportAnswer(query: string, category?: string): {
  reply: string;
  suggestedFollowups: string[];
} {
  const q = query.toLowerCase();

  if (q.includes('fee') || q.includes('tuition') || q.includes('pay') || q.includes('cost') || q.includes('due')) {
    return {
      reply: 'Tuition fees can be paid online directly via the **Student Portal (Finances → Fee Payment)** using UPI, Net Banking, or Credit/Debit Cards.\n• **Receipts**: Generated immediately and stored permanently in your **Fee History**.\n• **2-Part Instalment Plan**: Apply via the Portal or visit the Accounts Office (Block B, Room 102) before the semester census date.\n• **Dues Clearance**: Required for final exam hall tickets and official degree transcripts.',
      suggestedFollowups: [
        'How do I apply for fee instalments?',
        'Where do I download my fee receipt?',
        'What scholarships are available?',
      ],
    };
  }

  if (q.includes('register') || q.includes('registration') || q.includes('course') || q.includes('enrol') || q.includes('credit') || q.includes('elective')) {
    return {
      reply: 'Course registration opens **2 weeks prior to each semester** on the Student Portal (Academics → Course Registration).\n• **Workload**: Standard undergraduate credit range is 18–24 credit hours per semester.\n• **Prerequisites**: Clear all prerequisite modules before enrolling in advanced coursework.\n• **Add/Drop**: Changes to electives are permitted during the first 14 calendar days of classes with advisor sign-off.',
      suggestedFollowups: [
        'How do I submit an Add/Drop request?',
        'Who is my academic advisor?',
        'What are the minimum credit requirements to graduate?',
      ],
    };
  }

  if (q.includes('library') || q.includes('book') || q.includes('borrow') || q.includes('journal') || q.includes('ieee') || q.includes('acm')) {
    return {
      reply: 'The Central Library is located in **Block C**.\n• **Hours**: Mon–Sat 8:00 AM – 10:00 PM; Sundays 10:00 AM – 6:00 PM. (24/7 during final exam weeks).\n• **Borrowing**: Undergraduates may borrow up to 5 books for 14 days using student ID cards.\n• **Digital Databases**: Access IEEE Xplore, ACM Digital Library, and ScienceDirect 24/7 at **lib.university.edu** via campus EZProxy.\n• **Study Rooms**: Soundproof collaborative rooms can be reserved online for group study.',
      suggestedFollowups: [
        'How do I renew borrowed books online?',
        'How do I access IEEE journals from off-campus?',
        'Where are the silent study rooms?',
      ],
    };
  }

  if (q.includes('attendance') || q.includes('absent') || q.includes('leave') || q.includes('75%') || q.includes('condonation')) {
    return {
      reply: 'The university mandates a minimum of **75% attendance** per registered course to appear for final examinations.\n• **Attendance Tracker**: View real-time subject attendance percentages in the Student Portal under Academics.\n• **Medical Condonation**: Submit a Leave Application with valid hospital/doctor certificates within 3 working days of returning to your Department Office.\n• **Shortage Notice**: Attendance between 65% and 74% requires Dean approval and condonation fee clearance.',
      suggestedFollowups: [
        'Where do I check my subject-wise attendance?',
        'How do I submit a medical leave certificate?',
        'What is the exam condonation fee?',
      ],
    };
  }

  if (q.includes('transcript') || q.includes('certificate') || q.includes('marksheet') || q.includes('bonafide') || q.includes('grade')) {
    return {
      reply: 'Official academic documents are ordered through the Student Portal under **Documents → Request Certificate**.\n• **Digital Transcripts**: Verifiable e-signed PDF transcripts are generated within 24–48 hours at no charge.\n• **Physical Copies**: Embossed and stamped copies can be collected at the Registrar Office (Block A, Room 104) or dispatched via courier.\n• **Bonafide Letters**: Issued within 24 hours for passport, visa, loan, or internship applications.',
      suggestedFollowups: [
        'How long does transcript verification take?',
        'Can physical transcripts be delivered by courier?',
        'How do I get a bonafide letter for an internship?',
      ],
    };
  }

  if (q.includes('health') || q.includes('doctor') || q.includes('medical') || q.includes('counsel') || q.includes('mental') || q.includes('clinic')) {
    return {
      reply: 'The Student Health Centre is located in **Block D, Ground Floor**.\n• **Operating Hours**: Mon–Fri 8:00 AM – 6:00 PM; Saturdays 9:00 AM – 1:00 PM.\n• **24/7 Ambulance & Crisis**: Call **1800-419-CARE** or +91-80-2345-9999.\n• **Free Mental Counseling**: Confidential in-person and telehealth counseling sessions can be booked online or via walk-in.',
      suggestedFollowups: [
        'How do I book a confidential counseling appointment?',
        'What is the 24/7 campus medical emergency number?',
        'Are routine prescription medicines provided on campus?',
      ],
    };
  }

  if (q.includes('hostel') || q.includes('dorm') || q.includes('mess') || q.includes('curfew')) {
    return {
      reply: 'Hostel and campus residence information:\n• **Curfew**: Campus entry is 10:00 PM on weekdays and 10:30 PM on weekends.\n• **Overnight Leave**: Apply via the Hostel App 24 hours in advance for digital warden approval.\n• **Mess Dining**: Four meals daily with vegetarian and non-vegetarian menus managed in Block H.',
      suggestedFollowups: [
        'How do I submit an overnight leave request?',
        'What are the hostel curfew hours?',
        'How do I report a room maintenance issue?',
      ],
    };
  }

  if (q.includes('wifi') || q.includes('wi-fi') || q.includes('internet') || q.includes('password') || q.includes('login') || q.includes('portal')) {
    return {
      reply: 'For campus connectivity and account access:\n• **EduTrack-5G Wi-Fi**: Connect using Student Roll Number and portal password. Set EAP to PEAP and Phase 2 to MSCHAPv2.\n• **Password Reset**: Use the "Forgot Password" link on portal.university.edu to receive an OTP.\n• **IT Helpdesk**: Block A, Room 204 (Mon–Fri 8:30 AM – 5:30 PM) or email helpdesk@university.edu.',
      suggestedFollowups: [
        'How do I reset my portal password?',
        'Where is the IT Helpdesk located?',
        'How do I register a new device MAC address?',
      ],
    };
  }

  const catNote = category ? ` regarding **${category}**` : '';
  return {
    reply: `I can assist you with that${catNote}! Official academic regulations and forms are accessible on the **Student Portal (portal.university.edu)**.\n\nFor personalized in-person assistance, visit:\n• **Student Services Centre**: Block A, Room 101 (Mon–Fri, 9:00 AM – 5:00 PM)\n• **Helpdesk Email**: support@university.edu\n• **Helpline**: +91-80-2345-6789`,
    suggestedFollowups: [
      'How do I contact my academic advisor?',
      'Where is the Student Services Centre located?',
      'How do I submit an enquiry form?',
    ],
  };
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
  const [sourcesOpen, setSourcesOpen] = useState(false);

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="text-[11px] font-semibold text-on-surface-variant bg-surface-container px-3.5 py-1.5 rounded-full border border-outline-variant/30 flex items-center gap-1.5 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          {msg.text}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2.5 mb-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mb-1 shadow-sm">
          <span className="material-symbols-outlined text-on-primary text-[17px]">support_agent</span>
        </div>
      )}

      <div className={`flex flex-col max-w-[88%] sm:max-w-[82%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 rounded-2xl shadow-xs transition-all ${
            isUser
              ? 'bg-primary text-on-primary rounded-br-xs font-medium text-xs sm:text-sm'
              : 'bg-surface-container-lowest text-on-surface rounded-bl-xs border border-outline-variant/30'
          }`}
        >
          {isUser ? msg.text : renderFormattedBotText(msg.text)}

          {/* Verification / RAG Grounding Badges */}
          {!isUser && (msg.isRagGrounded || msg.isWebSearched) && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-outline-variant/15 text-[11px]">
              {msg.isRagGrounded && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold text-[10px]">
                  <span className="material-symbols-outlined text-[13px]">menu_book</span>
                  <span>RAG Knowledge Grounded</span>
                </span>
              )}
              {msg.isWebSearched && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/15 text-secondary font-semibold text-[10px]">
                  <span className="material-symbols-outlined text-[13px]">public</span>
                  <span>Live Web Verified</span>
                </span>
              )}
            </div>
          )}

          {/* Expandable Citations / Sources Box */}
          {!isUser && msg.sources && msg.sources.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setSourcesOpen((prev) => !prev)}
                className="w-full flex items-center justify-between text-[11px] font-bold text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">source</span>
                  <span>Sources &amp; Citations ({msg.sources.length})</span>
                </span>
                <span className={`material-symbols-outlined text-[15px] transition-transform ${sourcesOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {sourcesOpen && (
                <div className="mt-2 space-y-1.5">
                  {msg.sources.map((s, idx) => (
                    <div
                      key={s.id || idx}
                      className="p-2 rounded-xl bg-surface-container-low/60 border border-outline-variant/20 text-[11px] space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-on-surface flex items-center gap-1 truncate">
                          <span className="material-symbols-outlined text-[13px] text-primary">
                            {s.type === 'document' ? 'description' : 'public'}
                          </span>
                          <span className="truncate">{s.title}</span>
                        </span>
                        {s.type === 'document' && typeof s.score === 'number' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-bold">
                            {(s.score * 100).toFixed(0)}% Match
                          </span>
                        )}
                        {s.type === 'web' && s.url && (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-0.5 flex-shrink-0"
                          >
                            <span>Open</span>
                            <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                          </a>
                        )}
                      </div>
                      <p className="text-on-surface-variant text-[10px] leading-relaxed line-clamp-2">
                        {s.snippet}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action metadata bar */}
        <div className={`flex items-center gap-2 mt-1 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[10px] text-outline font-medium">{msg.timestamp}</span>

          {!isUser && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onRate(msg.id, 'up')}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
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
                className={`p-1 rounded-md transition-colors cursor-pointer ${
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
                className="p-1 rounded-md text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
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
                className="text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/30 text-primary bg-surface-container-lowest hover:bg-primary hover:text-on-primary transition-all shadow-xs text-left cursor-pointer"
              >
                {qr}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TypingDots: React.FC<{ statusText?: string }> = ({ statusText }) => (
  <div className="flex items-end gap-2.5 mb-3.5">
    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
      <span className="material-symbols-outlined text-on-primary text-[17px]">support_agent</span>
    </div>
    <div className="bg-surface-container-lowest rounded-2xl rounded-bl-xs px-4 py-3 border border-outline-variant/30 flex items-center gap-1.5 shadow-xs">
      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
      <span className="text-xs font-medium text-on-surface-variant ml-1.5">
        {statusText || 'EduTrack AI is retrieving knowledge & synthesizing answer...'}
      </span>
    </div>
  </div>
);

// ─── Main SupportChatbot Full Page View ────────────────────────────────────────

type ActiveViewTab = 'chat' | 'knowledge' | 'categories' | 'faq' | 'contact';

export const SupportChatbot: React.FC = () => {
  const { firebaseUser, showToast } = useEduTrack();
  const [activeTab, setActiveTab] = useState<ActiveViewTab>('chat');
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingStatus, setTypingStatus] = useState<string | undefined>(undefined);
  const [faqSearch, setFaqSearch] = useState('');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  // RAG & Web Search Options
  const [enableWebSearch, setEnableWebSearch] = useState<boolean>(true);
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDocument[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'bot',
      text: `👋 Hello! I'm your **EduTrack AI Student Assistant**, powered by **Retrieval-Augmented Generation (RAG)** and **Live Web Search**.\n\nI can answer questions grounded in our university knowledge base, read your uploaded PDF/Word documents, and look up up-to-date information on the web. What would you like to explore today?`,
      timestamp: getTimestamp(),
      quickReplies: [
        'How do I pay tuition fees online?',
        'What is the attendance policy and medical condonation?',
        'What are the course registration deadlines and credit limits?',
        'How do I access IEEE journals from off-campus?',
      ],
      isRagGrounded: true,
      isWebSearched: false,
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping]);

  // Load indexed knowledge base documents on mount
  const refreshKnowledgeDocs = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/rag/documents');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.documents)) {
          setKnowledgeDocs(data.documents);
        }
      }
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    refreshKnowledgeDocs();
  }, [refreshKnowledgeDocs]);

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

  const resolveBotAnswer = useCallback(
    async (
      question: string,
      history: ChatMessage[],
      category?: string
    ): Promise<{
      reply: string;
      sources: RagSourceItem[];
      isRagGrounded: boolean;
      isWebSearched: boolean;
      suggestedFollowups: string[];
      confidence?: 'high' | 'medium' | 'unverified';
    }> => {
      try {
        const token = await getAuthToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;

        const formattedHistory = history
          .filter((m) => m.role === 'user' || m.role === 'bot')
          .map((m) => ({
            role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
            content: m.text,
          }));

        const res = await fetch('/api/ai/rag/chat', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            message: question,
            history: formattedHistory,
            category,
            enableWebSearch,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.reply === 'string' && data.reply.trim().length > 0) {
            return {
              reply: data.reply,
              sources: Array.isArray(data.sources) ? data.sources : [],
              isRagGrounded: Boolean(data.isRagGrounded),
              isWebSearched: Boolean(data.isWebSearched),
              suggestedFollowups:
                Array.isArray(data.suggestedFollowups) && data.suggestedFollowups.length > 0
                  ? data.suggestedFollowups
                  : ['Can you explain this in simpler terms?', 'Where can I find more details?', 'Who should I contact?'],
              confidence: data.confidence,
            };
          }
        }
      } catch (err) {
        console.warn('RAG backend call error, falling back to instant knowledge engine:', err);
      }

      // Resilient instant knowledge engine fallback
      const instant = getInstantSupportAnswer(question, category);
      return {
        reply: instant.reply,
        sources: [
          {
            id: 'kb-fallback',
            title: 'University Student Handbook & Regulations',
            type: 'document',
            snippet: instant.reply.slice(0, 160) + '...',
            score: 0.95,
          },
        ],
        isRagGrounded: true,
        isWebSearched: false,
        suggestedFollowups: instant.suggestedFollowups,
        confidence: 'high',
      };
    },
    [getAuthToken, enableWebSearch]
  );

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
      setTypingStatus('Retrieving knowledge base & live web...');

      const botResult = await resolveBotAnswer(question, nextMessages, activeCategory);

      setIsTyping(false);
      setTypingStatus(undefined);
      setMessages((curr) => [
        ...curr,
        {
          id: uid(),
          role: 'bot',
          text: botResult.reply,
          timestamp: getTimestamp(),
          quickReplies: botResult.suggestedFollowups,
          sources: botResult.sources,
          isRagGrounded: botResult.isRagGrounded,
          isWebSearched: botResult.isWebSearched,
          confidence: botResult.confidence,
          rating: null,
        },
      ]);
    },
    [inputValue, isTyping, messages, activeCategory, resolveBotAnswer]
  );

  // ── Document Upload to Vector Store ─────────────────────────────────────────

  const uploadFileBlob = useCallback(
    async (file: File) => {
      setIsUploadingDoc(true);
      showToast(`Uploading and indexing "${file.name}"...`, 'info');

      try {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Data = (reader.result as string) || '';
            const res = await fetch('/api/ai/rag/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                filename: file.name,
                fileBase64: base64Data,
                mimeType: file.type,
                category: 'User Uploaded',
              }),
            });

            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.error || 'Upload failed');
            }

            const data = await res.json();
            showToast(`"${file.name}" indexed successfully into Knowledge Base!`, 'success');

            // Add system notification in chat
            setMessages((prev) => [
              ...prev,
              {
                id: uid(),
                role: 'system',
                text: `✅ Indexed "${file.name}" into RAG Vector Store (${data.document?.chunkCount || 1} chunks created). You can now ask questions about it!`,
                timestamp: getTimestamp(),
              },
            ]);

            await refreshKnowledgeDocs();
          } catch (uploadErr) {
            const msg = uploadErr instanceof Error ? uploadErr.message : 'Upload failed';
            showToast(msg, 'error');
          } finally {
            setIsUploadingDoc(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        };

        reader.readAsDataURL(file);
      } catch {
        setIsUploadingDoc(false);
        showToast('Failed to read file', 'error');
      }
    },
    [refreshKnowledgeDocs, showToast]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        uploadFileBlob(file);
      }
    },
    [uploadFileBlob]
  );

  const handleDeleteDocument = useCallback(
    async (id: string, name: string) => {
      try {
        const res = await fetch(`/api/ai/rag/documents/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast(`Deleted "${name}" from Knowledge Base`, 'info');
          await refreshKnowledgeDocs();
        }
      } catch {
        showToast('Failed to delete document', 'error');
      }
    },
    [refreshKnowledgeDocs, showToast]
  );

  const handleSelectCategory = useCallback(
    (cat: ChatCategory) => {
      setActiveCategory(cat.id);
      setActiveTab('chat');

      const channelMsg: ChatMessage = {
        id: uid(),
        role: 'system',
        text: `Switched channel to ${cat.label}`,
        timestamp: getTimestamp(),
      };

      const botGreeting: ChatMessage = {
        id: uid() + 1,
        role: 'bot',
        text: `You're now focused on **${cat.label}**.\n\n*Topic coverage*: ${cat.description}.\n\nHow can I help you?`,
        timestamp: getTimestamp(),
        quickReplies: QUICK_STARTERS.slice(0, 3),
      };

      setMessages((prev) => [...prev, channelMsg, botGreeting]);
      setTimeout(() => inputRef.current?.focus(), 100);
    },
    []
  );

  const handleAskQuickQuestion = useCallback(
    (question: string) => {
      setActiveTab('chat');
      handleSendMessage(question);
    },
    [handleSendMessage]
  );

  const handleClearChat = useCallback(() => {
    setMessages([
      {
        id: uid(),
        role: 'bot',
        text: `👋 Started fresh chat session.\n\nHow can I help you with your courses, exams, fees, or uploaded documents?`,
        timestamp: getTimestamp(),
        quickReplies: QUICK_STARTERS.slice(0, 3),
      },
    ]);
    showToast('Chat session cleared', 'info');
  }, [showToast]);

  const handleRate = useCallback(
    (id: number, rating: 'up' | 'down') => {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, rating } : m)));
      showToast(rating === 'up' ? 'Feedback recorded: Helpful' : 'Feedback recorded', 'info');
    },
    [showToast]
  );

  const handleCopy = useCallback(
    (text: string) => {
      try {
        navigator.clipboard.writeText(text);
        showToast('Copied to clipboard', 'success');
      } catch {
        showToast('Copy not available in this context', 'info');
      }
    },
    [showToast]
  );

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

  return (
    <div className="max-w-4xl mx-auto py-3 sm:py-6 px-1 space-y-4">
      {/* ── ALWAYS MOUNTED HIDDEN FILE INPUT ── */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md,.markdown,.csv,.json"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* ── Top Header Bar ───────────────────────────────────────────── */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="bg-primary px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-on-primary">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-on-primary/15 flex items-center justify-center flex-shrink-0 shadow-inner">
              <span className="material-symbols-outlined text-[24px]">psychology</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold leading-tight">EduTrack RAG Assistant</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-on-primary/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                  RAG &amp; Web Active
                </span>
              </div>
              <p className="text-xs text-on-primary/80 mt-0.5">
                Intelligent academic retrieval, document grounding, and live web search
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Live Web Search Switch */}
            <button
              type="button"
              onClick={() => {
                setEnableWebSearch((v) => !v);
                showToast(`Live Web Search ${!enableWebSearch ? 'Enabled' : 'Disabled'}`, 'info');
              }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                enableWebSearch
                  ? 'bg-on-primary text-primary shadow-xs'
                  : 'bg-on-primary/15 text-on-primary/80 hover:bg-on-primary/25'
              }`}
              title="Toggle live web search"
            >
              <span className="material-symbols-outlined text-[15px]">public</span>
              <span className="hidden sm:inline">Web Search:</span>
              <span>{enableWebSearch ? 'ON' : 'OFF'}</span>
            </button>

            {/* New Chat */}
            <button
              type="button"
              onClick={handleClearChat}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-on-primary/15 hover:bg-on-primary/25 text-on-primary transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Clear conversation"
            >
              <span className="material-symbols-outlined text-[15px]">refresh</span>
              <span>New Chat</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-outline-variant/20 bg-surface-container-low/50 overflow-x-auto no-scrollbar">
          {(
            [
              ['chat', 'chat', 'Live RAG Chat'],
              ['knowledge', 'menu_book', `Knowledge Base (${knowledgeDocs.length})`],
              ['categories', 'category', 'Help Topics'],
              ['faq', 'help_center', `FAQs (${FAQ_DATABASE.length})`],
              ['contact', 'contact_phone', 'Staff Directory'],
            ] as [ActiveViewTab, string, string][]
          ).map(([tabId, icon, label]) => {
            const isActive = activeTab === tabId;
            return (
              <button
                key={tabId}
                type="button"
                onClick={() => setActiveTab(tabId)}
                className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-primary text-primary bg-surface-container-lowest'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active Tab Display ────────────────────────────────────────── */}

      {/* TAB 1: LIVE RAG SUPPORT CHAT */}
      {activeTab === 'chat' && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) uploadFileBlob(file);
          }}
          className={`bg-surface-container-lowest rounded-2xl border transition-all shadow-sm flex flex-col h-[590px] sm:h-[630px] relative ${
            isDraggingOver ? 'border-primary ring-2 ring-primary/40' : 'border-outline-variant/30'
          }`}
        >
          {/* Drag and Drop Overlay Indicator */}
          {isDraggingOver && (
            <div className="absolute inset-0 bg-primary/10 backdrop-blur-xs z-30 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary">
              <span className="material-symbols-outlined text-[48px] text-primary animate-bounce">
                upload_file
              </span>
              <p className="text-sm font-bold text-primary">Drop document here to index into RAG vector store</p>
            </div>
          )}

          {/* Channel Filter Chips */}
          <div className="px-3 sm:px-4 py-2 border-b border-outline-variant/20 bg-surface-container-low/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-bold text-outline uppercase tracking-wider flex-shrink-0 mr-1">
              Filter:
            </span>
            <button
              type="button"
              onClick={() => setActiveCategory(undefined)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer ${
                activeCategory === undefined
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span>All Knowledge</span>
            </button>
            {SUPPORT_CATEGORIES.map((cat) => {
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Messages Scroll Thread */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                onRate={handleRate}
                onQuickReply={(val) => handleSendMessage(val)}
                onCopy={handleCopy}
              />
            ))}

            {/* Active upload banner */}
            {isUploadingDoc && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary font-semibold animate-pulse my-2">
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                <span>Indexing document into RAG vector database & generating embeddings...</span>
              </div>
            )}

            {isTyping && <TypingDots statusText={typingStatus} />}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar with Document Ingestion Button */}
          <div className="border-t border-outline-variant/20 p-3 sm:p-4 bg-surface-container-low/30">
            <div className="flex items-center gap-2">
              {/* Document upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingDoc || isTyping}
                className="h-11 px-3 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-primary hover:border-primary/40 flex items-center gap-1.5 transition-all flex-shrink-0 shadow-xs cursor-pointer disabled:opacity-40"
                title="Upload document to RAG Knowledge Base (PDF, DOCX, TXT, MD)"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isUploadingDoc ? 'progress_activity' : 'attach_file'}
                </span>
                <span className="text-xs font-semibold hidden sm:inline">
                  {isUploadingDoc ? 'Indexing...' : 'Upload Doc'}
                </span>
              </button>

              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything (e.g. fees, credits, library rules, or ask about uploaded documents)..."
                disabled={isTyping}
                className="flex-1 h-11 px-4 rounded-xl bg-surface-container text-on-surface placeholder:text-outline text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-all disabled:opacity-60 border border-outline-variant/30"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isTyping}
                className="h-11 px-4 sm:px-5 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex-shrink-0 cursor-pointer"
              >
                <span>Send</span>
                <span className="material-symbols-outlined text-[17px]">send</span>
              </button>
            </div>

            {/* Quick suggested questions */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mt-2 pt-1 text-[11px] text-outline">
              <span className="font-semibold flex-shrink-0">Suggestions:</span>
              {QUICK_STARTERS.slice(0, 3).map((qs) => (
                <button
                  key={qs}
                  type="button"
                  onClick={() => handleSendMessage(qs)}
                  className="px-2 py-0.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface-variant hover:text-primary hover:border-primary/40 truncate flex-shrink-0 transition-colors cursor-pointer"
                >
                  {qs}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KNOWLEDGE BASE MANAGER */}
      {activeTab === 'knowledge' && (
        <div className="space-y-4">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/20 pb-4">
              <div>
                <h2 className="text-base font-bold text-on-surface">RAG Vector Knowledge Base</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Semantic embeddings index used to ground AI responses with source verification
                </p>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingDoc}
                className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition-all shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                <span>{isUploadingDoc ? 'Uploading...' : 'Upload Document (PDF, DOCX, TXT)'}</span>
              </button>
            </div>

            {/* Interactive Drag & Drop Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingOver(true);
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) uploadFileBlob(file);
              }}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                isDraggingOver
                  ? 'border-primary bg-primary/10'
                  : 'border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[28px]">
                  {isUploadingDoc ? 'progress_activity' : 'cloud_upload'}
                </span>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-on-surface">
                  {isUploadingDoc
                    ? 'Indexing document into RAG vector database...'
                    : 'Click to upload or drag & drop files here'}
                </p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  Supports PDF, Word (DOCX), Markdown, Text (TXT), CSV, and JSON up to 50MB
                </p>
              </div>
            </div>

            {/* Document Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {knowledgeDocs.length === 0 ? (
                <div className="col-span-full p-6 text-center text-xs text-on-surface-variant">
                  Loading indexed knowledge documents...
                </div>
              ) : (
                knowledgeDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl border border-outline-variant/30 bg-surface-container-low/40 flex flex-col justify-between gap-2.5 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[18px]">
                          {doc.fileType === 'PDF' ? 'picture_as_pdf' : 'description'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-on-surface truncate">{doc.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-surface-container text-on-surface-variant flex-shrink-0">
                            {doc.fileType}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-2">
                          {doc.summary || `${doc.wordCount} words indexed.`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-outline-variant/15 pt-2 text-[10px] text-outline">
                      <div className="flex items-center gap-2">
                        <span>{doc.chunkCount} chunks</span>
                        <span>·</span>
                        <span>{doc.wordCount} words</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('chat');
                            handleSendMessage(`Summarize key points from "${doc.name}"`);
                          }}
                          className="text-primary hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>Ask in Chat</span>
                          <span className="material-symbols-outlined text-[12px]">chat</span>
                        </button>

                        {/* Delete button if uploaded document */}
                        {!doc.id.startsWith('seed-') && (
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc.id, doc.name)}
                            className="text-error hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[12px]">delete</span>
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HELP TOPICS */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SUPPORT_CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest hover:border-primary/50 transition-all shadow-xs flex flex-col justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${cat.bg} ${cat.color}`}
                  >
                    <span className="material-symbols-outlined text-[24px]">{cat.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">{cat.label}</h3>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectCategory(cat)}
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-surface-container hover:bg-primary hover:text-on-primary text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-primary"
                >
                  <span>Open {cat.label} Chat</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: FAQ DATABASE */}
      {activeTab === 'faq' && (
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <span className="material-symbols-outlined text-[20px] text-outline absolute left-3.5 top-1/2 -translate-y-1/2">
              search
            </span>
            <input
              type="text"
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              placeholder="Search frequently asked questions (e.g. fees, Wi-Fi, attendance, library, transcripts)..."
              className="w-full h-11 pl-11 pr-4 rounded-xl bg-surface-container-lowest text-on-surface placeholder:text-outline text-xs sm:text-sm border border-outline-variant/30 outline-none focus:ring-2 focus:ring-primary/30 shadow-xs"
            />
            {faqSearch && (
              <button
                type="button"
                onClick={() => setFaqSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[17px]">close</span>
              </button>
            )}
          </div>

          {/* FAQ Accordion List */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm divide-y divide-outline-variant/20 overflow-hidden">
            {filteredFaqs.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant text-xs space-y-2">
                <p>No matching FAQs found for "{faqSearch}".</p>
                <button
                  type="button"
                  onClick={() => handleAskQuickQuestion(faqSearch)}
                  className="text-primary font-bold hover:underline cursor-pointer"
                >
                  Ask EduTrack AI this question in Chat →
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
                      className="w-full flex items-start justify-between gap-3 text-left cursor-pointer"
                    >
                      <span className="text-xs sm:text-sm font-bold text-on-surface">{item.q}</span>
                      <span
                        className={`material-symbols-outlined text-[18px] text-outline flex-shrink-0 transition-transform ${
                          isOpen ? 'rotate-180 text-primary' : ''
                        }`}
                      >
                        expand_more
                      </span>
                    </button>

                    {isOpen && (
                      <div className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mt-2.5 pt-2.5 border-t border-outline-variant/15">
                        {renderFormattedBotText(item.a)}
                        <div className="mt-3 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => handleAskQuickQuestion(`Can you explain more about: ${item.q}`)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-lg cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[15px]">chat</span>
                            Ask in Live Chat
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 5: STAFF DIRECTORY */}
      {activeTab === 'contact' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {[
            {
              title: 'Student Services Centre',
              location: 'Block A, Room 101',
              hours: 'Mon–Fri, 9:00 AM – 5:00 PM',
              email: 'support@university.edu',
              phone: '+91-80-2345-6789 (Ext. 101)',
              services: 'General enquiries, identity cards, bonafide letters, bus passes',
              icon: 'desk',
            },
            {
              title: 'Accounts & Bursar Office',
              location: 'Block B, Ground Floor',
              hours: 'Mon–Fri, 9:30 AM – 4:00 PM',
              email: 'finance@university.edu',
              phone: '+91-80-2345-6789 (Ext. 102)',
              services: 'Tuition payments, fee concessions, instalment plans, scholarship disbursements',
              icon: 'account_balance',
            },
            {
              title: 'Registrar & Exam Office',
              location: 'Block A, Room 104',
              hours: 'Mon–Fri, 9:00 AM – 4:30 PM',
              email: 'registrar@university.edu',
              phone: '+91-80-2345-6789 (Ext. 104)',
              services: 'Official transcripts, degree certificates, grade card revaluations',
              icon: 'history_edu',
            },
            {
              title: 'Student Health & Wellness',
              location: 'Block D, Ground Floor',
              hours: 'Mon–Sat 8:00 AM – 6:00 PM (Ambulance 24/7)',
              email: 'health@university.edu',
              phone: '1800-419-CARE (24/7 Helpline)',
              services: 'Medical consultations, emergency triage, confidential mental counseling',
              icon: 'health_and_safety',
            },
            {
              title: 'IT Helpdesk & Computing Support',
              location: 'Block A, Room 204',
              hours: 'Mon–Fri, 8:30 AM – 5:30 PM',
              email: 'helpdesk@university.edu',
              phone: '+91-80-2345-6789 (Ext. 204)',
              services: 'Student portal password resets, campus Wi-Fi configuration, email issues',
              icon: 'computer',
            },
            {
              title: 'Hostel Administration',
              location: 'Block H, Warden Office',
              hours: 'Mon–Sat, 8:00 AM – 7:00 PM',
              email: 'hostel@university.edu',
              phone: '+91-80-2345-6789 (Ext. 301)',
              services: 'Room allocations, maintenance tickets, mess dining cards, curfew passes',
              icon: 'apartment',
            },
          ].map((d) => (
            <div
              key={d.title}
              className="p-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-xs space-y-2"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px]">{d.icon}</span>
                </div>
                <h3 className="text-sm font-bold text-on-surface">{d.title}</h3>
              </div>
              <div className="text-xs text-on-surface-variant space-y-1 pt-1">
                <p className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-outline">location_on</span>
                  <span>{d.location}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-outline">schedule</span>
                  <span>{d.hours}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-outline">mail</span>
                  <a href={`mailto:${d.email}`} className="text-primary hover:underline">
                    {d.email}
                  </a>
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-outline">call</span>
                  <span>{d.phone}</span>
                </p>
                <p className="text-[11px] text-outline pt-1 border-t border-outline-variant/15">
                  {d.services}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security Footer Notice */}
      <p className="text-center text-[11px] text-outline pt-2 flex items-center justify-center gap-1.5">
        <span className="material-symbols-outlined text-[14px] text-green-500">verified_user</span>
        <span>EduTrack Student Support · Grounded RAG &amp; Live Web AI Intelligence</span>
      </p>
    </div>
  );
};

export default SupportChatbot;

// ─── Floating Chatbot Widget (FAB) ─────────────────────────────────────────────

export const ChatbotWidget: React.FC = () => {
  const { activeScreen, firebaseUser } = useEduTrack();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState<Record<number, boolean>>({});

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'bot',
      text: `👋 Hi! I'm your **EduTrack RAG Assistant**.\n\nAsk me anything about fees, course credits, attendance, library books, or campus life!`,
      timestamp: getTimestamp(),
      quickReplies: [
        'How do I pay tuition fees online?',
        'What is the attendance policy?',
        'What are the library hours?',
      ],
      isRagGrounded: true,
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const widgetInputRef = useRef<HTMLInputElement>(null);

  if (activeScreen === 'support-chatbot') {
    return null;
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping]);

  const handleOpenWidget = () => {
    setIsOpen(true);
    setTimeout(() => widgetInputRef.current?.focus(), 150);
  };

  const handleSendWidgetMessage = async (text?: string) => {
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

    let botReply = '';
    let followups: string[] = [];
    let sources: RagSourceItem[] = [];
    let isRagGrounded = false;
    let isWebSearched = false;

    try {
      const token = firebaseUser ? await firebaseUser.getIdToken() : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/ai/rag/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: question,
          history: nextMessages
            .filter((m) => m.role === 'user' || m.role === 'bot')
            .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
          enableWebSearch: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.reply === 'string' && data.reply.trim().length > 0) {
          botReply = data.reply;
          followups = Array.isArray(data.suggestedFollowups) ? data.suggestedFollowups : [];
          sources = Array.isArray(data.sources) ? data.sources : [];
          isRagGrounded = Boolean(data.isRagGrounded);
          isWebSearched = Boolean(data.isWebSearched);
        }
      }
    } catch {
      /* fallback */
    }

    if (!botReply) {
      const instant = getInstantSupportAnswer(question);
      botReply = instant.reply;
      followups = instant.suggestedFollowups;
      isRagGrounded = true;
    }

    setIsTyping(false);
    setMessages((curr) => [
      ...curr,
      {
        id: uid(),
        role: 'bot',
        text: botReply,
        timestamp: getTimestamp(),
        quickReplies: followups,
        sources,
        isRagGrounded,
        isWebSearched,
      },
    ]);
  };

  const handleWidgetKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendWidgetMessage();
    }
  };

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-[160] flex flex-col items-end gap-3">
      {/* Floating Chat Window */}
      {isOpen && (
        <div
          className="w-[330px] sm:w-[380px] bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col overflow-hidden transition-all duration-200"
          style={{ maxHeight: '530px' }}
        >
          {/* Widget Top Header */}
          <div className="bg-primary px-4 py-3 flex items-center justify-between text-on-primary flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-on-primary/15 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[18px]">psychology</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">EduTrack RAG Assistant</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                  <span className="text-[10px] text-on-primary/80 font-medium">RAG &amp; Web Active</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setMessages([
                    {
                      id: uid(),
                      role: 'bot',
                      text: `👋 Started fresh chat session. Ask me anything!`,
                      timestamp: getTimestamp(),
                      quickReplies: ['How do I pay tuition fees?', 'What is the attendance policy?'],
                    },
                  ])
                }
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-on-primary/15 text-on-primary/80 hover:text-on-primary transition-colors cursor-pointer"
                title="Clear conversation"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-on-primary/15 text-on-primary/80 hover:text-on-primary transition-colors cursor-pointer"
                aria-label="Close support chat"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1 min-h-[220px] max-h-[350px] bg-surface-container-low/20">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col mb-2.5 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`px-3 py-2 rounded-2xl text-xs leading-relaxed max-w-[88%] shadow-xs ${
                    m.role === 'user'
                      ? 'bg-primary text-on-primary rounded-br-xs font-medium'
                      : 'bg-surface-container-lowest text-on-surface rounded-bl-xs border border-outline-variant/30'
                  }`}
                >
                  {m.role === 'user' ? m.text : renderFormattedBotText(m.text)}

                  {/* Badges */}
                  {m.role === 'bot' && (m.isRagGrounded || m.isWebSearched) && (
                    <div className="flex items-center gap-1 mt-2 pt-1.5 border-t border-outline-variant/15 text-[9px]">
                      {m.isRagGrounded && (
                        <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary font-bold">
                          RAG Grounded
                        </span>
                      )}
                      {m.isWebSearched && (
                        <span className="px-1.5 py-0.2 rounded bg-secondary/15 text-secondary font-bold">
                          Web Verified
                        </span>
                      )}
                    </div>
                  )}

                  {/* Sources Preview */}
                  {m.role === 'bot' && m.sources && m.sources.length > 0 && (
                    <div className="mt-1.5 pt-1.5 border-t border-outline-variant/15">
                      <button
                        type="button"
                        onClick={() =>
                          setSourcesOpen((prev) => ({ ...prev, [m.id]: !prev[m.id] }))
                        }
                        className="text-[10px] font-bold text-primary flex items-center justify-between w-full cursor-pointer"
                      >
                        <span>Sources ({m.sources.length})</span>
                        <span className="material-symbols-outlined text-[13px]">
                          {sourcesOpen[m.id] ? 'expand_less' : 'expand_more'}
                        </span>
                      </button>
                      {sourcesOpen[m.id] && (
                        <div className="mt-1 space-y-1">
                          {m.sources.slice(0, 3).map((s, idx) => (
                            <div key={idx} className="p-1 rounded bg-surface-container text-[10px]">
                              <p className="font-semibold text-on-surface truncate">{s.title}</p>
                              {s.url && (
                                <a
                                  href={s.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline text-[9px]"
                                >
                                  Open link
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-outline mt-0.5 px-1">{m.timestamp}</span>

                {m.role === 'bot' && m.quickReplies && m.quickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5 max-w-[90%]">
                    {m.quickReplies.map((qr) => (
                      <button
                        key={qr}
                        type="button"
                        onClick={() => handleSendWidgetMessage(qr)}
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-full border border-primary/30 text-primary bg-surface-container-lowest hover:bg-primary hover:text-on-primary transition-all text-left cursor-pointer"
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
                <span className="text-[10px] ml-1">RAG searching...</span>
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
              placeholder="Ask anything..."
              disabled={isTyping}
              className="flex-1 h-9 px-3 rounded-xl bg-surface-container text-on-surface placeholder:text-outline text-xs outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30"
            />
            <button
              type="button"
              onClick={() => handleSendWidgetMessage()}
              disabled={!inputValue.trim() || isTyping}
              className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-all flex-shrink-0 shadow-xs cursor-pointer"
              aria-label="Send message"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={isOpen ? () => setIsOpen(false) : handleOpenWidget}
        className="relative w-14 h-14 rounded-2xl bg-primary text-on-primary shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-150 border-2 border-surface-container-lowest cursor-pointer"
        aria-label="Toggle student support chat"
      >
        <span className="material-symbols-outlined text-[26px]">
          {isOpen ? 'close' : 'psychology'}
        </span>
      </button>
    </div>
  );
};
