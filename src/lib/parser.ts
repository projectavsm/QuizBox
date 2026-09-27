import mammoth from 'mammoth';

// Use the implementation entry point to avoid pdf-parse loading its test fixture at import time.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (buffer: Buffer) => Promise<{ text?: string }>;

export interface ParsedQuestion {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  correctOption: string;
  subject: string;
  gradeClass: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marks: number;
}

const defaultMetadata = {
  subject: 'General',
  gradeClass: 'All',
  difficulty: 'Medium' as const,
  marks: 1,
};

function createQuestion(
  questionText: string,
  options: Record<'A' | 'B' | 'C' | 'D', string>,
  correctAnswer: ParsedQuestion['correctAnswer'],
): ParsedQuestion {
  return { questionText, optionA: options.A, optionB: options.B, optionC: options.C, optionD: options.D, correctAnswer, correctOption: correctAnswer, ...defaultMetadata };
}

export function parseCSV(csvContent: string): ParsedQuestion[] {
  const lines = csvContent.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const questions: ParsedQuestion[] = [];

  for (let i = 0; i < lines.length; i++) {
    // Regex splitting to handle commas inside quoted strings
    const regex = /(?:,|\n|^)("(?:(?:"")*|[^"]*)*"|[^",\n]*)/g;
    const cols: string[] = [];
    let match;
    while ((match = regex.exec(lines[i])) !== null) {
      let val = match[1].replace(/^"|"$/g, '').trim();
      cols.push(val);
    }

    if (cols.length < 5) continue;

    // Skip header rows if present
    const firstColLower = cols[0].toLowerCase();
    if (firstColLower.includes('question') || firstColLower.includes('id') || firstColLower.includes('s.n')) {
      continue;
    }

    // AUTO-DETECT: If column 0 is an ID/numeric index, offset column indices by 1.
    const isFirstColNumeric = /^\d+$/.test(cols[0]);
    const qIndex = isFirstColNumeric ? 1 : 0;
    const aIndex = qIndex + 1;
    const bIndex = qIndex + 2;
    const cIndex = qIndex + 3;
    const dIndex = qIndex + 4;
    const ansIndex = qIndex + 5;

    const rawAns = (cols[ansIndex] || 'A').toUpperCase().trim();
    const validAns: 'A' | 'B' | 'C' | 'D' = ['A', 'B', 'C', 'D'].includes(rawAns)
      ? (rawAns as 'A' | 'B' | 'C' | 'D')
      : 'A';

    if (cols[qIndex] && cols[aIndex]) {
      questions.push({
        questionText: cols[qIndex],
        optionA: cols[aIndex],
        optionB: cols[bIndex] || '',
        optionC: cols[cIndex] || '',
        optionD: cols[dIndex] || '',
        correctAnswer: validAns,
        correctOption: validAns,
        ...defaultMetadata,
      });
    }
  }

  return questions;
}

export function parseFormattedText(textContent: string): ParsedQuestion[] {
  return parseRawTextToQuestions(textContent);
}

export function parseDocumentQuestionText(textContent: string): ParsedQuestion[] {
  return parseRawTextToQuestions(textContent);
}

export async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text || '';
}

export async function parseDocxBuffer(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value || '';
}

export function parseRawTextToQuestions(text: string): ParsedQuestion[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const questions: ParsedQuestion[] = [];
  const answerKeyMap: Record<number, string> = {};

  const answerKeyPattern = /\b(\d+)[\.\s:-]+([A-D])\b/gi;
  const extractAnswerKeyMappings = (line: string): RegExpMatchArray[] => Array.from(line.matchAll(answerKeyPattern));

  const isAnswerKeyLine = (line: string, matches: RegExpMatchArray[]) => {
    if (matches.length < 2) return false;
    const remainder = line
      .replace(/^(?:answer\s*key|answers?)\s*[:\-]?\s*/i, '')
      .replace(answerKeyPattern, '')
      .replace(/[\s,;|]+/g, '');
    return remainder.length === 0;
  };

  let currentQuestion: Partial<ParsedQuestion> | null = null;
  const saveCurrent = () => {
    if (currentQuestion?.questionText) questions.push(finalizeQuestion(currentQuestion));
  };

  for (const line of lines) {
    const answerKeyMatches = extractAnswerKeyMappings(line);
    if (isAnswerKeyLine(line, answerKeyMatches)) {
      for (const match of answerKeyMatches) {
        answerKeyMap[Number(match[1])] = match[2].toUpperCase();
      }
      continue;
    }

    const questionMatch = line.match(/^(?:Q\s*\d+\s*[:.]|Q\s*[:.]|Question\s*\d*\s*[:.]|\d+[.\)])\s*(.+)/i);
    if (questionMatch) {
      saveCurrent();
      currentQuestion = { questionText: questionMatch[1], optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A' };
      continue;
    }
    if (!currentQuestion) continue;

    const optionMatch = line.match(/^(\*)?([A-D])[.)]\s*(.+)/i);
    if (optionMatch) {
      const option = optionMatch[2].toUpperCase() as 'A' | 'B' | 'C' | 'D';
      currentQuestion[`option${option}` as 'optionA' | 'optionB' | 'optionC' | 'optionD'] = optionMatch[3];
      if (optionMatch[1] || line.toLowerCase().includes('(correct)')) currentQuestion.correctAnswer = option;
      continue;
    }

    const answerMatch = line.match(/^Answer:\s*([A-D])/i);
    if (answerMatch) {
      currentQuestion.correctAnswer = answerMatch[1].toUpperCase() as ParsedQuestion['correctAnswer'];
    }
  }

  saveCurrent();
  return questions.map((question, index) => {
    const answer = answerKeyMap[index + 1];
    return answer
      ? { ...question, correctOption: answer, correctAnswer: answer as ParsedQuestion['correctAnswer'] }
      : question;
  });
}

function finalizeQuestion(question: Partial<ParsedQuestion>): ParsedQuestion {
  const correctOption = question.correctAnswer || question.correctOption || 'A';
  return {
    questionText: question.questionText || '',
    optionA: question.optionA || 'Option A',
    optionB: question.optionB || 'Option B',
    optionC: question.optionC || 'Option C',
    optionD: question.optionD || 'Option D',
    correctAnswer: correctOption as ParsedQuestion['correctAnswer'],
    correctOption,
    subject: 'General',
    gradeClass: 'All',
    difficulty: 'Medium',
    marks: 1,
  };
}

export async function extractDocumentText(fileName: string, content: Buffer): Promise<string> {
  const extension = fileName.toLowerCase().split('.').pop();
  if (extension === 'txt') return content.toString('utf8');
  if (extension === 'pdf') return parsePdfBuffer(content);
  if (extension === 'docx') return parseDocxBuffer(content);
  throw new Error('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
}