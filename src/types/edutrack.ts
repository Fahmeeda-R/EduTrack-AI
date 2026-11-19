export type ScreenId =
  | 'login'
  | 'dashboard'
  | 'assignments'
  | 'submission'
  | 'calendar'
  | 'ai-assistant'
  | 'my-documents'
  | 'announcements'
  | 'ai-study-planner'
  | 'academic-management'
  | 'gradebook'
  | 'assignment-publisher'
  | 'announcements-manager'
  | 'account-settings';

export type UserRole = 'student' | 'faculty' | 'staff';

export interface UserProfile {
  id: number;
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  department: string;
  standing: string;
  avatarUrl?: string | null;
  darkMode: boolean;
}

export interface SubmittedFileItem {
  name: string;
  size: string;
  status: string;
}

export interface AiRubricCriterion {
  title: string;
  subtitle: string;
  badge: string;
  status: 'passed' | 'warning' | 'info';
}

export interface AiRubricResult {
  projectedScore: number;
  gradeLetter: string;
  confidence: string;
  criteria: AiRubricCriterion[];
  polishTip: string;
}

export interface AssignmentItem {
  id: number;
  title: string;
  subtitle: string;
  course: string;
  instructor: string;
  dueDate: string;
  dueLabel: string;
  priority: string;
  status: string;
  progress: number;
  weight: number;
  maxPoints: number;
  gradeScore?: number | null;
  gradeLetter?: string | null;
  milestoneText: string;
  guidelines: string;
  thumbnailUrl?: string | null;
  submittedFiles: SubmittedFileItem[];
  aiRubricResult?: AiRubricResult | null;
}

export interface CalendarEventItem {
  id: number;
  title: string;
  course: string;
  date: string;
  timeRange: string;
  location: string;
  eventType: string;
  badgeText: string;
  description: string;
}

export interface DocumentItem {
  id: number;
  name: string;
  course: string;
  fileType: string;
  sizeBytes: number;
  sizeLabel: string;
  aiSynced: boolean;
  lastReadLabel: string;
  summary: string;
}

export interface AnnouncementItem {
  id: number;
  author: string;
  department: string;
  category: string;
  tagLabel: string;
  title: string;
  body: string;
  dateLabel: string;
  isPinned: boolean;
  isBookmarked: boolean;
  isRsvped: boolean;
  imageUrl?: string | null;
  metaText: string;
}

export interface StudyBlockItem {
  id: number;
  title: string;
  course: string;
  priority: string;
  timeRange: string;
  durationLabel: string;
  targetText: string;
  blockType: string;
  completed: boolean;
}

export interface ChatMessageItem {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  courseScope: string;
  codeSnippet?: string | null;
  codeFilename?: string | null;
  timestampLabel: string;
}

export interface WorkspacePayload {
  user: UserProfile;
  assignments: AssignmentItem[];
  calendarEvents: CalendarEventItem[];
  documents: DocumentItem[];
  announcements: AnnouncementItem[];
  studyBlocks: StudyBlockItem[];
  chatMessages: ChatMessageItem[];
}
