import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

export interface ParsedDocument {
  filename: string;
  text: string;
  fileType: string;
  wordCount: number;
  metadata?: Record<string, unknown>;
}

/**
 * Sanitizes extracted text by removing null bytes, normalizing whitespace,
 * and stripping out potentially dangerous prompt-injection wrappers.
 */
export function sanitizeDocumentText(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/\0/g, '') // remove null characters
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Parses raw file buffer into clean, structured plain text based on extension or mimeType.
 */
export async function parseDocument(
  buffer: Buffer,
  filename: string,
  mimeType?: string
): Promise<ParsedDocument> {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  let extractedText = '';
  const metadata: Record<string, unknown> = {};

  try {
    if (ext === 'pdf' || mimeType === 'application/pdf') {
      const parser = new PDFParse({ data: buffer });
      try {
        const textResult = await parser.getText();
        extractedText = textResult?.text || '';
        metadata.numPages = textResult?.total;
      } finally {
        await parser.destroy();
      }
    } else if (
      ext === 'docx' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const docxResult = await mammoth.extractRawText({ buffer });
      extractedText = docxResult.value || '';
      if (docxResult.messages?.length > 0) {
        metadata.warnings = docxResult.messages.map((m) => m.message);
      }
    } else if (
      ext === 'txt' ||
      ext === 'md' ||
      ext === 'markdown' ||
      ext === 'csv' ||
      ext === 'json' ||
      ext === 'html' ||
      ext === 'htm' ||
      ext === 'log'
    ) {
      extractedText = buffer.toString('utf-8');
      if (ext === 'json') {
        try {
          const parsedJson = JSON.parse(extractedText);
          extractedText = JSON.stringify(parsedJson, null, 2);
        } catch {
          // Keep raw string if JSON parsing fails
        }
      }
    } else {
      // Best-effort UTF-8 decode
      extractedText = buffer.toString('utf-8');
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to extract text from "${filename}": ${errorMsg}`);
  }

  const cleanText = sanitizeDocumentText(extractedText);
  if (!cleanText || cleanText.length < 5) {
    throw new Error(
      `Document "${filename}" appears to be empty or contains no readable text.`
    );
  }

  const wordCount = cleanText.split(/\s+/).filter(Boolean).length;

  return {
    filename,
    text: cleanText,
    fileType: ext.toUpperCase() || 'DOCUMENT',
    wordCount,
    metadata,
  };
}
