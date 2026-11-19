import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

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

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name').notNull().default('Elena Rostova'),
  role: text('role').notNull().default('student'),
  department: text('department').notNull().default('Computer Science'),
  standing: text('standing').notNull().default('Year 3 (Junior)'),
  avatarUrl: text('avatar_url'),
  darkMode: boolean('dark_mode').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const assignments = pgTable('assignments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull().default(''),
  course: text('course').notNull(),
  instructor: text('instructor').notNull().default('Prof. Marcus Vance'),
  dueDate: text('due_date').notNull(),
  dueLabel: text('due_label').notNull(),
  priority: text('priority').notNull().default('Medium'),
  status: text('status').notNull().default('not_started'),
  progress: integer('progress').notNull().default(0),
  weight: integer('weight').notNull().default(15),
  maxPoints: integer('max_points').notNull().default(100),
  gradeScore: integer('grade_score'),
  gradeLetter: text('grade_letter'),
  milestoneText: text('milestone_text').notNull().default(''),
  guidelines: text('guidelines').notNull().default(''),
  thumbnailUrl: text('thumbnail_url'),
  submittedFiles: jsonb('submitted_files')
    .$type<SubmittedFileItem[]>()
    .notNull()
    .default([]),
  aiRubricResult: jsonb('ai_rubric_result').$type<AiRubricResult | null>(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const calendarEvents = pgTable('calendar_events', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  course: text('course').notNull(),
  date: text('date').notNull(),
  timeRange: text('time_range').notNull(),
  location: text('location').notNull().default(''),
  eventType: text('event_type').notNull().default('lecture'),
  badgeText: text('badge_text').notNull().default(''),
  description: text('description').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  course: text('course').notNull(),
  fileType: text('file_type').notNull().default('pdf'),
  sizeBytes: integer('size_bytes').notNull().default(1024000),
  sizeLabel: text('size_label').notNull().default('1.0 MB'),
  aiSynced: boolean('ai_synced').notNull().default(true),
  lastReadLabel: text('last_read_label').notNull().default('Just now'),
  summary: text('summary').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  author: text('author').notNull(),
  department: text('department').notNull(),
  category: text('category').notNull(),
  tagLabel: text('tag_label').notNull().default('Course Update'),
  title: text('title').notNull(),
  body: text('body').notNull(),
  dateLabel: text('date_label').notNull(),
  isPinned: boolean('is_pinned').notNull().default(false),
  isBookmarked: boolean('is_bookmarked').notNull().default(false),
  isRsvped: boolean('is_rsvped').notNull().default(false),
  imageUrl: text('image_url'),
  metaText: text('meta_text').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

export const studyBlocks = pgTable('study_blocks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  course: text('course').notNull(),
  priority: text('priority').notNull().default('Medium Priority'),
  timeRange: text('time_range').notNull(),
  durationLabel: text('duration_label').notNull(),
  targetText: text('target_text').notNull(),
  blockType: text('block_type').notNull().default('Deep Flow Block'),
  completed: boolean('completed').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  role: text('role').notNull(),
  content: text('content').notNull(),
  courseScope: text('course_scope').notNull().default('Operating Systems'),
  codeSnippet: text('code_snippet'),
  codeFilename: text('code_filename'),
  timestampLabel: text('timestamp_label').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  assignments: many(assignments),
  calendarEvents: many(calendarEvents),
  documents: many(documents),
  announcements: many(announcements),
  studyBlocks: many(studyBlocks),
  chatMessages: many(chatMessages),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  user: one(users, {
    fields: [assignments.userId],
    references: [users.id],
  }),
}));

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  user: one(users, {
    fields: [calendarEvents.userId],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  user: one(users, {
    fields: [announcements.userId],
    references: [users.id],
  }),
}));

export const studyBlocksRelations = relations(studyBlocks, ({ one }) => ({
  user: one(users, {
    fields: [studyBlocks.userId],
    references: [users.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));
