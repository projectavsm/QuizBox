'use server';

import { prisma } from '@/lib/prisma';
import { extractDocumentText, parseCSV, parseDocumentQuestionText, parseFormattedText, ParsedQuestion } from '@/lib/parser';
import type { CsvQuestion } from '@/lib/csvParser';
import { revalidatePath } from 'next/cache';

export type QuestionInput = {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  subject?: string;
  gradeClass?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marks: number;
};

function questionData(data: QuestionInput) {
  return {
    questionText: data.questionText.trim(),
    optionA: data.optionA.trim(),
    optionB: data.optionB.trim(),
    optionC: data.optionC.trim(),
    optionD: data.optionD.trim(),
    correctOption: data.correctOption,
    subject: data.subject?.trim() || 'General',
    gradeClass: data.gradeClass?.trim() || 'All',
    difficulty: data.difficulty,
    marks: data.marks,
  };
}

export async function addSingleQuestionAction(data: QuestionInput) {
  const question = await prisma.question.create({ data: questionData(data) });
  revalidatePath('/admin/questions');
  return { success: true, questionId: question.id };
}

export async function updateQuestionAction(id: number, data: QuestionInput) {
  await prisma.question.update({ where: { id }, data: questionData(data) });
  revalidatePath('/admin/questions');
  return { success: true };
}

export async function deleteQuestionAction(id: number) {
  await prisma.question.delete({ where: { id } });
  revalidatePath('/admin/questions');
  return { success: true };
}

export async function bulkInsertCsvQuestionsAction(questionsArray: CsvQuestion[]) {
  if (!questionsArray.length) return { success: false, count: 0, message: 'No questions to import.' };

  const invalidIndex = questionsArray.findIndex((question) =>
    !question.questionText.trim() || !question.optionA.trim() || !question.optionB.trim() ||
    !question.optionC.trim() || !question.optionD.trim() || !['A', 'B', 'C', 'D'].includes(question.correctOption) ||
    !['Easy', 'Medium', 'Hard'].includes(question.difficulty) || !Number.isFinite(question.marks) || question.marks < 0,
  );
  if (invalidIndex >= 0) return { success: false, count: 0, message: `Question ${invalidIndex + 1} has invalid or missing values.` };

  await prisma.$transaction((transaction) => transaction.question.createMany({
    data: questionsArray.map((question) => ({
      questionText: question.questionText.trim(),
      optionA: question.optionA.trim(),
      optionB: question.optionB.trim(),
      optionC: question.optionC.trim(),
      optionD: question.optionD.trim(),
      correctOption: question.correctOption,
      subject: question.subject.trim() || 'General',
      gradeClass: question.gradeClass.trim() || 'All',
      difficulty: question.difficulty,
      marks: question.marks,
    })),
  }));
  revalidatePath('/admin/questions');
  return { success: true, count: questionsArray.length };
}

export type ExamSettingsInput = {
  durationMinutes: number;
  examTitle: string;
  isExamActive: boolean;
};

export async function updateExamSettingsAction(data: ExamSettingsInput | FormData) {
  const durationMinutes = data instanceof FormData
    ? parseInt(data.get('durationMinutes') as string, 10) || 30
    : data.durationMinutes;
  const examTitle = data instanceof FormData
    ? (data.get('examTitle') as string) || 'QuizBox Assessment'
    : data.examTitle.trim() || 'QuizBox Assessment';
  const isExamActive = data instanceof FormData ? data.get('isExamActive') === 'on' : data.isExamActive;

  if (!Number.isFinite(durationMinutes) || durationMinutes < 1) {
    return { success: false, message: 'Duration must be at least one minute.' };
  }

  const existing = await prisma.settings.findFirst();
  if (existing) {
    await prisma.settings.update({ where: { id: existing.id }, data: { durationMinutes, examTitle, isExamActive } });
  } else {
    await prisma.settings.create({ data: { durationMinutes, examTitle, isExamActive } });
  }
  revalidatePath('/');
  revalidatePath('/admin');
  return { success: true };
}

export async function bulkAddQuestionsAction(questions: QuestionInput[]) {
  if (!questions.length) return { success: false, count: 0, message: 'No questions to save.' };

  await prisma.question.createMany({
    data: questions.map((question) => ({
      questionText: question.questionText.trim(), optionA: question.optionA.trim(), optionB: question.optionB.trim(),
      optionC: question.optionC.trim(), optionD: question.optionD.trim(), correctOption: question.correctOption,
      subject: question.subject?.trim() || 'General', gradeClass: question.gradeClass?.trim() || 'All',
      difficulty: question.difficulty, marks: Number.isFinite(question.marks) && question.marks >= 0 ? question.marks : 1,
    })),
  });
  revalidatePath('/admin/questions');
  return { success: true, count: questions.length };
}

export async function parseDocumentAction(formData: FormData) {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, questions: [], message: 'Please select a document.' };
  }

  try {
    const content = await extractDocumentText(file.name, Buffer.from(await file.arrayBuffer()));
    const questions: ParsedQuestion[] = parseDocumentQuestionText(content);
    return questions.length
      ? { success: true, questions }
      : { success: false, questions: [], message: 'No complete questions were found in this document.' };
  } catch (error) {
    return { success: false, questions: [], message: error instanceof Error ? error.message : 'Unable to parse the document.' };
  }
}

export async function getStudentSubmissionDetail(submissionId: number) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { student: true },
  });

  if (!submission) return null;

  let answers: Record<string, string> = {};
  try {
    const parsed = JSON.parse(submission.answersJson) as unknown;
    if (parsed && typeof parsed === 'object') answers = parsed as Record<string, string>;
  } catch {
    answers = {};
  }

  const questions = await prisma.question.findMany({ orderBy: { id: 'asc' } });
  const breakdown = questions.map((question) => {
    const studentChoice = answers[String(question.id)]?.toUpperCase() || null;
    return {
      questionId: question.id,
      questionText: question.questionText,
      options: { A: question.optionA, B: question.optionB, C: question.optionC, D: question.optionD },
      correctOption: question.correctOption,
      studentChoice,
      isCorrect: studentChoice === question.correctOption.toUpperCase(),
      marks: question.marks,
    };
  });

  return {
    student: {
      name: submission.student.name,
      gradeClass: submission.student.gradeClass,
      section: submission.student.section,
      rollNumber: submission.student.rollNumber,
    },
    score: submission.score,
    total: submission.total,
    breakdown,
  };
}

export async function importQuestionsAction(formData: FormData) {
  const file = formData.get('file') as File | null;
  const rawText = formData.get('rawText') as string | null;

  let parsed: any[] = [];

  if (file && file.size > 0) {
    const content = await file.text();
    parsed = parseCSV(content);
  } else if (rawText && rawText.trim().length > 0) {
    parsed = parseFormattedText(rawText);
  }

  if (parsed.length === 0) {
    return { success: false, count: 0, message: 'No valid questions found.' };
  }

  await prisma.question.createMany({
    data: parsed.map((q) => ({
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctOption: q.correctAnswer || q.correctOption, // Fixed field name mapping
      subject: 'General',
      gradeClass: 'All',
      difficulty: 'Medium',
      marks: 1,
    })),
  });

  revalidatePath('/admin/questions');
  return { success: true, count: parsed.length };
}

export async function clearAllQuestionsAction() {
  await prisma.question.deleteMany();
  revalidatePath('/admin/questions');
  return { success: true };
}