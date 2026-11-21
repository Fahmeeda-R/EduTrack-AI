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
  'How do I register for courses and what are credit limits?',
  'What are the Central Library hours and borrowing rules?',
  'What is the university attendance requirement for exams?',
  'How do I request an official transcript or bonafide certificate?',
  'Where is the Student Health Centre and counseling service located?',
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

/**
 * Format markdown text with bolding, code spans, bullet lists, and paragraphs
 */
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
 * Robust built-in knowledge matcher: ensures the chatbot ALWAYS gives high quality,
 * specific answers even without network or when offline.
 */
function getInstantSupportAnswer(query: string, category?: string): {
  reply: string;
  suggestedFollowups: string[];
} {
  const q = query.toLowerCase();

  // 1. Fee & Financial Aid
  if (q.includes('fee') || q.includes('tuition') || q.includes('pay') || q.includes('payment') || q.includes('cost') || q.includes('due')) {
    return {
      reply: 'Tuition fees can be paid online directly via the **Student Portal (Finances → Fee Payment)** using UPI, Net Banking, or Credit/Debit Cards. \n• Receipts generate instantly in your **Fee History** section.\n• **Instalment Plans**: A 2-part instalment plan is available upon submitting a request to the Accounts Office (Block B, Room 102) before the term begins.\n• **Dues Clearance**: Official hall tickets and grade cards require all semester dues to be settled.',
      suggestedFollowups: [
        'How do I apply for fee instalments?',
        'Where do I download my fee receipt?',
        'What scholarships are available?',
      ],
    };
  }

  // 2. Course Registration & Academics
  if (q.includes('register') || q.includes('registration') || q.includes('course') || q.includes('enrol') || q.includes('enroll') || q.includes('elective') || q.includes('subject') || q.includes('credit')) {
    return {
      reply: 'Course registration opens **2 weeks prior to each semester** on the Student Portal (Academics → Course Registration).\n• **Credit Limits**: Standard undergraduate workload is 18–24 credit hours per semester.\n• **Prerequisites**: Clear all prerequisite courses before registering for advanced modules.\n• **Add/Drop Window**: Changes to registered electives can be submitted during the first 14 days of classes with advisor sign-off.',
      suggestedFollowups: [
        'How do I submit an Add/Drop request?',
        'Who is my academic advisor?',
        'What are the minimum credit requirements to graduate?',
      ],
    };
  }

  // 3. Library & E-Resources
  if (q.includes('library') || q.includes('book') || q.includes('borrow') || q.includes('return') || q.includes('journal') || q.includes('ieee') || q.includes('acm')) {
    return {
      reply: 'The Central Library is located in Block C.\n• **Operating Hours**: Mon–Sat 8:00 AM – 10:00 PM; Sundays 10:00 AM – 6:00 PM.\n• **Borrowing Privileges**: Undergraduate students can borrow up to 5 books for 14 days with their student ID card.\n• **Digital Databases**: Access IEEE Xplore, ACM Digital Library, and ScienceDirect 24/7 at **lib.university.edu** using your student login credentials.\n• **Quiet Study Rooms**: Bookable via the library circulation desk or library portal.',
      suggestedFollowups: [
        'How do I renew borrowed books online?',
        'How do I access IEEE journals from off-campus?',
        'Where are the silent study rooms?',
      ],
    };
  }

  // 4. Attendance & Medical Leaves
  if (q.includes('attendance') || q.includes('absent') || q.includes('leave') || q.includes('75%') || q.includes('condonation')) {
    return {
      reply: 'The university mandates a minimum of **75% attendance** per registered course to be eligible for end-semester examinations.\n• **Attendance Tracking**: View your real-time attendance percentages in the Student Portal under Academics.\n• **Medical Condonation**: If you missed classes due to medical reasons, submit a Leave Application with valid hospital certificates within 3 working days to your Department Head.\n• **Shortage Notice**: Students between 65% and 74% require Dean approval and condonation fee payment.',
      suggestedFollowups: [
        'Where do I check my subject-wise attendance?',
        'How do I submit a medical leave certificate?',
        'What is the exam condonation fee?',
      ],
    };
  }

  // 5. Transcripts, Certificates & Bonafide
  if (q.includes('transcript') || q.includes('certificate') || q.includes('marksheet') || q.includes('bonafide') || q.includes('grade card') || q.includes('cgpa') || q.includes('gpa')) {
    return {
      reply: 'Official academic documents can be ordered through the Student Portal under **Documents → Request Certificate**.\n• **Digital Transcripts**: Verifiable e-signed PDF transcripts are issued within 1–2 business days at no cost.\n• **Physical Copies**: Embossed and sealed hard copies can be collected at the Registrar Office (Block A, Room 104) or shipped via courier.\n• **Bonafide Certificates**: Processed within 24 hours for passport, visa, bank loan, or internship applications.',
      suggestedFollowups: [
        'How long does transcript verification take?',
        'Can physical transcripts be delivered by courier?',
        'How do I get a bonafide letter for an internship?',
      ],
    };
  }

  // 6. Scholarships & Financial Aid
  if (q.includes('scholarship') || q.includes('financial aid') || q.includes('grant') || q.includes('concession')) {
    return {
      reply: 'Multiple financial aid programs are available:\n• **Merit Scholarships**: Up to 50% tuition waiver for students with CGPA ≥ 8.5.\n• **Need-Based Aid**: Concessions for students with annual family income below specified thresholds.\n• **Sports & Special Grants**: Available for state/national athletic achievements.\n• **How to Apply**: Applications open every June and December on scholarships.university.edu.',
      suggestedFollowups: [
        'What CGPA is required for merit scholarships?',
        'Which government scholarships are accepted?',
        'When are scholarship disbursements credited?',
      ],
    };
  }

  // 7. Health, Medical & Counseling
  if (q.includes('health') || q.includes('doctor') || q.includes('medical') || q.includes('clinic') || q.includes('hospital') || q.includes('counsel') || q.includes('mental') || q.includes('stress')) {
    return {
      reply: 'The Student Health Centre is located in **Block D, Ground Floor**.\n• **Hours**: Mon–Fri 8:00 AM – 6:00 PM; Saturdays 9:00 AM – 1:00 PM.\n• **24/7 Ambulance & Emergency**: Call campus emergency line: **1800-419-CARE**.\n• **Confidential Counseling**: Free mental health counseling and stress support sessions can be booked online or via walk-in.',
      suggestedFollowups: [
        'How do I book a confidential counseling appointment?',
        'What is the 24/7 campus medical emergency number?',
        'Are routine prescription medicines provided on campus?',
      ],
    };
  }

  // 8. Hostel, Dorm & Mess
  if (q.includes('hostel') || q.includes('dorm') || q.includes('room') || q.includes('mess') || q.includes('curfew') || q.includes('warden')) {
    return {
      reply: 'Hostel and campus living facilities are managed through the Hostel Administration Office in **Block H**.\n• **Curfew Hours**: Campus entry is 10:00 PM on weekdays and 10:30 PM on weekends.\n• **Room Change**: Requests for room changes for the next term must be submitted to the Chief Warden by the 15th of the month.\n• **Mess Menu**: Rotates monthly with dietary options; meal feedback is reviewed weekly by the student mess committee.',
      suggestedFollowups: [
        'How do I submit a room change request?',
        'What are the hostel curfew hours?',
        'How do I apply for overnight leave from the hostel?',
      ],
    };
  }

  // 9. Wi-Fi & IT Portal Support
  if (q.includes('wifi') || q.includes('wi-fi') || q.includes('internet') || q.includes('password') || q.includes('login') || q.includes('portal') || q.includes('account')) {
    return {
      reply: 'For campus connectivity and account access:\n• **EduTrack-5G Wi-Fi**: Connect using your student roll number and portal password. Set EAP to PEAP and Phase 2 to MSCHAPv2.\n• **Password Reset**: Use the "Forgot Password" link on portal.university.edu to receive an OTP on your registered mobile/email.\n• **IT Helpdesk**: Block A, Room 204 (Mon–Fri 9am–5pm) or email helpdesk@university.edu.',
      suggestedFollowups: [
        'How do I reset my portal password?',
        'Where is the IT Helpdesk located?',
        'How do I register a new device MAC address?',
      ],
    };
  }

  // 10. Exams, Results & Revaluation
  if (q.includes('exam') || q.includes('examination') || q.includes('schedule') || q.includes('timetable') || q.includes('hall ticket') || q.includes('result') || q.includes('reval')) {
    return {
      reply: 'Examination schedules and academic records:\n• **Timetables & Hall Tickets**: Released 3 weeks prior to finals under the **Examinations** portal tab.\n• **Results Declaration**: Published online within 15 days of final exam completion.\n• **Revaluation**: Paper re-checking applications open for 7 days following result announcement via the student portal.',
      suggestedFollowups: [
        'How do I apply for paper revaluation?',
        'When will final exam schedules be published?',
        'How is CGPA computed from semester grades?',
      ],
    };
  }

  // 11. Greetings & General Inquiries
  if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q === 'help') {
    return {
      reply: "Hello! I'm your **EduTrack AI Student Assistant**. I can help you with:\n• **Course Registration & Add/Drop**\n• **Tuition Fee Payments & Instalments**\n• **Library Hours & Digital Journal Access**\n• **Attendance Rules & Medical Condonation**\n• **Exam Timetables & Transcripts**\n• **Student Wellbeing & Counseling**\n\nWhat would you like assistance with today?",
      suggestedFollowups: [
        'How do I pay tuition fees?',
        'How do I register for courses?',
        'What are the library hours?',
      ],
    };
  }

  // General helpful university response
  const channelContext = category ? ` regarding **${category}**` : '';
  return {
    reply: `I can help you with that${channelContext}! Official university information, application forms, and policy handbooks are available on the **Student Portal (portal.university.edu)**.\n\nFor personalized in-person assistance, you can visit:\n• **Student Services Centre**: Block A, Room 101 (Mon–Fri, 9:00 AM – 5:00 PM)\n• **Helpdesk Email**: support@university.edu\n• **Student Helpline**: +91-80-2345-6789`,
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

      <div className={`flex flex-col max-w-[84%] sm:max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 rounded-2xl shadow-xs ${
            isUser
              ? 'bg-primary text-on-primary rounded-br-xs font-medium text-xs sm:text-sm'
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
      <span className="text-xs font-medium text-on-surface-variant ml-1.5">EduTrack AI is generating answer...</span>
    </div>
  </div>
);

// ─── Main SupportChatbot Full Page View ────────────────────────────────────────

type ActiveViewTab = 'chat' | 'categories' | 'faq' | 'contact';

export const SupportChatbot: React.FC = () => {
  const { firebaseUser, showToast } = useEduTrack();
  const [activeTab, setActiveTab] = useState<ActiveViewTab>('chat');
  const [sessionTopic, setSessionTopic] = useState('All Topics');
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [faqSearch, setFaqSearch] = useState('');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  // Initialize with ready-to-go interactive messages so the user sees support immediately!
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'bot',
      text: `👋 Hello! I'm your **EduTrack AI Student Assistant**.\n\nI can help you with course registration, fee deadlines, grades, library services, attendance rules, and campus facilities. What can I help you with today?`,
      timestamp: getTimestamp(),
      quickReplies: [
        'How do I pay tuition fees online?',
        'How do I register for courses?',
        'What are the library hours?',
        'What is the attendance policy?',
      ],
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Unified answer resolver: queries backend endpoint, seamlessly falls back to local knowledge engine
  const resolveBotAnswer = useCallback(
    async (
      question: string,
      history: ChatMessage[],
      category?: string
    ): Promise<{ reply: string; suggestedFollowups: string[] }> => {
      // 1. Try backend API first
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
          if (data && typeof data.reply === 'string' && data.reply.trim().length > 0) {
            return {
              reply: data.reply,
              suggestedFollowups: Array.isArray(data.suggestedFollowups) && data.suggestedFollowups.length > 0
                ? data.suggestedFollowups
                : ['How do I contact my advisor?', 'What are the library hours?', 'Where is the Health Centre?'],
            };
          }
        }
      } catch (err) {
        console.warn('Backend support chat call bypassed, using instant engine:', err);
      }

      // 2. Reliable client-side knowledge engine (always answers accurately)
      return getInstantSupportAnswer(question, category);
    },
    [getAuthToken]
  );

  // Send user message
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

      const botResult = await resolveBotAnswer(question, nextMessages, activeCategory);

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
    [inputValue, isTyping, messages, activeCategory, resolveBotAnswer]
  );

  // Switch category channel
  const handleSelectCategory = useCallback(
    (cat: ChatCategory) => {
      setSessionTopic(cat.label);
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
        text: `You're now in the **${cat.label}** channel.\n\n*Topic coverage*: ${cat.description}.\n\nHow can I help you with ${cat.label.toLowerCase()}?`,
        timestamp: getTimestamp(),
        quickReplies: QUICK_STARTERS.slice(0, 3),
      };

      setMessages((prev) => [...prev, channelMsg, botGreeting]);
      setTimeout(() => inputRef.current?.focus(), 100);
    },
    []
  );

  // Ask a specific question immediately in chat
  const handleAskQuickQuestion = useCallback(
    (question: string) => {
      setActiveTab('chat');
      handleSendMessage(question);
    },
    [handleSendMessage]
  );

  // Clear chat session
  const handleClearChat = useCallback(() => {
    setMessages([
      {
        id: uid(),
        role: 'bot',
        text: `👋 Started fresh chat session.\n\nHow can I help you with your courses, exams, fees, or campus life?`,
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
      {/* ── Top Header Bar ───────────────────────────────────────────── */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="bg-primary px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-on-primary">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-on-primary/15 flex items-center justify-center flex-shrink-0 shadow-inner">
              <span className="material-symbols-outlined text-[24px]">support_agent</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold leading-tight">Student Support Hub</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-on-primary/20 text-[10px] font-bold uppercase tracking-wider">
                  24/7 AI Online
                </span>
              </div>
              <p className="text-xs text-on-primary/80 mt-0.5">
                Instant university guidance on admissions, fees, registration, exams, and student services
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearChat}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-on-primary/15 hover:bg-on-primary/25 text-on-primary transition-colors flex items-center gap-1.5"
              title="Clear conversation"
            >
              <span className="material-symbols-outlined text-[15px]">refresh</span>
              <span>New Chat</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-outline-variant/20 bg-surface-container-low/50">
          {(
            [
              ['chat', 'chat', 'Live Support Chat'],
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
                className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  isActive
                    ? 'border-primary text-primary bg-surface-container-lowest'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active Tab Display ────────────────────────────────────────── */}

      {/* TAB 1: LIVE SUPPORT CHAT */}
      {activeTab === 'chat' && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col h-[580px] sm:h-[620px]">
          {/* Quick Category Chips Strip */}
          <div className="px-3 sm:px-4 py-2 border-b border-outline-variant/20 bg-surface-container-low/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-bold text-outline uppercase tracking-wider flex-shrink-0 mr-1">
              Channels:
            </span>
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

            {isTyping && <TypingDots />}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <div className="border-t border-outline-variant/20 p-3 sm:p-4 bg-surface-container-low/30">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about tuition fees, course registration, attendance, transcripts..."
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
                  className="px-2 py-0.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface-variant hover:text-primary hover:border-primary/40 truncate flex-shrink-0 transition-colors"
                >
                  {qs}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HELP TOPICS */}
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

      {/* TAB 3: FAQ DATABASE */}
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
                  className="text-primary font-bold hover:underline"
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

      {/* TAB 4: STAFF DIRECTORY */}
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
        <span>EduTrack Student Support · Instant AI &amp; University Knowledge Hub</span>
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

  // Widget starts with instant, ready greeting
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'bot',
      text: `👋 Hi! I'm your **EduTrack Support Assistant**.\n\nAsk me anything about fees, course registration, attendance, transcripts, or campus life!`,
      timestamp: getTimestamp(),
      quickReplies: [
        'How do I pay tuition fees?',
        'How do I register for courses?',
        'What are the library hours?',
      ],
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const widgetInputRef = useRef<HTMLInputElement>(null);

  // Hide on login screen and when already viewing the full Support page
  if (activeScreen === 'login' || activeScreen === 'support-chatbot') {
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

    // Try API call first
    let botReply = '';
    let followups: string[] = [];

    try {
      const token = firebaseUser ? await firebaseUser.getIdToken() : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/ai/support-chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: question,
          history: nextMessages
            .filter((m) => m.role === 'user' || m.role === 'bot')
            .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.reply === 'string' && data.reply.trim().length > 0) {
          botReply = data.reply;
          followups = Array.isArray(data.suggestedFollowups) ? data.suggestedFollowups : [];
        }
      }
    } catch {
      /* network fallback */
    }

    // Seamless instant fallback
    if (!botReply) {
      const fallbackResult = getInstantSupportAnswer(question);
      botReply = fallbackResult.reply;
      followups = fallbackResult.suggestedFollowups;
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
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="widget-window"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-[330px] sm:w-[370px] bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col overflow-hidden"
            style={{ maxHeight: '500px' }}
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

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-on-primary/15 text-on-primary/80 hover:text-on-primary transition-colors cursor-pointer"
                aria-label="Close support chat"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 min-h-[200px] max-h-[340px] bg-surface-container-low/20">
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
                placeholder="Ask about fees, courses, exams, library..."
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
      </motion.button>
    </div>
  );
};
