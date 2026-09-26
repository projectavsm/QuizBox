export interface ParsedQuestion {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  category?: string;
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
        category: 'Imported CSV',
      });
    }
  }

  return questions;
}

export function parseFormattedText(textContent: string): ParsedQuestion[] {
  const blocks = textContent.split(/\n\s*\n/).filter((block) => block.trim().length > 0);
  const questions: ParsedQuestion[] = [];

  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    let questionText = '';
    let optionA = '';
    let optionB = '';
    let optionC = '';
    let optionD = '';
    let correctAnswer: ParsedQuestion['correctAnswer'] = 'A';

    for (const line of lines) {
      if (/^(Q:|Question:|\d+[\.\)])/i.test(line)) {
        questionText = line.replace(/^(Q:|Question:|\d+[\.\)])/i, '').trim();
      } else if (/^A[\.\)]/i.test(line)) {
        optionA = line.replace(/^A[\.\)]/i, '').trim();
      } else if (/^B[\.\)]/i.test(line)) {
        optionB = line.replace(/^B[\.\)]/i, '').trim();
      } else if (/^C[\.\)]/i.test(line)) {
        optionC = line.replace(/^C[\.\)]/i, '').trim();
      } else if (/^D[\.\)]/i.test(line)) {
        optionD = line.replace(/^D[\.\)]/i, '').trim();
      } else if (/^(Answer:|Correct:)/i.test(line)) {
        const answer = line.replace(/^(Answer:|Correct:)/i, '').trim().toUpperCase();
        if (['A', 'B', 'C', 'D'].includes(answer)) {
          correctAnswer = answer as ParsedQuestion['correctAnswer'];
        }
      }
    }

    if (questionText && optionA && optionB && optionC && optionD) {
      questions.push({ questionText, optionA, optionB, optionC, optionD, correctAnswer, category: 'Text Import' });
    }
  }

  return questions;
}