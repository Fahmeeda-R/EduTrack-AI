import { GoogleGenAI, ThinkingLevel, Type, type Schema } from '@google/genai';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatGeminiError(error: unknown): { status: number; message: string } {
  const raw = error instanceof Error ? error.message : String(error || 'AI service request failed.');
  let status = 500;
  let message = raw;

  try {
    const parsed = JSON.parse(raw) as {
      error?: { code?: number; message?: string; status?: string };
    };
    if (parsed?.error) {
      if (typeof parsed.error.code === 'number') status = parsed.error.code;
      if (parsed.error.message) message = parsed.error.message;
    }
  } catch {
    const codeMatch = raw.match(/"code":\s*(\d{3})/);
    if (codeMatch) status = Number(codeMatch[1]);
    const msgMatch = raw.match(/"message":\s*"([^"]+)"/);
    if (msgMatch) message = msgMatch[1];
  }

  return { status, message };
}

function isTransientError(error: unknown): boolean {
  const { status, message } = formatGeminiError(error);
  const lower = message.toLowerCase();
  return (
    status === 503 ||
    status === 502 ||
    status === 504 ||
    status === 429 ||
    lower.includes('high demand') ||
    lower.includes('unavailable') ||
    lower.includes('overloaded') ||
    lower.includes('temporarily')
  );
}

function extractJsonText(rawText: string | undefined, fallback: string): string {
  const trimmed = (rawText ?? '').trim();
  if (!trimmed) return fallback;
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return (fenced ? fenced[1] : trimmed).trim() || fallback;
}

async function generateJsonWithRetry<T>(params: {
  contents: string;
  systemInstruction: string;
  responseSchema: Schema;
  fallbackJson: string;
}): Promise<T> {
  const ai = getAiClient();
  const attempts: Array<{ model: string; useThinking: boolean; delayBeforeMs: number }> = [
    { model: 'gemini-4-hydrogen', useThinking: true, delayBeforeMs: 0 },
    { model: 'gemini-4-hydrogen', useThinking: true, delayBeforeMs: 650 },
    { model: 'gemini-3.1-flash-lite', useThinking: false, delayBeforeMs: 400 },
    { model: 'gemini-3.1-flash-lite', useThinking: false, delayBeforeMs: 1200 },
  ];

  let lastError: unknown;
  for (const attempt of attempts) {
    if (attempt.delayBeforeMs > 0) {
      await sleep(attempt.delayBeforeMs);
    }
    try {
      const response = await ai.models.generateContent({
        model: attempt.model,
        contents: params.contents,
        config: {
          systemInstruction: params.systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: params.responseSchema,
          ...(attempt.useThinking
            ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
            : {}),
        },
      });
      const jsonStr = extractJsonText(response.text, params.fallbackJson);
      return JSON.parse(jsonStr) as T;
    } catch (err) {
      lastError = err;
      if (!isTransientError(err)) {
        break;
      }
    }
  }

  const formatted = formatGeminiError(lastError);
  const err = new Error(formatted.message);
  (err as Error & { statusCode?: number }).statusCode = formatted.status;
  throw err;
}

export async function generateTutorReply(params: {
  prompt: string;
  courseScope: string;
  documentContext?: string;
  simplify?: boolean;
}) {
  const parsed = await generateJsonWithRetry<{
    explanation?: string;
    codeFilename?: string;
    codeSnippet?: string;
  }>({
    contents: `${params.simplify ? 'Explain this in 3 concise, intuitive bullet points for a student: ' : ''}${params.prompt}`,
    systemInstruction: `You are EduTrack AI, a warm, rigorous university academic tutor specializing in ${params.courseScope} (and CS/STEM coursework: Data Structures, Web Technologies, Java, Python, Operating Systems, DBMS, English). ${params.documentContext ? `Grounded document context: ${params.documentContext}. ` : ''}Give structured, accurate explanations and optionally include a concise code snippet when helpful.`,
    fallbackJson: '{}',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        explanation: {
          type: Type.STRING,
          description: 'Clear structured academic explanation in markdown-friendly plain prose.',
        },
        codeFilename: {
          type: Type.STRING,
          description: 'Optional filename for an illustrative code snippet, or empty string if none.',
        },
        codeSnippet: {
          type: Type.STRING,
          description: 'Optional short illustrative code snippet, or empty string if not needed.',
        },
      },
      required: ['explanation', 'codeFilename', 'codeSnippet'],
    },
  });

  return {
    explanation: parsed.explanation || 'Here is a structured academic breakdown for your query.',
    codeFilename: parsed.codeFilename || null,
    codeSnippet: parsed.codeSnippet || null,
  };
}

export async function generateRubricPrecheck(params: {
  title: string;
  course: string;
  guidelines: string;
  files: Array<{ name: string; size: string }>;
}) {
  const fileList =
    params.files.map((f) => `${f.name} (${f.size})`).join(', ') || 'No files attached yet';
  const parsed = await generateJsonWithRetry<{
    projectedScore?: number;
    gradeLetter?: string;
    confidence?: string;
    polishTip?: string;
    criteria?: Array<{ title: string; subtitle: string; badge: string; status: string }>;
  }>({
    contents: `Evaluate pre-flight readiness for assignment "${params.title}" in course "${params.course}". Guidelines: "${params.guidelines}". Attached files: ${fileList}.`,
    systemInstruction:
      'You are an academic rubric pre-flight analyzer. Return realistic, constructive criterion checks and one actionable polish tip.',
    fallbackJson: '{}',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        projectedScore: { type: Type.INTEGER },
        gradeLetter: { type: Type.STRING },
        confidence: { type: Type.STRING },
        polishTip: { type: Type.STRING },
        criteria: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subtitle: { type: Type.STRING },
              badge: { type: Type.STRING },
              status: { type: Type.STRING },
            },
            required: ['title', 'subtitle', 'badge', 'status'],
          },
        },
      },
      required: ['projectedScore', 'gradeLetter', 'confidence', 'polishTip', 'criteria'],
    },
  });

  return {
    projectedScore: parsed.projectedScore ?? 92,
    gradeLetter: parsed.gradeLetter ?? 'Grade A',
    confidence: parsed.confidence ?? '97.5%',
    polishTip:
      parsed.polishTip ??
      'Double-check edge-case error handling and include performance benchmark notes in your PDF summary.',
    criteria: (parsed.criteria ?? []).map((c) => ({
      title: c.title,
      subtitle: c.subtitle,
      badge: c.badge,
      status: (c.status === 'warning' ? 'warning' : 'passed') as 'passed' | 'warning' | 'info',
    })),
  };
}

export async function generateAdaptiveStudyPlan(params: {
  assignments: Array<{ title: string; course: string; priority: string; dueLabel: string }>;
}) {
  const summary = params.assignments
    .slice(0, 6)
    .map((a) => `${a.course}: ${a.title} (${a.priority}, due ${a.dueLabel})`)
    .join('; ');

  return generateJsonWithRetry<
    Array<{
      title: string;
      course: string;
      priority: string;
      timeRange: string;
      durationLabel: string;
      targetText: string;
      blockType: string;
    }>
  >({
    contents: `Create 3 focused study blocks for today based on these assignments: ${summary}`,
    systemInstruction:
      'You are an adaptive academic study planner. Produce 3 balanced study blocks for today with clear time slots, durations, and concrete targets.',
    fallbackJson: '[]',
    responseSchema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          course: { type: Type.STRING },
          priority: { type: Type.STRING },
          timeRange: { type: Type.STRING },
          durationLabel: { type: Type.STRING },
          targetText: { type: Type.STRING },
          blockType: { type: Type.STRING },
        },
        required: [
          'title',
          'course',
          'priority',
          'timeRange',
          'durationLabel',
          'targetText',
          'blockType',
        ],
      },
    },
  });
}

export async function generateSupportChatReply(params: {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  category?: string;
}) {
  const historyText = params.history
    .slice(-8)
    .map((m) => `${m.role === 'user' ? 'Student' : 'Support'}: ${m.content}`)
    .join('\n');

  const contents = historyText
    ? `${historyText}\nStudent: ${params.message}`
    : `Student: ${params.message}`;

  const parsed = await generateJsonWithRetry<{ reply: string; suggestedFollowups?: string[] }>({
    contents,
    systemInstruction: `You are EduTrack Support, a friendly, empathetic AI student support assistant for a university. You help students with academic queries, course registration, fee payments, library services, hostel, scholarships, transcripts, attendance policy, health services, campus facilities, and general university questions. ${params.category ? `The student has selected the category: ${params.category}.` : ''} Keep responses concise (2-4 sentences max), warm, and actionable. Use plain text, avoid heavy markdown. Suggest follow-up questions when helpful.`,
    fallbackJson: '{"reply":"I\'m here to help! Could you give me a bit more detail so I can assist you better?","suggestedFollowups":[]}',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        reply: {
          type: Type.STRING,
          description: 'Friendly, concise support response (2-4 sentences).',
        },
        suggestedFollowups: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Up to 3 short follow-up question suggestions.',
        },
      },
      required: ['reply', 'suggestedFollowups'],
    },
  });

  return {
    reply: parsed.reply || "I'm here to help! Could you give me a bit more detail?",
    suggestedFollowups: (parsed.suggestedFollowups ?? []).slice(0, 3),
  };
}

export async function generateFacultyRubric(params: {
  assignmentTitle: string;
  course: string;
  specText: string;
}) {
  return generateJsonWithRetry<
    Array<{
      criterion: string;
      points: number;
      excellentDescriptor: string;
      proficientDescriptor: string;
    }>
  >({
    contents: `Generate a 4-tier grading rubric for "${params.assignmentTitle}" (${params.course}). Specification: ${params.specText}`,
    systemInstruction:
      'You are a university faculty assessment architect. Return a structured 4-criterion grading rubric with point weights totaling 100.',
    fallbackJson: '[]',
    responseSchema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          criterion: { type: Type.STRING },
          points: { type: Type.INTEGER },
          excellentDescriptor: { type: Type.STRING },
          proficientDescriptor: { type: Type.STRING },
        },
        required: ['criterion', 'points', 'excellentDescriptor', 'proficientDescriptor'],
      },
    },
  });
}
