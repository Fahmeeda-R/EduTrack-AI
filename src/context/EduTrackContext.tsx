import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { createPreviewWorkspace } from '../data/previewSeed.ts';
import type {
  AiRubricResult,
  AnnouncementItem,
  AssignmentItem,
  CalendarEventItem,
  ChatMessageItem,
  DocumentItem,
  ScreenId,
  StudyBlockItem,
  SubmittedFileItem,
  UserProfile,
  UserRole,
} from '../types/edutrack.ts';

interface ToastState {
  message: string;
  tone: 'success' | 'info' | 'error';
}

interface EduTrackContextValue {
  firebaseUser: User | null;
  authLoading: boolean;
  isAuthenticated: boolean;
  isPreviewMode: boolean;
  activeScreen: ScreenId;
  setActiveScreen: (screen: ScreenId) => void;
  selectedAssignmentId: number | null;
  openAssignmentSubmission: (assignmentId: number) => void;
  userProfile: UserProfile;
  assignments: AssignmentItem[];
  calendarEvents: CalendarEventItem[];
  documents: DocumentItem[];
  announcements: AnnouncementItem[];
  studyBlocks: StudyBlockItem[];
  chatMessages: ChatMessageItem[];
  darkMode: boolean;
  toggleDarkMode: () => void;
  toast: ToastState | null;
  showToast: (message: string, tone?: 'success' | 'info' | 'error') => void;
  signInWithGoogle: (preferredRole?: UserRole, profileOverrides?: Partial<UserProfile>) => Promise<void>;
  enterPreviewMode: (role?: UserRole, profileOverrides?: Partial<UserProfile>) => void;
  handleSignOut: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  createAssignment: (input: {
    title: string;
    subtitle?: string;
    course: string;
    dueDate: string;
    dueLabel: string;
    priority: string;
    weight: number;
    status?: string;
    guidelines?: string;
  }) => Promise<void>;
  updateAssignment: (
    id: number,
    patch: Partial<AssignmentItem>
  ) => Promise<void>;
  createCalendarEvent: (input: Omit<CalendarEventItem, 'id'>) => Promise<void>;
  addDocument: (input: Omit<DocumentItem, 'id' | 'aiSynced' | 'lastReadLabel'>) => Promise<void>;
  removeDocument: (id: number) => Promise<void>;
  publishAnnouncement: (input: {
    author: string;
    department: string;
    category: string;
    tagLabel: string;
    title: string;
    body: string;
    isPinned?: boolean;
    metaText?: string;
  }) => Promise<void>;
  toggleAnnouncementBookmark: (id: number) => Promise<void>;
  toggleAnnouncementRsvp: (id: number) => Promise<void>;
  addStudyBlock: (input: Omit<StudyBlockItem, 'id' | 'completed'>) => Promise<void>;
  toggleStudyBlockDone: (id: number) => Promise<void>;
  regenerateStudyPlanAi: () => Promise<void>;
  sendTutorMessage: (params: {
    prompt: string;
    courseScope: string;
    documentContext?: string;
    simplify?: boolean;
    retry?: boolean;
  }) => Promise<void>;
  clearTutorChat: () => Promise<void>;
  runRubricPrecheckAi: (assignment: AssignmentItem, files: SubmittedFileItem[]) => Promise<AiRubricResult>;
}

const EduTrackContext = createContext<EduTrackContextValue | null>(null);

export const EduTrackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialPreview = useMemo(() => createPreviewWorkspace('student'), []);

  // Check URL hash for direct deep-linking (e.g. #support or #support-chatbot)
  const getInitialScreenFromHash = (): ScreenId => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const h = window.location.hash.replace('#', '').toLowerCase();
      if (h === 'support' || h === 'support-chatbot') return 'support-chatbot';
      if (h === 'dashboard') return 'dashboard';
      if (h === 'assignments') return 'assignments';
      if (h === 'calendar') return 'calendar';
      if (h === 'ai-assistant') return 'ai-assistant';
      if (h === 'ai-study-planner') return 'ai-study-planner';
      if (h === 'my-documents') return 'my-documents';
      if (h === 'announcements') return 'announcements';
    }
    return 'login';
  };

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const h = window.location.hash.replace('#', '').toLowerCase();
      return h === 'support' || h === 'support-chatbot';
    }
    return false;
  });
  const [activeScreen, setActiveScreenState] = useState<ScreenId>(getInitialScreenFromHash);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(1);

  const [userProfile, setUserProfile] = useState<UserProfile>(initialPreview.user);
  const [assignments, setAssignments] = useState<AssignmentItem[]>(initialPreview.assignments);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>(
    initialPreview.calendarEvents
  );
  const [documents, setDocuments] = useState<DocumentItem[]>(initialPreview.documents);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(
    initialPreview.announcements
  );
  const [studyBlocks, setStudyBlocks] = useState<StudyBlockItem[]>(initialPreview.studyBlocks);
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>(initialPreview.chatMessages);

  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const idTokenRef = useRef<string | null>(null);
  const pendingOverridesRef = useRef<Partial<UserProfile> | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback(
    (message: string, tone: 'success' | 'info' | 'error' = 'info') => {
      setToast({ message, tone });
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 2800);
    },
    []
  );

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = auth.currentUser ? await auth.currentUser.getIdToken() : idTokenRef.current;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errBody.error || `HTTP ${res.status}`);
    }
    return res.json();
  }, []);


  const FACULTY_ONLY_SCREENS: ScreenId[] = useMemo(
    () => [
      'academic-management',
      'gradebook',
      'assignment-publisher',
      'announcements-manager',
    ],
    []
  );

  const setActiveScreen = useCallback(
    (next: ScreenId | ((prev: ScreenId) => ScreenId)) => {
      setActiveScreenState((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        const role = userProfile.role;
        const isFaculty = role === 'faculty' || role === 'staff';
        if (FACULTY_ONLY_SCREENS.includes(resolved) && !isFaculty) {
          return 'dashboard';
        }
        if (typeof window !== 'undefined') {
          const hashVal = resolved === 'support-chatbot' ? 'support' : resolved;
          window.location.hash = hashVal;
        }
        return resolved;
      });
    },
    [FACULTY_ONLY_SCREENS, userProfile.role]
  );

  useEffect(() => {
    // Safety fallback: Never let auth loading get permanently stuck
    const safetyTimer = setTimeout(() => {
      setAuthLoading(false);
    }, 2000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(safetyTimer);
      setFirebaseUser(user);
      if (user) {
        try {
          idTokenRef.current = await user.getIdToken();
          setIsPreviewMode(false);
          const data = await apiFetch('/api/workspace');
          setUserProfile(data.user);
          setAssignments(data.assignments);
          setCalendarEvents(data.calendarEvents);
          setDocuments(data.documents);
          setAnnouncements(data.announcements);
          setStudyBlocks(data.studyBlocks);
          setChatMessages(data.chatMessages);
          setDarkMode(Boolean(data.user?.darkMode));
          if (data.assignments?.length > 0) {
            setSelectedAssignmentId(data.assignments[0].id);
          }

          let effectiveRole: UserRole = data.user?.role || 'student';

          if (pendingOverridesRef.current) {
            const overrides = pendingOverridesRef.current;
            pendingOverridesRef.current = null;
            const res = await apiFetch('/api/profile', {
              method: 'PATCH',
              body: JSON.stringify(overrides),
            });
            if (res.user) {
              setUserProfile(res.user);
              effectiveRole = res.user.role;
            } else if (overrides.role) {
              effectiveRole = overrides.role;
            }
          }

          const isFacultyUser = effectiveRole === 'faculty' || effectiveRole === 'staff';
          setActiveScreenState((prev) => {
            if (prev === 'login') {
              return isFacultyUser ? 'academic-management' : 'dashboard';
            }
            return prev;
          });
        } catch (err) {
          console.error('Failed to sync Cloud SQL workspace:', err);
          showToast('Signed in, using local fallback while database warms up.', 'info');
          setIsPreviewMode(true);
          setActiveScreenState((prev) => (prev === 'login' ? 'dashboard' : prev));
        }
      } else {
        idTokenRef.current = null;
      }
      setAuthLoading(false);
    });
    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, [apiFetch, showToast]);

  const signInWithGoogle = useCallback(
    async (preferredRole: UserRole = 'student', profileOverrides?: Partial<UserProfile>) => {
      try {
        pendingOverridesRef.current = {
          role: preferredRole,
          ...profileOverrides,
        };
        await signInWithPopup(auth, googleAuthProvider);
        showToast('Authenticated via Google SSO & synced with Cloud SQL', 'success');
        setActiveScreenState(
          preferredRole === 'faculty' || preferredRole === 'staff'
            ? 'academic-management'
            : 'dashboard'
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Google sign-in cancelled';
        showToast(msg, 'error');
      }
    },
    [showToast]
  );

  const enterPreviewMode = useCallback(
    (role: UserRole = 'student', profileOverrides?: Partial<UserProfile>) => {
      const isFacultyRole = role === 'faculty' || role === 'staff';
      const workspace = createPreviewWorkspace(isFacultyRole ? 'faculty' : 'student');
      setIsPreviewMode(true);
      setUserProfile({
        ...workspace.user,
        role,
        ...profileOverrides,
      });
      setAssignments(workspace.assignments);
      setCalendarEvents(workspace.calendarEvents);
      setDocuments(workspace.documents);
      setAnnouncements(workspace.announcements);
      setStudyBlocks(workspace.studyBlocks);
      setChatMessages(workspace.chatMessages);
      setSelectedAssignmentId(workspace.assignments[0]?.id ?? null);
      setActiveScreenState(isFacultyRole ? 'academic-management' : 'dashboard');
      showToast(
        isFacultyRole
          ? 'Entered Faculty Portal preview'
          : 'Entered Student Portal preview',
        'success'
      );
    },
    [showToast]
  );

  const handleSignOut = useCallback(async () => {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
      idTokenRef.current = null;
      setIsPreviewMode(false);
      setUserProfile((prev) => ({ ...prev, role: 'student' }));
      setActiveScreenState('login');
      showToast('Signed out of EduTrack AI', 'info');
    } catch {
      showToast('Error signing out', 'error');
    }
  }, [showToast]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      if (auth.currentUser) {
        apiFetch('/api/profile', {
          method: 'PATCH',
          body: JSON.stringify({ darkMode: next }),
        }).catch(() => {});
      }
      return next;
    });
  }, [apiFetch]);

  const updateProfile = useCallback(
    async (patch: Partial<UserProfile>) => {
      setUserProfile((prev) => ({ ...prev, ...patch }));
      if (auth.currentUser) {
        const data = await apiFetch('/api/profile', {
          method: 'PATCH',
          body: JSON.stringify(patch),
        });
        if (data.user) setUserProfile(data.user);
      }
      showToast('Account settings saved', 'success');
    },
    [apiFetch, showToast]
  );

  const switchRole = useCallback(
    async (role: UserRole) => {
      await updateProfile({ role });
      const isFacultyRole = role === 'faculty' || role === 'staff';
      setActiveScreenState(isFacultyRole ? 'academic-management' : 'dashboard');
      showToast(
        isFacultyRole ? 'Switched to Faculty Portal' : 'Switched to Student Hub',
        'info'
      );
    },
    [showToast, updateProfile]
  );

  const openAssignmentSubmission = useCallback(
    (assignmentId: number) => {
      setSelectedAssignmentId(assignmentId);
      setActiveScreen('submission');
    },
    [setActiveScreen]
  );

  const createAssignment = useCallback(
    async (input: {
      title: string;
      subtitle?: string;
      course: string;
      dueDate: string;
      dueLabel: string;
      priority: string;
      weight: number;
      status?: string;
      guidelines?: string;
    }) => {
      if (auth.currentUser) {
        const created = await apiFetch('/api/assignments', {
          method: 'POST',
          body: JSON.stringify(input),
        });
        setAssignments((prev) => [created, ...prev]);
      } else {
        const created: AssignmentItem = {
          id: Date.now(),
          title: input.title,
          subtitle: input.subtitle || `${input.course} coursework deliverable`,
          course: input.course,
          instructor: 'Prof. Marcus Vance',
          dueDate: input.dueDate,
          dueLabel: input.dueLabel,
          priority: input.priority,
          status: input.status || 'not_started',
          progress: 0,
          weight: input.weight,
          maxPoints: 100,
          gradeScore: null,
          gradeLetter: null,
          milestoneText: 'Initial Milestone',
          guidelines: input.guidelines || 'Follow syllabus guidelines.',
          submittedFiles: [],
          aiRubricResult: null,
        };
        setAssignments((prev) => [created, ...prev]);
      }
      showToast('Coursework task created', 'success');
    },
    [apiFetch, showToast]
  );

  const updateAssignment = useCallback(
    async (id: number, patch: Partial<AssignmentItem>) => {
      setAssignments((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
      );
      if (auth.currentUser) {
        await apiFetch(`/api/assignments/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(patch),
        });
      }
    },
    [apiFetch]
  );

  const createCalendarEvent = useCallback(
    async (input: Omit<CalendarEventItem, 'id'>) => {
      if (auth.currentUser) {
        const created = await apiFetch('/api/calendar-events', {
          method: 'POST',
          body: JSON.stringify(input),
        });
        setCalendarEvents((prev) => [...prev, created]);
      } else {
        setCalendarEvents((prev) => [...prev, { id: Date.now(), ...input }]);
      }
      showToast('Added to Academic Calendar', 'success');
    },
    [apiFetch, showToast]
  );

  const addDocument = useCallback(
    async (input: Omit<DocumentItem, 'id' | 'aiSynced' | 'lastReadLabel'>) => {
      if (auth.currentUser) {
        const created = await apiFetch('/api/documents', {
          method: 'POST',
          body: JSON.stringify(input),
        });
        setDocuments((prev) => [created, ...prev]);
      } else {
        setDocuments((prev) => [
          {
            id: Date.now(),
            ...input,
            aiSynced: true,
            lastReadLabel: 'Just now',
          },
          ...prev,
        ]);
      }
      showToast(`Indexed "${input.name}" in Library`, 'success');
    },
    [apiFetch, showToast]
  );

  const removeDocument = useCallback(
    async (id: number) => {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (auth.currentUser) {
        await apiFetch(`/api/documents/${id}`, { method: 'DELETE' });
      }
      showToast('Document removed', 'info');
    },
    [apiFetch, showToast]
  );

  const publishAnnouncement = useCallback(
    async (input: {
      author: string;
      department: string;
      category: string;
      tagLabel: string;
      title: string;
      body: string;
      isPinned?: boolean;
      metaText?: string;
    }) => {
      if (auth.currentUser) {
        const created = await apiFetch('/api/announcements', {
          method: 'POST',
          body: JSON.stringify(input),
        });
        setAnnouncements((prev) => [created, ...prev]);
      } else {
        setAnnouncements((prev) => [
          {
            id: Date.now(),
            author: input.author,
            department: input.department,
            category: input.category,
            tagLabel: input.tagLabel,
            title: input.title,
            body: input.body,
            dateLabel: `Just now · ${input.department}`,
            isPinned: Boolean(input.isPinned),
            isBookmarked: false,
            isRsvped: false,
            metaText: input.metaText || '',
          },
          ...prev,
        ]);
      }
      showToast('Announcement published', 'success');
    },
    [apiFetch, showToast]
  );

  const toggleAnnouncementBookmark = useCallback(
    async (id: number) => {
      const target = announcements.find((a) => a.id === id);
      if (!target) return;
      const next = !target.isBookmarked;
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isBookmarked: next } : a))
      );
      if (auth.currentUser) {
        await apiFetch(`/api/announcements/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ isBookmarked: next }),
        });
      }
      showToast(next ? 'Bulletin bookmarked' : 'Bookmark removed', 'info');
    },
    [announcements, apiFetch, showToast]
  );

  const toggleAnnouncementRsvp = useCallback(
    async (id: number) => {
      const target = announcements.find((a) => a.id === id);
      if (!target) return;
      const next = !target.isRsvped;
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isRsvped: next } : a))
      );
      if (auth.currentUser) {
        await apiFetch(`/api/announcements/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ isRsvped: next }),
        });
      }
      showToast(next ? 'RSVP confirmed for seminar' : 'RSVP cancelled', 'success');
    },
    [announcements, apiFetch, showToast]
  );

  const addStudyBlock = useCallback(
    async (input: Omit<StudyBlockItem, 'id' | 'completed'>) => {
      if (auth.currentUser) {
        const created = await apiFetch('/api/study-blocks', {
          method: 'POST',
          body: JSON.stringify(input),
        });
        setStudyBlocks((prev) => [created, ...prev]);
      } else {
        setStudyBlocks((prev) => [{ id: Date.now(), ...input, completed: false }, ...prev]);
      }
      showToast('Added focus block to Study Planner', 'success');
    },
    [apiFetch, showToast]
  );

  const toggleStudyBlockDone = useCallback(
    async (id: number) => {
      const target = studyBlocks.find((b) => b.id === id);
      if (!target) return;
      const next = !target.completed;
      setStudyBlocks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, completed: next } : b))
      );
      if (auth.currentUser) {
        await apiFetch(`/api/study-blocks/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ completed: next }),
        });
      }
    },
    [apiFetch, studyBlocks]
  );

  const regenerateStudyPlanAi = useCallback(async () => {
    const data = await apiFetch('/api/ai/study-plan', {
      method: 'POST',
      body: JSON.stringify({ assignments }),
    });
    if (Array.isArray(data.blocks)) {
      setStudyBlocks(data.blocks);
      showToast('AI Study Plan optimized from live deadlines', 'success');
    }
  }, [apiFetch, assignments, showToast]);

  const sendTutorMessage = useCallback(
    async (params: {
      prompt: string;
      courseScope: string;
      documentContext?: string;
      simplify?: boolean;
      retry?: boolean;
    }) => {
      const nowLabel = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      if (!params.simplify && !params.retry) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            role: 'user',
            content: params.prompt,
            courseScope: params.courseScope,
            timestampLabel: nowLabel,
          },
        ]);
      }

      const data = await apiFetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify(params),
      });

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.explanation,
          courseScope: params.courseScope,
          codeSnippet: data.codeSnippet,
          codeFilename: data.codeFilename,
          timestampLabel: data.timestampLabel || nowLabel,
        },
      ]);
    },
    [apiFetch]
  );

  const clearTutorChat = useCallback(async () => {
    setChatMessages([]);
    if (auth.currentUser) {
      await apiFetch('/api/chat-messages', { method: 'DELETE' });
    }
    showToast('Started fresh Tutor AI session', 'info');
  }, [apiFetch, showToast]);

  const runRubricPrecheckAi = useCallback(
    async (assignment: AssignmentItem, files: SubmittedFileItem[]) => {
      const result: AiRubricResult = await apiFetch('/api/ai/rubric-precheck', {
        method: 'POST',
        body: JSON.stringify({
          assignmentId: assignment.id,
          title: assignment.title,
          course: assignment.course,
          guidelines: assignment.guidelines,
          files,
        }),
      });
      setAssignments((prev) =>
        prev.map((a) => (a.id === assignment.id ? { ...a, aiRubricResult: result } : a))
      );
      showToast('AI Rubric Pre-Flight scan completed', 'success');
      return result;
    },
    [apiFetch, showToast]
  );

  const value: EduTrackContextValue = {
    firebaseUser,
    authLoading,
    isAuthenticated: Boolean(firebaseUser) || isPreviewMode,
    isPreviewMode,
    activeScreen,
    setActiveScreen,
    selectedAssignmentId,
    openAssignmentSubmission,
    userProfile,
    assignments,
    calendarEvents,
    documents,
    announcements,
    studyBlocks,
    chatMessages,
    darkMode,
    toggleDarkMode,
    toast,
    showToast,
    signInWithGoogle,
    enterPreviewMode,
    handleSignOut,
    switchRole,
    updateProfile,
    createAssignment,
    updateAssignment,
    createCalendarEvent,
    addDocument,
    removeDocument,
    publishAnnouncement,
    toggleAnnouncementBookmark,
    toggleAnnouncementRsvp,
    addStudyBlock,
    toggleStudyBlockDone,
    regenerateStudyPlanAi,
    sendTutorMessage,
    clearTutorChat,
    runRubricPrecheckAi,
  };

  return <EduTrackContext.Provider value={value}>{children}</EduTrackContext.Provider>;
};

export function useEduTrack(): EduTrackContextValue {
  const ctx = useContext(EduTrackContext);
  if (!ctx) {
    throw new Error('useEduTrack must be used inside EduTrackProvider');
  }
  return ctx;
}
