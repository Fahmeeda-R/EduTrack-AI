import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
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
} from './src/db/repository.ts';
import {
  generateAdaptiveStudyPlan,
  generateFacultyRubric,
  generateRubricPrecheck,
  generateTutorReply,
} from './src/lib/gemini.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Authenticated Workspace Bootstrap & Profile Sync
  app.get('/api/workspace', requireAuth, async (req: AuthRequest, res) => {
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

  app.patch('/api/profile', requireAuth, async (req: AuthRequest, res) => {
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
  app.post('/api/assignments', requireAuth, async (req: AuthRequest, res) => {
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

  app.patch('/api/assignments/:id', requireAuth, async (req: AuthRequest, res) => {
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

  app.delete('/api/assignments/:id', requireAuth, async (req: AuthRequest, res) => {
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
  app.post('/api/calendar-events', requireAuth, async (req: AuthRequest, res) => {
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
  app.post('/api/documents', requireAuth, async (req: AuthRequest, res) => {
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

  app.delete('/api/documents/:id', requireAuth, async (req: AuthRequest, res) => {
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
  app.post('/api/announcements', requireAuth, async (req: AuthRequest, res) => {
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

  app.patch('/api/announcements/:id', requireAuth, async (req: AuthRequest, res) => {
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
  app.post('/api/study-blocks', requireAuth, async (req: AuthRequest, res) => {
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

  app.patch('/api/study-blocks/:id', requireAuth, async (req: AuthRequest, res) => {
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
  app.delete('/api/chat-messages', requireAuth, async (req: AuthRequest, res) => {
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

  // Gemini AI Endpoints (persist to Cloud SQL when Bearer token is present, also work in preview mode)
  app.post('/api/ai/chat', async (req, res) => {
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
          const { adminAuth } = await import('./src/lib/firebase-admin.ts');
          const decoded = await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
          const dbUser = await getOrCreateUser(
            decoded.uid,
            decoded.email || 'student@university.edu'
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

  app.post('/api/ai/rubric-precheck', async (req, res) => {
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
          const { adminAuth } = await import('./src/lib/firebase-admin.ts');
          const decoded = await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
          const dbUser = await getOrCreateUser(
            decoded.uid,
            decoded.email || 'student@university.edu'
          );
          await updateAssignment(dbUser.id, Number(assignmentId), {
            aiRubricResult: result,
          });
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

  app.post('/api/ai/study-plan', async (req, res) => {
    try {
      const { assignments: assignmentItems } = req.body;
      const blocks = await generateAdaptiveStudyPlan({
        assignments: Array.isArray(assignmentItems) ? assignmentItems : [],
      });

      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ') && blocks.length > 0) {
        try {
          const { adminAuth } = await import('./src/lib/firebase-admin.ts');
          const decoded = await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
          const dbUser = await getOrCreateUser(
            decoded.uid,
            decoded.email || 'student@university.edu'
          );
          const saved = await replaceStudyBlocks(dbUser.id, blocks);
          return res.json({ blocks: saved });
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

  app.post('/api/ai/generate-rubric', async (req, res) => {
    try {
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

  // Vite middleware in development, static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduTrack AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
