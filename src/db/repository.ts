import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  announcements,
  assignments,
  calendarEvents,
  chatMessages,
  documents,
  studyBlocks,
  users,
  type AiRubricResult,
  type SubmittedFileItem,
} from './schema.ts';
import {
  DEFAULT_ANNOUNCEMENTS_SEED,
  DEFAULT_ASSIGNMENTS_SEED,
  DEFAULT_CALENDAR_EVENTS_SEED,
  DEFAULT_CHAT_MESSAGES_SEED,
  DEFAULT_DOCUMENTS_SEED,
  DEFAULT_STUDY_BLOCKS_SEED,
  STUDENT_AVATAR_URL,
} from './seed.ts';

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string,
  avatarUrl?: string
) {
  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.uid, uid))
      .limit(1);

    const resolvedName =
      displayName || existing[0]?.displayName || email.split('@')[0] || 'Elena Rostova';

    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: resolvedName,
        avatarUrl: avatarUrl || STUDENT_AVATAR_URL,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(displayName ? { displayName } : {}),
          ...(avatarUrl ? { avatarUrl } : {}),
        },
      })
      .returning();

    const user = result[0];

    // Seed initial academic workspace once for brand new users
    const existingAssignments = await db
      .select({ id: assignments.id })
      .from(assignments)
      .where(eq(assignments.userId, user.id))
      .limit(1);

    if (existingAssignments.length === 0) {
      await db.insert(assignments).values(
        DEFAULT_ASSIGNMENTS_SEED.map((item) => ({
          ...item,
          userId: user.id,
        }))
      );
      await db.insert(calendarEvents).values(
        DEFAULT_CALENDAR_EVENTS_SEED.map((item) => ({
          ...item,
          userId: user.id,
        }))
      );
      await db.insert(documents).values(
        DEFAULT_DOCUMENTS_SEED.map((item) => ({
          ...item,
          userId: user.id,
        }))
      );
      await db.insert(announcements).values(
        DEFAULT_ANNOUNCEMENTS_SEED.map((item) => ({
          ...item,
          userId: user.id,
        }))
      );
      await db.insert(studyBlocks).values(
        DEFAULT_STUDY_BLOCKS_SEED.map((item) => ({
          ...item,
          userId: user.id,
        }))
      );
      await db.insert(chatMessages).values(
        DEFAULT_CHAT_MESSAGES_SEED.map((item) => ({
          ...item,
          userId: user.id,
        }))
      );
    }

    return user;
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Failed to synchronize user profile.', { cause: error });
  }
}

export async function updateUserProfile(
  userId: number,
  patch: Partial<{
    displayName: string;
    role: string;
    department: string;
    standing: string;
    darkMode: boolean;
  }>
) {
  try {
    const result = await db
      .update(users)
      .set(patch)
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed in updateUserProfile:', error);
    throw new Error('Failed to update user preferences.', { cause: error });
  }
}

export async function getWorkspaceData(userId: number) {
  try {
    const [
      assignmentRows,
      calendarRows,
      documentRows,
      announcementRows,
      studyBlockRows,
      chatRows,
    ] = await Promise.all([
      db
        .select()
        .from(assignments)
        .where(eq(assignments.userId, userId))
        .orderBy(asc(assignments.dueDate), asc(assignments.id)),
      db
        .select()
        .from(calendarEvents)
        .where(eq(calendarEvents.userId, userId))
        .orderBy(asc(calendarEvents.date), asc(calendarEvents.id)),
      db
        .select()
        .from(documents)
        .where(eq(documents.userId, userId))
        .orderBy(desc(documents.id)),
      db
        .select()
        .from(announcements)
        .where(eq(announcements.userId, userId))
        .orderBy(desc(announcements.isPinned), desc(announcements.id)),
      db
        .select()
        .from(studyBlocks)
        .where(eq(studyBlocks.userId, userId))
        .orderBy(asc(studyBlocks.id)),
      db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.userId, userId))
        .orderBy(asc(chatMessages.id)),
    ]);

    return {
      assignments: assignmentRows,
      calendarEvents: calendarRows,
      documents: documentRows,
      announcements: announcementRows,
      studyBlocks: studyBlockRows,
      chatMessages: chatRows,
    };
  } catch (error) {
    console.error('Database query failed in getWorkspaceData:', error);
    throw new Error('Failed to load workspace data.', { cause: error });
  }
}

export async function createAssignment(
  userId: number,
  input: {
    title: string;
    subtitle?: string;
    course: string;
    instructor?: string;
    dueDate: string;
    dueLabel: string;
    priority: string;
    weight: number;
    status?: string;
    guidelines?: string;
    milestoneText?: string;
  }
) {
  try {
    const result = await db
      .insert(assignments)
      .values({
        userId,
        title: input.title,
        subtitle: input.subtitle || `${input.course} coursework deliverable`,
        course: input.course,
        instructor: input.instructor || 'Prof. Marcus Vance',
        dueDate: input.dueDate,
        dueLabel: input.dueLabel,
        priority: input.priority,
        status: input.status || 'not_started',
        progress: 0,
        weight: input.weight || 15,
        maxPoints: 100,
        milestoneText: input.milestoneText || 'Initial Milestone',
        guidelines: input.guidelines || 'Follow course syllabus specifications and include unit tests.',
        submittedFiles: [],
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed in createAssignment:', error);
    throw new Error('Failed to create assignment.', { cause: error });
  }
}

export async function updateAssignment(
  userId: number,
  assignmentId: number,
  patch: Partial<{
    status: string;
    progress: number;
    gradeScore: number | null;
    gradeLetter: string | null;
    submittedFiles: SubmittedFileItem[];
    aiRubricResult: AiRubricResult | null;
    priority: string;
    dueLabel: string;
  }>
) {
  try {
    const result = await db
      .update(assignments)
      .set(patch)
      .where(and(eq(assignments.id, assignmentId), eq(assignments.userId, userId)))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed in updateAssignment:', error);
    throw new Error('Failed to update assignment.', { cause: error });
  }
}

export async function deleteAssignment(userId: number, assignmentId: number) {
  try {
    await db
      .delete(assignments)
      .where(and(eq(assignments.id, assignmentId), eq(assignments.userId, userId)));
  } catch (error) {
    console.error('Database query failed in deleteAssignment:', error);
    throw new Error('Failed to delete assignment.', { cause: error });
  }
}

export async function createCalendarEvent(
  userId: number,
  input: {
    title: string;
    course: string;
    date: string;
    timeRange: string;
    location: string;
    eventType: string;
    badgeText?: string;
    description?: string;
  }
) {
  try {
    const result = await db
      .insert(calendarEvents)
      .values({
        userId,
        title: input.title,
        course: input.course,
        date: input.date,
        timeRange: input.timeRange,
        location: input.location,
        eventType: input.eventType,
        badgeText: input.badgeText || '',
        description: input.description || '',
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed in createCalendarEvent:', error);
    throw new Error('Failed to create calendar event.', { cause: error });
  }
}

export async function createDocumentRecord(
  userId: number,
  input: {
    name: string;
    course: string;
    fileType: string;
    sizeBytes: number;
    sizeLabel: string;
    summary?: string;
  }
) {
  try {
    const result = await db
      .insert(documents)
      .values({
        userId,
        name: input.name,
        course: input.course,
        fileType: input.fileType,
        sizeBytes: input.sizeBytes,
        sizeLabel: input.sizeLabel,
        aiSynced: true,
        lastReadLabel: 'Just now',
        summary: input.summary || `Indexed ${input.course} resource`,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed in createDocumentRecord:', error);
    throw new Error('Failed to save document.', { cause: error });
  }
}

export async function deleteDocumentRecord(userId: number, documentId: number) {
  try {
    await db
      .delete(documents)
      .where(and(eq(documents.id, documentId), eq(documents.userId, userId)));
  } catch (error) {
    console.error('Database query failed in deleteDocumentRecord:', error);
    throw new Error('Failed to delete document.', { cause: error });
  }
}

export async function createAnnouncement(
  userId: number,
  input: {
    author: string;
    department: string;
    category: string;
    tagLabel: string;
    title: string;
    body: string;
    isPinned?: boolean;
    metaText?: string;
  }
) {
  try {
    const result = await db
      .insert(announcements)
      .values({
        userId,
        author: input.author,
        department: input.department,
        category: input.category,
        tagLabel: input.tagLabel,
        title: input.title,
        body: input.body,
        dateLabel: 'Just now · ' + input.department,
        isPinned: Boolean(input.isPinned),
        isBookmarked: false,
        isRsvped: false,
        metaText: input.metaText || '',
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed in createAnnouncement:', error);
    throw new Error('Failed to publish announcement.', { cause: error });
  }
}

export async function updateAnnouncement(
  userId: number,
  announcementId: number,
  patch: Partial<{ isBookmarked: boolean; isRsvped: boolean }>
) {
  try {
    const result = await db
      .update(announcements)
      .set(patch)
      .where(and(eq(announcements.id, announcementId), eq(announcements.userId, userId)))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed in updateAnnouncement:', error);
    throw new Error('Failed to update announcement.', { cause: error });
  }
}

export async function createStudyBlock(
  userId: number,
  input: {
    title: string;
    course: string;
    priority: string;
    timeRange: string;
    durationLabel: string;
    targetText: string;
    blockType: string;
  }
) {
  try {
    const result = await db
      .insert(studyBlocks)
      .values({
        userId,
        ...input,
        completed: false,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed in createStudyBlock:', error);
    throw new Error('Failed to create study block.', { cause: error });
  }
}

export async function replaceStudyBlocks(
  userId: number,
  blocks: Array<{
    title: string;
    course: string;
    priority: string;
    timeRange: string;
    durationLabel: string;
    targetText: string;
    blockType: string;
  }>
) {
  try {
    await db.delete(studyBlocks).where(eq(studyBlocks.userId, userId));
    const inserted = await db
      .insert(studyBlocks)
      .values(
        blocks.map((block) => ({
          userId,
          ...block,
          completed: false,
        }))
      )
      .returning();
    return inserted;
  } catch (error) {
    console.error('Database query failed in replaceStudyBlocks:', error);
    throw new Error('Failed to save generated study plan.', { cause: error });
  }
}

export async function toggleStudyBlock(
  userId: number,
  blockId: number,
  completed: boolean
) {
  try {
    const result = await db
      .update(studyBlocks)
      .set({ completed })
      .where(and(eq(studyBlocks.id, blockId), eq(studyBlocks.userId, userId)))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed in toggleStudyBlock:', error);
    throw new Error('Failed to update study block.', { cause: error });
  }
}

export async function appendChatMessage(
  userId: number,
  input: {
    role: string;
    content: string;
    courseScope: string;
    codeSnippet?: string | null;
    codeFilename?: string | null;
    timestampLabel: string;
  }
) {
  try {
    const result = await db
      .insert(chatMessages)
      .values({
        userId,
        role: input.role,
        content: input.content,
        courseScope: input.courseScope,
        codeSnippet: input.codeSnippet ?? null,
        codeFilename: input.codeFilename ?? null,
        timestampLabel: input.timestampLabel,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed in appendChatMessage:', error);
    throw new Error('Failed to save chat message.', { cause: error });
  }
}

export async function clearChatMessages(userId: number) {
  try {
    await db.delete(chatMessages).where(eq(chatMessages.userId, userId));
  } catch (error) {
    console.error('Database query failed in clearChatMessages:', error);
    throw new Error('Failed to clear chat history.', { cause: error });
  }
}
