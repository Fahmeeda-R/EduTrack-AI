import 'dotenv/config';
import express from 'express';
import { requireAuth, resolveAuthUser, type AuthRequest } from './middleware/auth.ts';
import { testDbConnection } from './db/index.ts';
import { isSupabaseConfigured } from './lib/supabase.ts';
import {
  appendChatMessage,
  clearChatMessages,
  createAnnouncement,
  createAssignment,
  createCalendarEvent,
  createDocumentRecord,
  createStudyBlock,
  deleteAssignment,
  deleteDocumentRecord,
  getOrCreateUser,
  getWorkspaceData,
  replaceStudyBlocks,
  toggleStudyBlock,
  updateAnnouncement,
  updateAssignment,
  updateUserProfile,
} from './db/repository.ts';
import {
  generateAdaptiveStudyPlan,
  generateFacultyRubric,
  generateRubricPrecheck,
  generateSupportChatReply,
  generateTutorReply,
} from './lib/gemini.ts';

export const app = express();

app.use(express.json({ limit: '5mb' }));

// CORS & Preflight Handling
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({ name: 'EduTrack AI API', status: 'ok' });
});

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Supabase & PostgreSQL Connection Diagnostic
router.get('/supabase/status', async (_req, res) => {
  try {
    const dbStatus = await testDbConnection();
    const supabaseConfigured = isSupabaseConfigured();

    res.json({
      supabaseClientConfigured: supabaseConfigured,
      supabaseUrl: process.env.SUPABASE_URL ? 'set' : 'missing',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ? 'set' : 'missing',
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'missing',
      databaseUrl: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL ? 'set' : 'missing',
      database: dbStatus,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to query Supabase status';
    res.status(500).json({ error: message });
  }
});

// Authenticated Workspace Bootstrap & Profile Sync
router.get('/workspace', requireAuth, async (req: AuthRequest, res) => {
  try {
    const firebaseUser = req.user!;
    const dbUser = await getOrCreateUser(
      firebaseUser.uid,
      firebaseUser.email || 'student@university.edu',
      firebaseUser.name,
      firebaseUser.picture
    );
    const workspace = await getWorkspaceData(dbUser.id);
    res.json({ user: dbUser, ...workspace });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load workspace';
    res.status(500).json({ error: message });
  }
});

router.patch('/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const firebaseUser = req.user!;
    const dbUser = await getOrCreateUser(
      firebaseUser.uid,
      firebaseUser.email || 'student@university.edu'
    );
    const updated = await updateUserProfile(dbUser.id, {
      displayName: req.body.displayName,
      role: req.body.role,
      department: req.body.department,
      standing: req.body.standing,
      darkMode: req.body.darkMode,
    });
    res.json({ user: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    res.status(500).json({ error: message });
  }
});

// Assignments CRUD
router.post('/assignments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const firebaseUser = req.user!;
    const dbUser = await getOrCreateUser(
      firebaseUser.uid,
      firebaseUser.email || 'student@university.edu'
    );
    const created = await createAssignment(dbUser.id, req.body);
    res.status(201).json(created);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create assignment';
    res.status(500).json({ error: message });
  }
});

router.patch('/assignments/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const firebaseUser = req.user!;
    const dbUser = await getOrCreateUser(
      firebaseUser.uid,
      firebaseUser.email || 'student@university.edu'
    );
    const updated = await updateAssignment(dbUser.id, Number(req.params.id), req.body);
    res.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update assignment';
    res.status(500).json({ error: message });
  }
});

router.delete('/assignments/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const firebaseUser = req.user!;
    const dbUser = await getOrCreateUser(
      firebaseUser.uid,
      firebaseUser.email || 'student@university.edu'
    );
    await deleteAssignment(dbUser.id, Number(req.params.id));
    res.json({ deleted: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete assignment';
    res.status(500).json({ error: message });
  }
});

// Calendar Events
router.post('/calendar-events', requireAuth, async (req: AuthRequest, res) => {
  try {
    const firebaseUser = req.user!;
    const dbUser = await getOrCreateUser(
      firebaseUser.uid,
      firebaseUser.email || 'student@university.edu'
    );
    const created = await createCalendarEvent(dbUser.id, req.body);
    res.status(201).json(created);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create calendar event';
    res.status(500).json({ error: message });
  }
});

// Documents
router.post('/documents', requireAuth, async (req: AuthRequest, res) => {
  try {
    const firebaseUser = req.user!;
    const dbUser = await getOrCreateUser(
      firebaseUser.uid,
      firebaseUser.email || 'student@university.edu'
    );
    const created = await createDocumentRecord(dbUser.id, req.body);
    res.status(201).json(created);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create document';
    res.status(500).json({ error: message });
  }
});

router.delete('/documents/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const firebaseUser = req.user!;
    const dbUser = await getOrCreateUser(
      firebaseUser.uid,
      firebaseUser.email || 'student@university.edu'
    );
    await deleteDocumentRecord(dbUser.id, Number(req.params.id));
    res.json({ deleted: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete document';
    res.status(500).json({ error: message });
  }
});

// Announcements
router.post('/announcements', requireAuth, async (req: AuthRequest, res) => {
  try {
    const firebaseUser = req.user!;
    const dbUser = await getOrCreateUser(
      firebaseUser.uid,
      firebaseUser.email || 'student@university.edu'
    );
    const created = await createAnnouncement(dbUser.id, req.body);
    res.status(201).json(created);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create announcement';
    res.status(500).json({ error: message });
  }
});

router.patch('/announcements/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const firebaseUser = req.user!;
    const dbUser = await getOrCreateUser(
      firebaseUser.uid,
      firebaseUser.email || 'student@university.edu'
    );
    const updated = await updateAnnouncement(dbUser.id, Number(req.params.id), req.body);
    res.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update announcement';
    res.status(500).json({ error: message });
  }
});

// Study Blocks
router.post('/study-blocks', requireAuth, async (req: AuthRequest, res) => {
  try {
    const firebaseUser = req.user!;
    const dbUser = await getOrCreateUser(
      firebaseUser.uid,
      firebaseUser.email || 'student@university.edu'
    );
    const created = await createStudyBlock(dbUser.id, req.body);
    res.status(201).json(created);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create study block';
    res.status(500).json({ error: message });
  }
});

router.patch('/study-blocks/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const firebaseUser = req.user!;
    const dbUser = await getOrCreateUser(
      firebaseUser.uid,
      firebaseUser.email || 'student@university.edu'
    );
    const updated = await toggleStudyBlock(
      dbUser.id,
      Number(req.params.id),
      Boolean(req.body.completed)
    );
    res.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update study block';
    res.status(500).json({ error: message });
  }
});

// Chat Messages
router.delete('/chat-messages', requireAuth, async (req: AuthRequest, res) => {
  try {
    const firebaseUser = req.user!;
    const dbUser = await getOrCreateUser(
      firebaseUser.uid,
      firebaseUser.email || 'student@university.edu'
    );
    await clearChatMessages(dbUser.id);
    res.json({ cleared: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to clear chat';
    res.status(500).json({ error: message });
  }
});

// Gemini AI Endpoints
router.post('/ai/chat', async (req, res) => {
  try {
    const { prompt, courseScope, documentContext, simplify } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const reply = await generateTutorReply({
      prompt,
      courseScope: courseScope || 'Operating Systems',
      documentContext,
      simplify: Boolean(simplify),
    });

    const nowLabel = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const authUser = await resolveAuthUser(authHeader);
        if (authUser) {
          const dbUser = await getOrCreateUser(
            authUser.uid,
            authUser.email || 'student@university.edu',
            authUser.name,
            authUser.picture
          );
          if (!simplify) {
            await appendChatMessage(dbUser.id, {
              role: 'user',
              content: prompt,
              courseScope: courseScope || 'Operating Systems',
              timestampLabel: nowLabel,
            });
          }
          await appendChatMessage(dbUser.id, {
            role: 'assistant',
            content: reply.explanation,
            courseScope: courseScope || 'Operating Systems',
            codeSnippet: reply.codeSnippet,
            codeFilename: reply.codeFilename,
            timestampLabel: nowLabel,
          });
        }
      } catch (persistErr) {
        console.error('Non-fatal chat persistence error:', persistErr);
      }
    }

    res.json({ ...reply, timestampLabel: nowLabel });
  } catch (error: unknown) {
    console.error('Gemini chat error:', error);
    const statusCode =
      error instanceof Error && 'statusCode' in error && typeof (error as { statusCode?: number }).statusCode === 'number'
        ? (error as { statusCode: number }).statusCode
        : 500;
    const message = error instanceof Error ? error.message : 'AI Tutor service failed.';
    res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({ error: message });
  }
});

router.post('/ai/rubric-precheck', async (req, res) => {
  try {
    const { title, course, guidelines, files, assignmentId } = req.body;
    const result = await generateRubricPrecheck({
      title: title || 'Coursework Assignment',
      course: course || 'Operating Systems',
      guidelines: guidelines || '',
      files: Array.isArray(files) ? files : [],
    });

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ') && assignmentId) {
      try {
        const authUser = await resolveAuthUser(authHeader);
        if (authUser) {
          const dbUser = await getOrCreateUser(
            authUser.uid,
            authUser.email || 'student@university.edu',
            authUser.name,
            authUser.picture
          );
          await updateAssignment(dbUser.id, Number(assignmentId), {
            aiRubricResult: result,
          });
        }
      } catch (persistErr) {
        console.error('Non-fatal rubric persistence error:', persistErr);
      }
    }

    res.json(result);
  } catch (error: unknown) {
    console.error('Gemini rubric error:', error);
    const statusCode =
      error instanceof Error && 'statusCode' in error && typeof (error as { statusCode?: number }).statusCode === 'number'
        ? (error as { statusCode: number }).statusCode
        : 500;
    const message = error instanceof Error ? error.message : 'AI Rubric check failed.';
    res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({ error: message });
  }
});

router.post('/ai/study-plan', async (req, res) => {
  try {
    const { assignments: assignmentItems } = req.body;
    const blocks = await generateAdaptiveStudyPlan({
      assignments: Array.isArray(assignmentItems) ? assignmentItems : [],
    });

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ') && blocks.length > 0) {
      try {
        const authUser = await resolveAuthUser(authHeader);
        if (authUser) {
          const dbUser = await getOrCreateUser(
            authUser.uid,
            authUser.email || 'student@university.edu',
            authUser.name,
            authUser.picture
          );
          const saved = await replaceStudyBlocks(dbUser.id, blocks);
          return res.json({ blocks: saved });
        }
      } catch (persistErr) {
        console.error('Non-fatal study plan persistence error:', persistErr);
      }
    }

    res.json({
      blocks: blocks.map((b, idx) => ({
        id: Date.now() + idx,
        ...b,
        completed: false,
      })),
    });
  } catch (error: unknown) {
    console.error('Gemini study plan error:', error);
    const statusCode =
      error instanceof Error && 'statusCode' in error && typeof (error as { statusCode?: number }).statusCode === 'number'
        ? (error as { statusCode: number }).statusCode
        : 500;
    const message = error instanceof Error ? error.message : 'AI Study Plan generation failed.';
    res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({ error: message });
  }
});

router.post('/ai/support-chat', async (req, res) => {
  try {
    const { message, history, category } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }
    const result = await generateSupportChatReply({
      message,
      history: Array.isArray(history) ? history : [],
      category: typeof category === 'string' ? category : undefined,
    });
    res.json(result);
  } catch (error: unknown) {
    console.error('Support chat error:', error);
    const message = error instanceof Error ? error.message : 'Support chat service failed.';
    res.status(500).json({ error: message });
  }
});

router.post('/ai/generate-rubric', async (req, res) => {  try {
    const { assignmentTitle, course, specText } = req.body;
    const rubric = await generateFacultyRubric({
      assignmentTitle: assignmentTitle || 'Lab Assignment',
      course: course || 'Operating Systems',
      specText: specText || 'Standard grading rubric',
    });
    res.json({ rubric });
  } catch (error: unknown) {
    console.error('Gemini faculty rubric error:', error);
    const statusCode =
      error instanceof Error && 'statusCode' in error && typeof (error as { statusCode?: number }).statusCode === 'number'
        ? (error as { statusCode: number }).statusCode
        : 500;
    const message = error instanceof Error ? error.message : 'Faculty rubric generation failed.';
    res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({ error: message });
  }
});

// Register routes both with /api prefix and at root (for serverless environments)
app.use('/api', router);
app.use(router);
