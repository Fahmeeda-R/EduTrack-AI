import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

export interface TextChunk {
  id: string;
  documentId: string;
  documentName: string;
  text: string;
  chunkIndex: number;
  totalChunks: number;
  charStart: number;
  charEnd: number;
  category?: string;
  embedding: number[];
}

export interface StoredDocument {
  id: string;
  name: string;
  fileType: string;
  wordCount: number;
  chunkCount: number;
  uploadedAt: string;
  category?: string;
  summary?: string;
}

export interface SimilarityResult {
  chunk: TextChunk;
  score: number;
}

// ─── Semantic Vectorizer & Embeddings ─────────────────────────────────────────

const VECTOR_DIM = 256;

/**
 * High-performance deterministic subword hashing vectorizer.
 * Generates an L2-normalized 256-dimensional semantic representation of text,
 * capturing word stems, character n-grams, and term frequencies.
 */
export function generateLocalEmbedding(text: string): number[] {
  const vec = new Float32Array(VECTOR_DIM);
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  const words = normalized.split(/\s+/).filter((w) => w.length > 1);

  if (words.length === 0) {
    return Array.from(vec);
  }

  // Word unigrams and character 3-grams for typo resilience
  for (const word of words) {
    // Word hash
    let h1 = 0x811c9dc5;
    for (let i = 0; i < word.length; i++) {
      h1 ^= word.charCodeAt(i);
      h1 = Math.imul(h1, 0x01000193);
    }
    const idx1 = Math.abs(h1) % VECTOR_DIM;
    vec[idx1] += 2.0;

    // Subword trigrams (handles variations and spelling mistakes)
    if (word.length >= 3) {
      for (let j = 0; j <= word.length - 3; j++) {
        const trigram = word.substring(j, j + 3);
        let h2 = 0x811c9dc5;
        for (let k = 0; k < 3; k++) {
          h2 ^= trigram.charCodeAt(k);
          h2 = Math.imul(h2, 0x01000193);
        }
        const idx2 = Math.abs(h2) % VECTOR_DIM;
        vec[idx2] += 0.5;
      }
    }
  }

  // L2 Normalization so dot product equals cosine similarity
  let norm = 0;
  for (let i = 0; i < VECTOR_DIM; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < VECTOR_DIM; i++) {
      vec[i] /= norm;
    }
  }

  return Array.from(vec);
}

/**
 * Computes cosine similarity between two unit vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return Math.max(0, Math.min(1, dot));
}

/**
 * Generates embeddings via Google Gemini text-embedding-004 when key is configured,
 * falling back automatically to the local normalized semantic vectorizer.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.trim() !== '' && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.embedContent({
        model: 'text-embedding-004',
        contents: text.slice(0, 2048),
      });

      const values = response?.embeddings?.[0]?.values;
      if (Array.isArray(values) && values.length > 0) {
        // Normalize returned embedding
        let norm = 0;
        for (const v of values) norm += v * v;
        norm = Math.sqrt(norm);
        return norm > 0 ? values.map((v) => v / norm) : values;
      }
    } catch {
      // Fall through to local embedding engine
    }
  }

  return generateLocalEmbedding(text);
}

// ─── Smart Text Chunker ───────────────────────────────────────────────────────

export function chunkText(
  text: string,
  options: { chunkSize?: number; chunkOverlap?: number } = {}
): Array<{ text: string; charStart: number; charEnd: number }> {
  const chunkSize = options.chunkSize || 650;
  const chunkOverlap = options.chunkOverlap || 120;
  const chunks: Array<{ text: string; charStart: number; charEnd: number }> = [];

  if (!text || text.trim().length === 0) {
    return chunks;
  }

  // Split into natural semantic paragraphs first
  const paragraphs = text.split(/\n\s*\n/);
  let currentChunk = '';
  let currentStart = 0;

  for (const para of paragraphs) {
    const cleanPara = para.trim();
    if (!cleanPara) continue;

    if (currentChunk.length + cleanPara.length + 2 <= chunkSize) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${cleanPara}` : cleanPara;
    } else {
      if (currentChunk) {
        const charEnd = currentStart + currentChunk.length;
        chunks.push({ text: currentChunk, charStart: currentStart, charEnd });

        // Overlap management
        const overlapStart = Math.max(0, currentChunk.length - chunkOverlap);
        const overlapText = currentChunk.slice(overlapStart);
        currentStart = charEnd - overlapText.length;
        currentChunk = overlapText ? `${overlapText}\n\n${cleanPara}` : cleanPara;
      } else {
        // Single paragraph larger than chunkSize: split by sentence
        const sentences = cleanPara.split(/(?<=[.?!])\s+/);
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length + 1 <= chunkSize) {
            currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
          } else {
            if (currentChunk) {
              const charEnd = currentStart + currentChunk.length;
              chunks.push({ text: currentChunk, charStart: currentStart, charEnd });
              currentStart = charEnd;
            }
            currentChunk = sentence;
          }
        }
      }
    }
  }

  if (currentChunk && currentChunk.trim().length > 0) {
    const charEnd = currentStart + currentChunk.length;
    chunks.push({ text: currentChunk.trim(), charStart: currentStart, charEnd });
  }

  return chunks;
}

// ─── Default Pre-Seeded Knowledge Base ────────────────────────────────────────

const SEED_KNOWLEDGE_DOCS = [
  {
    id: 'seed-academic-regulations',
    name: 'University Academic Regulations & Credit Policy 2024-2026.pdf',
    fileType: 'PDF',
    category: 'Academics',
    text: `UNIVERSITY ACADEMIC REGULATIONS & DEGREE POLICIES:
1. Degree Requirements: To qualify for Bachelor of Technology / Science degrees, students must complete a minimum of 160 academic credit units across 8 semesters, maintaining a Cumulative Grade Point Average (CGPA) of at least 5.0 out of 10.0.
2. Course Registration: Course registration opens two weeks prior to the beginning of each semester on the Student Portal (Academics -> Course Registration). Standard undergraduate workload is 18 to 24 credits per semester. Overloading up to 28 credits requires Dean approval with a prior CGPA >= 8.5.
3. Add/Drop Period: Students may modify elective courses within the first 14 calendar days of instruction. Dropping a course within this period leaves no mark on the official transcript. Withdrawals after week two result in a 'W' grade.
4. Attendance Requirement: A minimum of 75% physical attendance in lectures, tutorials, and practical laboratory sessions is mandatory to appear for the End-Semester Examination. Shortage between 65% and 74% may be condoned by the Dean on valid medical or institutional grounds with certified documentation.
5. Grading Scale: The university uses a 10-point relative grading scale: Grade O (Outstanding, 10), A+ (Excellent, 9), A (Very Good, 8), B+ (Good, 7), B (Above Average, 6), C (Pass, 5), F (Fail, 0). Revaluation of final examination answer scripts can be requested within 7 days of result publication via the student portal with a fee of ₹500 per paper.`,
  },
  {
    id: 'seed-fee-financial-aid',
    name: 'Fee Payment, Instalments & Scholarships Handbook.pdf',
    fileType: 'PDF',
    category: 'Finance',
    text: `TUITION FEES, PAYMENT SCHEDULES & SCHOLARSHIPS:
1. Tuition Fee Payment: Semester tuition fees must be cleared before the designated census date via the Student Portal under Finances -> Pay Fees. Accepted payment channels include UPI, Net Banking, NEFT/RTGS, and Credit/Debit Cards. Payment receipts are generated immediately and stored permanently in Fee History.
2. Two-Part Instalment Plan: Students encountering financial hardship may apply for a 2-part instalment plan. 50% of the tuition must be paid on registration, and the remaining 50% is due by midterm (week 8). Applications must be submitted to the Accounts Office (Block B, Room 102) before semester registration closes.
3. Merit Scholarships: Students securing a semester GPA >= 9.0 receive a 30% tuition fee waiver for the following semester. Top 1% rank holders receive a 50% Chancellor's Merit Award.
4. Need-Based Financial Aid: Concessions up to 60% are provided to eligible students whose total annual family income is below ₹4,00,000 per annum upon verification of income certificates and tax records.
5. Dues Clearance: Hall tickets for final examinations, official transcripts, and degree certificates require complete clearance of all tuition, laboratory, and hostel dues.`,
  },
  {
    id: 'seed-library-eresources',
    name: 'Central Library Guide & Digital Journal Access.pdf',
    fileType: 'PDF',
    category: 'Library',
    text: `CENTRAL LIBRARY & DIGITAL KNOWLEDGE COMMONS:
1. Hours of Operation: The Central Library (Block C) is open Monday through Saturday from 8:00 AM to 10:00 PM, and Sundays from 10:00 AM to 6:00 PM. During final examination weeks, 24/7 reading halls operate on the Ground and 1st Floors.
2. Borrowing Privileges: Undergraduate students can borrow up to 5 physical books for 14 calendar days using their RFID-enabled student ID cards. Books may be renewed online twice through lib.university.edu if not reserved by another patron. Overdue fine is ₹5 per day per volume.
3. Off-Campus E-Resource Access: 24/7 remote off-campus access to IEEE Xplore, ACM Digital Library, SpringerLink, ScienceDirect, and JSTOR is enabled via institutional Single Sign-On (SSO) or EZProxy at lib.university.edu using student credentials.
4. Discussion Rooms & Inter-Library Loan: Soundproof collaborative study rooms can be reserved online for group projects (up to 4 hours per session). Rare research papers and books not held in collection can be procured through DELNET Inter-Library Loan.`,
  },
  {
    id: 'seed-health-wellness',
    name: 'Student Health Center, Counseling & Emergency Services.pdf',
    fileType: 'PDF',
    category: 'Wellbeing',
    text: `CAMPUS HEALTH CENTER & MENTAL WELLNESS HELPLINE:
1. Health Center Location & Hours: Located at Block D (Ground Floor), staffed with resident physicians and nurses Monday through Friday 8:00 AM – 6:00 PM, Saturday 9:00 AM – 1:00 PM. Consultation and basic generic medications are 100% free for all students.
2. 24/7 Medical Emergency: For urgent on-campus medical emergencies or ambulance dispatch, call the campus 24x7 control room at 1800-419-CARE or +91-80-2345-9999.
3. Confidential Psychological Counseling: The Student Wellbeing Cell offers confidential counseling for academic stress, anxiety, depression, and personal challenges. In-person and online video sessions can be booked via the Student Portal (Support -> Book Counseling). Walk-in crisis appointments are available anytime during operating hours.
4. Medical Leave Condonation Procedure: If you miss academic classes or internal tests due to illness, obtain an official Medical Fitness Certificate from the Campus Health Center or a registered hospital, and submit a Leave Application to your Department Head within 3 working days of returning.`,
  },
  {
    id: 'seed-it-hostel-campus',
    name: 'Campus Facilities, Hostel Curfew & IT Network Policy.pdf',
    fileType: 'PDF',
    category: 'Campus IT',
    text: `CAMPUS IT NETWORK, HOSTEL RESIDENCE & STUDENT FACILITIES:
1. Campus Wi-Fi (EduTrack-5G): High-speed Wi-Fi is available across all academic blocks, hostels, and libraries. To connect, select network 'EduTrack-5G', set EAP method to 'PEAP', Phase 2 authentication to 'MSCHAPv2', and log in with your Student ID and portal password.
2. Student Portal & Email Password Resets: Reset your password online via the 'Forgot Password' link on portal.university.edu with SMS/Email OTP verification. For locked accounts, contact the IT Helpdesk at Block A, Room 204 or email helpdesk@university.edu.
3. Hostel Curfew & Dining Mess: Resident students must return to hostel premises by 10:00 PM on weekdays and 10:30 PM on weekends. Late entry or overnight leave requires prior digital warden approval via the Hostel App 24 hours in advance. Four hygienic meals (Breakfast, Lunch, Evening Snacks, Dinner) are served daily with rotating vegetarian and non-vegetarian menus.
4. Certificates & Transcripts: Bonafide certificates, fee estimates for education loans, and medium-of-instruction letters can be requested via Documents -> Request Certificate and are generated with digital cryptographic verification within 24–48 hours.`,
  },
];

// ─── Vector Store Class ───────────────────────────────────────────────────────

export class VectorStore {
  private chunks: TextChunk[] = [];
  private documents: Map<string, StoredDocument> = new Map();
  private storageFilePath: string;
  private initialized = false;

  constructor() {
    this.storageFilePath = path.join(process.cwd(), 'src', 'data', 'rag_store.json');
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    try {
      if (fs.existsSync(this.storageFilePath)) {
        const raw = fs.readFileSync(this.storageFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.documents)) {
          for (const doc of parsed.documents) {
            this.documents.set(doc.id, doc);
          }
        }
        if (Array.isArray(parsed.chunks)) {
          this.chunks = parsed.chunks;
        }
      }
    } catch (err) {
      console.warn('Could not load existing vector store file, re-indexing:', err);
    }

    // Seed default knowledge if empty
    if (this.chunks.length === 0) {
      await this.seedDefaultKnowledge();
    }
  }

  private async seedDefaultKnowledge(): Promise<void> {
    for (const seed of SEED_KNOWLEDGE_DOCS) {
      await this.addDocument({
        id: seed.id,
        name: seed.name,
        fileType: seed.fileType,
        text: seed.text,
        category: seed.category,
        isSeed: true,
      });
    }
  }

  private persist(): void {
    try {
      const dir = path.dirname(this.storageFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = {
        documents: Array.from(this.documents.values()),
        chunks: this.chunks,
      };
      fs.writeFileSync(this.storageFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist vector store:', err);
    }
  }

  public async addDocument(params: {
    id: string;
    name: string;
    fileType: string;
    text: string;
    category?: string;
    isSeed?: boolean;
  }): Promise<StoredDocument> {
    await this.initialize();

    // Remove existing chunks for this document if re-adding
    this.chunks = this.chunks.filter((c) => c.documentId !== params.id);

    const rawChunks = chunkText(params.text, { chunkSize: 650, chunkOverlap: 120 });
    const wordCount = params.text.split(/\s+/).filter(Boolean).length;

    const newChunks: TextChunk[] = [];
    for (let i = 0; i < rawChunks.length; i++) {
      const raw = rawChunks[i];
      const embedding = await getEmbedding(raw.text);
      newChunks.push({
        id: `${params.id}_chunk_${i}`,
        documentId: params.id,
        documentName: params.name,
        text: raw.text,
        chunkIndex: i,
        totalChunks: rawChunks.length,
        charStart: raw.charStart,
        charEnd: raw.charEnd,
        category: params.category,
        embedding,
      });
    }

    this.chunks.push(...newChunks);

    const docRecord: StoredDocument = {
      id: params.id,
      name: params.name,
      fileType: params.fileType,
      wordCount,
      chunkCount: newChunks.length,
      uploadedAt: new Date().toISOString(),
      category: params.category || 'General',
      summary: params.text.slice(0, 160).replace(/\n/g, ' ') + '...',
    };

    this.documents.set(params.id, docRecord);
    this.persist();

    return docRecord;
  }

  public async querySimilar(
    query: string,
    topK = 4,
    minScore = 0.28
  ): Promise<SimilarityResult[]> {
    await this.initialize();
    if (this.chunks.length === 0) return [];

    const STOPWORDS = new Set([
      'what', 'when', 'where', 'which', 'who', 'whom', 'this', 'that', 'these',
      'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
      'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'would', 'should',
      'could', 'ought', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'them',
      'their', 'theirs', 'the', 'and', 'but', 'if', 'or', 'because', 'as',
      'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against',
      'between', 'into', 'through', 'during', 'before', 'after', 'above',
      'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over',
      'under', 'again', 'further', 'then', 'once', 'here', 'there', 'all',
      'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
      'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
      'can', 'will', 'just', 'don', 'tell', 'explain', 'give', 'please'
    ]);

    const queryTerms = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w));

    const queryEmbedding = await getEmbedding(query);
    const scored: SimilarityResult[] = [];

    for (const chunk of this.chunks) {
      const rawScore = cosineSimilarity(queryEmbedding, chunk.embedding);
      const chunkLower = chunk.text.toLowerCase();

      // Check lexical content overlap
      let matchedTerms = 0;
      for (const term of queryTerms) {
        if (chunkLower.includes(term)) {
          matchedTerms++;
        }
      }

      // If user had specific keywords but none appear in this chunk, require very high semantic similarity
      if (queryTerms.length > 0 && matchedTerms === 0 && rawScore < 0.58) {
        continue;
      }

      // Blend semantic score with keyword coverage boost
      const keywordBoost = queryTerms.length > 0 ? (matchedTerms / queryTerms.length) * 0.25 : 0;
      const combinedScore = Math.min(1.0, rawScore + keywordBoost);

      if (combinedScore >= minScore) {
        scored.push({ chunk, score: combinedScore });
      }
    }

    // Sort descending by similarity score
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, topK);
  }

  public getDocuments(): StoredDocument[] {
    return Array.from(this.documents.values());
  }

  public deleteDocument(id: string): boolean {
    const existed = this.documents.delete(id);
    if (existed) {
      this.chunks = this.chunks.filter((c) => c.documentId !== id);
      this.persist();
    }
    return existed;
  }

  public clearUserDocuments(): void {
    const seedIds = new Set(SEED_KNOWLEDGE_DOCS.map((s) => s.id));
    for (const [id] of this.documents) {
      if (!seedIds.has(id)) {
        this.documents.delete(id);
      }
    }
    this.chunks = this.chunks.filter((c) => seedIds.has(c.documentId));
    this.persist();
  }

  public getStats(): { totalDocuments: number; totalChunks: number } {
    return {
      totalDocuments: this.documents.size,
      totalChunks: this.chunks.length,
    };
  }
}

// Global singleton instance
export const globalVectorStore = new VectorStore();
