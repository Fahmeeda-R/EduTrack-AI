import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { globalVectorStore, type SimilarityResult } from './vectorStore.ts';
import { executeLiveWebSearch, requiresLiveWebSearch, type SearchResult } from './webSearch.ts';

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface RagSourceItem {
  id: string;
  title: string;
  type: 'document' | 'web';
  snippet: string;
  url?: string;
  score?: number;
}

export interface RagChatResponse {
  reply: string;
  sources: RagSourceItem[];
  isRagGrounded: boolean;
  isWebSearched: boolean;
  suggestedFollowups: string[];
  confidence: 'high' | 'medium' | 'unverified';
}

function isGeminiActive(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key.trim() !== '' && key !== 'MY_GEMINI_API_KEY');
}

/**
 * Intelligent local synthesizer used when GEMINI_API_KEY is not configured or offline.
 * Synthesizes retrieved RAG document chunks and live web search results into
 * a clean, well-formatted, grounded response without hallucination.
 */
function synthesizeLocalGroundedResponse(params: {
  query: string;
  retrievedChunks: SimilarityResult[];
  searchResults: SearchResult[];
  category?: string;
}): RagChatResponse {
  const { query, retrievedChunks, searchResults, category } = params;
  const sources: RagSourceItem[] = [];

  for (const match of retrievedChunks) {
    sources.push({
      id: match.chunk.id,
      title: match.chunk.documentName,
      type: 'document',
      snippet: match.chunk.text.slice(0, 220) + '...',
      score: Math.round(match.score * 100) / 100,
    });
  }

  for (const web of searchResults) {
    sources.push({
      id: `web-${sources.length + 1}`,
      title: web.title,
      type: 'web',
      snippet: web.snippet.slice(0, 220) + '...',
      url: web.url,
    });
  }

  // 1. If we have high-confidence grounded document chunks
  if (retrievedChunks.length > 0 && retrievedChunks[0].score >= 0.28) {
    const topChunk = retrievedChunks[0].chunk;
    const additionalChunks = retrievedChunks.slice(1, 3).map((c) => c.chunk);

    // Format synthesized answer based on retrieved documents
    const paragraphs = [topChunk.text, ...additionalChunks.map((c) => c.text)]
      .join('\n\n')
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .slice(0, 8);

    const formattedBody = paragraphs
      .map((p) => (p.match(/^\d+\.|\*|•|-/) ? p : `• ${p}`))
      .join('\n');

    return {
      reply: `Based on **${topChunk.documentName}**:\n\n${formattedBody}\n\n*Reference: ${topChunk.documentName} (Section: ${topChunk.chunkIndex + 1}/${topChunk.totalChunks})*`,
      sources,
      isRagGrounded: true,
      isWebSearched: searchResults.length > 0,
      suggestedFollowups: [
        'Can you summarize the main rules or deadlines?',
        'Who should I contact if I have further questions?',
        'Where can I download the relevant form or application?',
      ],
      confidence: 'high',
    };
  }

  // 2. If we have web search results
  if (searchResults.length > 0) {
    const webSnippets = searchResults
      .slice(0, 3)
      .map((w) => `• **${w.title}**: ${w.snippet} ([Source](${w.url}))`)
      .join('\n\n');

    return {
      reply: `Here is the current information retrieved from live sources:\n\n${webSnippets}\n\n*Note: Information retrieved from external verified sources. Please refer to linked citations for real-time updates.*`,
      sources,
      isRagGrounded: false,
      isWebSearched: true,
      suggestedFollowups: [
        'Would you like more technical details on this topic?',
        'Can you explain this in simpler terms?',
        'Are there official documentation links for this?',
      ],
      confidence: 'medium',
    };
  }

  // 3. Graceful Unknown Handling
  const catNote = category ? ` regarding **${category}**` : '';
  return {
    reply: `I could not find a confirmed policy or record in the university knowledge base or live search for: "${query}"${catNote}.\n\nTo ensure you receive accurate and authorized information without guesswork, please:\n1. Consult the **Student Services Helpdesk** in Block A, Room 101 (Mon–Fri, 9:00 AM – 5:00 PM).\n2. Email the registrar or helpdesk at **support@university.edu**.\n3. Check your department noticeboard or the official **Student Portal (portal.university.edu)**.`,
    sources: [],
    isRagGrounded: false,
    isWebSearched: false,
    suggestedFollowups: [
      'How do I contact my academic advisor?',
      'Where is the Student Services Centre located?',
      'How do I submit an official enquiry ticket?',
    ],
    confidence: 'unverified',
  };
}

/**
 * Main RAG Generation Engine:
 * Coordinates query preprocessing, semantic vector search, live web search,
 * and LLM response generation with strict anti-hallucination and citation rules.
 */
export async function generateRagResponse(params: {
  message: string;
  history?: ChatHistoryItem[];
  enableWebSearch?: boolean;
  category?: string;
  documentFilterId?: string;
}): Promise<RagChatResponse> {
  const query = params.message.trim();
  const history = params.history || [];
  const enableWeb = params.enableWebSearch !== false;

  // Initialize vector database
  await globalVectorStore.initialize();

  // 1. Semantic Retrieval from Vector Store
  const retrievedChunks = await globalVectorStore.querySimilar(query, 4, 0.22);

  // 2. Live Web Search Execution
  let searchResults: SearchResult[] = [];
  const needsLiveSearch =
    enableWeb && (requiresLiveWebSearch(query) || (retrievedChunks.length === 0 && query.length > 5));

  if (needsLiveSearch) {
    try {
      searchResults = await executeLiveWebSearch(query, 3);
    } catch (searchErr) {
      console.warn('Live web search error:', searchErr);
    }
  }

  // 3. Compile Grounded Sources
  const sources: RagSourceItem[] = [];

  for (const match of retrievedChunks) {
    sources.push({
      id: match.chunk.id,
      title: match.chunk.documentName,
      type: 'document',
      snippet: match.chunk.text.slice(0, 240) + '...',
      score: Math.round(match.score * 100) / 100,
    });
  }

  for (const web of searchResults) {
    sources.push({
      id: `web-${sources.length + 1}`,
      title: web.title,
      type: 'web',
      snippet: web.snippet.slice(0, 240) + '...',
      url: web.url,
    });
  }

  // 4. LLM Generation via Gemini if configured
  if (isGeminiActive()) {
    try {
      const apiKey = process.env.GEMINI_API_KEY!;
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const contextParts: string[] = [];

      if (retrievedChunks.length > 0) {
        contextParts.push(
          '=== RETRIEVED KNOWLEDGE BASE DOCUMENTS ===\n' +
            retrievedChunks
              .map(
                (c, idx) =>
                  `[DOC ${idx + 1}: ${c.chunk.documentName} | Similarity: ${(c.score * 100).toFixed(0)}%]\n${c.chunk.text}`
              )
              .join('\n\n')
        );
      }

      if (searchResults.length > 0) {
        contextParts.push(
          '=== LIVE WEB SEARCH RESULTS ===\n' +
            searchResults
              .map(
                (s, idx) =>
                  `[WEB ${idx + 1}: ${s.title} | URL: ${s.url}]\n${s.snippet}`
              )
              .join('\n\n')
        );
      }

      const recentHistory = history
        .slice(-6)
        .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
        .join('\n');

      const fullPrompt = `${contextParts.join('\n\n')}\n\n=== CONVERSATION HISTORY ===\n${recentHistory}\n\nUser: ${query}\nAssistant:`;

      const systemInstruction = `You are EduTrack AI, an intelligent, empathetic academic and student support chatbot.
STRICT INSTRUCTIONS:
1. Always understand and answer in natural language. Handle spelling mistakes, differently phrased questions, and incomplete queries intuitively.
2. Ground your answers using the RETRIEVED KNOWLEDGE BASE DOCUMENTS and LIVE WEB SEARCH RESULTS provided above.
3. Cite your sources clearly: mention the document name (e.g. "[Academic Regulations Handbook]") or web source URL when citing facts.
4. If the user asks multiple questions in one message, address each question systematically with clear headings or numbered bullet points.
5. If the information is not present in the provided context and cannot be answered with high confidence, state the limitation honestly and suggest how the user can verify or find the answer (e.g. contact specific campus office, advisor, or official portal). Never invent false policies, numbers, or rules.
6. Provide up to 3 relevant, concise follow-up questions the user might want to ask next.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description: 'Clear, well-structured answer with markdown headings and bullet points.',
              },
              suggestedFollowups: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Up to 3 short follow-up questions.',
              },
            },
            required: ['reply', 'suggestedFollowups'],
          },
        },
      });

      const responseText = response.text?.trim() || '';
      if (responseText) {
        const cleanedJson = responseText.replace(/^```(?:json)?\s*|\s*```$/gi, '').trim();
        const parsed = JSON.parse(cleanedJson) as { reply: string; suggestedFollowups?: string[] };

        if (parsed.reply) {
          return {
            reply: parsed.reply,
            sources,
            isRagGrounded: retrievedChunks.length > 0,
            isWebSearched: searchResults.length > 0,
            suggestedFollowups: (parsed.suggestedFollowups ?? []).slice(0, 3),
            confidence: retrievedChunks.length > 0 || searchResults.length > 0 ? 'high' : 'medium',
          };
        }
      }
    } catch (llmErr) {
      console.warn('Gemini RAG call failed, falling back to local grounded reasoning:', llmErr);
    }
  }

  // 5. High-performance local grounded synthesizer fallback
  return synthesizeLocalGroundedResponse({
    query,
    retrievedChunks,
    searchResults,
    category: params.category,
  });
}
