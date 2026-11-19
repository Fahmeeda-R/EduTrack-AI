import {
  BRAND_LOGO_URL,
  DEFAULT_ANNOUNCEMENTS_SEED,
  DEFAULT_ASSIGNMENTS_SEED,
  DEFAULT_CALENDAR_EVENTS_SEED,
  DEFAULT_CHAT_MESSAGES_SEED,
  DEFAULT_DOCUMENTS_SEED,
  DEFAULT_STUDY_BLOCKS_SEED,
  LECTURE_BANNER_URL,
  PROF_VANCE_AVATAR_URL,
  STUDENT_AVATAR_URL,
} from '../db/seed.ts';
import type { WorkspacePayload } from '../types/edutrack.ts';

export {
  BRAND_LOGO_URL,
  STUDENT_AVATAR_URL,
  PROF_VANCE_AVATAR_URL,
  LECTURE_BANNER_URL,
};

export function createPreviewWorkspace(role: 'student' | 'faculty' = 'student'): WorkspacePayload {
  return {
    user: {
      id: 0,
      uid: 'preview-user',
      email: role === 'faculty' ? 'prof.vance@university.edu' : 'elena.rostova@university.edu',
      displayName: role === 'faculty' ? 'Prof. Marcus Vance' : 'Elena Rostova',
      role,
      department: 'Computer Science',
      standing: role === 'faculty' ? 'Faculty · Systems Chair' : 'Year 3 (Junior)',
      avatarUrl: role === 'faculty' ? PROF_VANCE_AVATAR_URL : STUDENT_AVATAR_URL,
      darkMode: false,
    },
    assignments: DEFAULT_ASSIGNMENTS_SEED.map((item, index) => ({
      id: index + 1,
      ...item,
    })),
    calendarEvents: DEFAULT_CALENDAR_EVENTS_SEED.map((item, index) => ({
      id: index + 1,
      ...item,
    })),
    documents: DEFAULT_DOCUMENTS_SEED.map((item, index) => ({
      id: index + 1,
      ...item,
    })),
    announcements: DEFAULT_ANNOUNCEMENTS_SEED.map((item, index) => ({
      id: index + 1,
      ...item,
    })),
    studyBlocks: DEFAULT_STUDY_BLOCKS_SEED.map((item, index) => ({
      id: index + 1,
      ...item,
    })),
    chatMessages: DEFAULT_CHAT_MESSAGES_SEED.map((item, index) => ({
      id: index + 1,
      role: item.role as 'user' | 'assistant',
      content: item.content,
      courseScope: item.courseScope,
      codeSnippet: item.codeSnippet,
      codeFilename: item.codeFilename,
      timestampLabel: item.timestampLabel,
    })),
  };
}
