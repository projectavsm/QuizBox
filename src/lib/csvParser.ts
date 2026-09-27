export type CsvQuestion = {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  subject: string;
  gradeClass: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marks: number;
};

export type CsvParseResult = {
  questions: CsvQuestion[];
  errors: string[];
};

const headers = ['questionText', 'optionA', 'optionB', 'optionC', 'optionD', 'correctOption', 'subject', 'gradeClass', 'difficulty', 'marks'] as const;
const headerNames = new Set(headers.map((header) => header.toLowerCase()));

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      values.push(value.trim());
      value = '';
    } else {
      value += character;
    }
  }
  values.push(value.trim());
  return values;
}

function defaultQuestion(row: Record<string, string>): CsvQuestion {
  const correctOption = row.correctOption?.trim().toUpperCase();
  const difficulty = row.difficulty?.trim();
  const marks = Number(row.marks);

  return {
    questionText: row.questionText?.trim() || '',
    optionA: row.optionA?.trim() || '',
    optionB: row.optionB?.trim() || '',
    optionC: row.optionC?.trim() || '',
    optionD: row.optionD?.trim() || '',
    correctOption: ['A', 'B', 'C', 'D'].includes(correctOption) ? correctOption as CsvQuestion['correctOption'] : 'A',
    subject: row.subject?.trim() || 'General',
    gradeClass: row.gradeClass?.trim() || 'All',
    difficulty: ['Easy', 'Medium', 'Hard'].includes(difficulty) ? difficulty as CsvQuestion['difficulty'] : 'Medium',
    marks: Number.isFinite(marks) && marks >= 0 ? marks : 1,
  };
}

export function parseCsvQuestions(csvContent: string): CsvParseResult {
  const lines = csvContent.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return { questions: [], errors: ['The file is empty.'] };

  const rawHeaders = splitCsvLine(lines[0]).map((header) => header.trim());
  const normalizedHeaders = rawHeaders.map((header) => header.toLowerCase());
  const missingHeaders = headers.filter((header) => !normalizedHeaders.includes(header.toLowerCase()));
  if (missingHeaders.length) return { questions: [], errors: [`Missing required columns: ${missingHeaders.join(', ')}`] };

  const questions: CsvQuestion[] = [];
  const errors: string[] = [];
  for (let index = 1; index < lines.length; index += 1) {
    const values = splitCsvLine(lines[index]);
    const row = Object.fromEntries(normalizedHeaders.map((header, columnIndex) => [header, values[columnIndex] || ''])) as Record<string, string>;
    const question = defaultQuestion(row);
    if (!question.questionText || !question.optionA || !question.optionB || !question.optionC || !question.optionD) {
      errors.push(`Row ${index + 1}: question text and all four options are required.`);
      continue;
    }
    questions.push(question);
  }
  return { questions, errors };
}

export function parseCsvRows(rows: Record<string, unknown>[]): CsvParseResult {
  const questions: CsvQuestion[] = [];
  const errors: string[] = [];
  rows.forEach((rawRow, index) => {
    const row = Object.fromEntries(Object.entries(rawRow).map(([key, value]) => [key.trim().toLowerCase(), String(value ?? '')]));
    const question = defaultQuestion(row);
    if (!question.questionText || !question.optionA || !question.optionB || !question.optionC || !question.optionD) {
      errors.push(`Row ${index + 2}: question text and all four options are required.`);
      return;
    }
    questions.push(question);
  });
  return { questions, errors };
}

export function generateSampleCsv(): string {
  const sample = [
    headers.join(','),
    ['What is 2 + 2?', '1', '2', '4', '5', 'C', 'Mathematics', 'All', 'Easy', '1'].map((value) => `"${value.replaceAll('"', '""')}"`).join(','),
  ];
  return `${sample.join('\n')}\n`;
}

export { headerNames };
