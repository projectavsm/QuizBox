'use server';

import { prisma } from '@/lib/prisma';
import { extractDocumentText, parseCSV, parseDocumentQuestionText, parseFormattedText, ParsedQuestion } from '@/lib/parser';
import type { CsvQuestion } from '@/lib/csvParser';
import { revalidatePath } from 'next/cache';
import { handleServerError } from '@/lib/errorUtils';
import { logger } from '@/lib/logger';

export type QuestionInput = {
  questionText: string;
  imageUrl?: string | null;
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
    imageUrl: data.imageUrl?.trim() || null,
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
  try {
    const question = await prisma.question.create({ data: questionData(data) });
    revalidatePath('/admin/questions');
    logger.action('addSingleQuestionAction', `Question #${question.id} created`);
    return { success: true, questionId: question.id };
  } catch (error) {
    return { success: false, message: handleServerError(error, 'addSingleQuestionAction') };
  }
}

export async function updateQuestionAction(id: number, data: QuestionInput) {
  try {
    await prisma.question.update({ where: { id }, data: questionData(data) });
    revalidatePath('/admin/questions');
    logger.action('updateQuestionAction', `Question #${id} updated`);
    return { success: true };
  } catch (error) {
    return { success: false, message: handleServerError(error, 'updateQuestionAction') };
  }
}

export async function deleteQuestionAction(id: number) {
  try {
    await prisma.question.delete({ where: { id } });
    revalidatePath('/admin/questions');
    logger.action('deleteQuestionAction', `Question #${id} deleted`);
    return { success: true };
  } catch (error) {
    return { success: false, message: handleServerError(error, 'deleteQuestionAction') };
  }
}

export async function bulkInsertCsvQuestionsAction(questionsArray: CsvQuestion[]) {
  if (!questionsArray.length) return { success: false, count: 0, message: 'No questions to import.' };

  const invalidIndex = questionsArray.findIndex((question) =>
    !question.questionText.trim() || !question.optionA.trim() || !question.optionB.trim() ||
    !question.optionC.trim() || !question.optionD.trim() || !['A', 'B', 'C', 'D'].includes(question.correctOption) ||
    !['Easy', 'Medium', 'Hard'].includes(question.difficulty) || !Number.isFinite(question.marks) || question.marks < 0,
  );
  if (invalidIndex >= 0) return { success: false, count: 0, message: `Question ${invalidIndex + 1} has invalid or missing values.` };

  try {
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
    logger.action('bulkInsertCsvQuestionsAction', `${questionsArray.length} questions imported`);
    return { success: true, count: questionsArray.length };
  } catch (error) {
    return { success: false, count: 0, message: handleServerError(error, 'bulkInsertCsvQuestionsAction') };
  }
}

export type ExamSettingsInput = {
  durationMinutes: number;
  examTitle?: string;
  isExamActive?: boolean;
};

export async function updateExamSettingsAction(data: ExamSettingsInput | FormData) {
  const durationMinutes = data instanceof FormData
    ? Number.parseInt(String(data.get('durationMinutes') || ''), 10)
    : data.durationMinutes;
  const examTitle = data instanceof FormData
    ? String(data.get('examTitle') || 'QuizBox Examination').trim()
    : data.examTitle?.trim() || 'QuizBox Examination';
  const isExamActive = data instanceof FormData ? data.get('isExamActive') === 'on' : data.isExamActive ?? true;

  if (!Number.isFinite(durationMinutes) || durationMinutes < 1) {
    return { success: false, message: 'Duration must be at least one minute.' };
  }

  try {
    await prisma.settings.upsert({
      where: { id: 1 },
      update: { durationMinutes, examTitle, isExamActive },
      create: { id: 1, durationMinutes, examTitle, isExamActive },
    });
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/test');
    logger.action('updateExamSettingsAction', `Exam settings updated (${durationMinutes} minutes)`);
    return { success: true };
  } catch (error) {
    return { success: false, message: handleServerError(error, 'updateExamSettingsAction') };
  }
}

export async function getExamSettingsAction() {
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    return settings ?? { id: 1, examTitle: 'QuizBox Examination', durationMinutes: 30, isExamActive: true };
  } catch (error) {
    handleServerError(error, 'getExamSettingsAction');
    return { id: 1, examTitle: 'QuizBox Examination', durationMinutes: 30, isExamActive: true };
  }
}

export async function getLiveStatsAction() {
  try {
    const totalRegistered = await prisma.student.count();
    const submissions = await prisma.submission.findMany({
      include: { student: true },
      orderBy: { submittedAt: 'desc' },
    });

    const totalSubmitted = submissions.length;
    const scores = submissions.map((submission) => submission.score);
    const averageScore = totalSubmitted > 0
      ? scores.reduce((sum, score) => sum + score, 0) / totalSubmitted
      : 0;
    const highestScore = totalSubmitted > 0 ? Math.max(...scores) : 0;

    const recentSubmissions = submissions.slice(0, 10).map((submission) => ({
      id: submission.id,
      name: submission.student.name,
      rollNumber: submission.student.rollNumber,
      score: submission.score,
      total: submission.total,
      submittedAt: submission.submittedAt.toLocaleTimeString(),
    }));

    return {
      success: true,
      stats: { totalRegistered, totalSubmitted, averageScore, highestScore, recentSubmissions },
    };
  } catch (error) {
    return { success: false, message: handleServerError(error, 'getLiveStatsAction') };
  }
}

export async function bulkAddQuestionsAction(questions: QuestionInput[]) {
  if (!questions.length) return { success: false, count: 0, message: 'No questions to save.' };

  try {
    await prisma.question.createMany({
      data: questions.map((question) => ({
        questionText: question.questionText.trim(), optionA: question.optionA.trim(), optionB: question.optionB.trim(),
        optionC: question.optionC.trim(), optionD: question.optionD.trim(), correctOption: question.correctOption,
        subject: question.subject?.trim() || 'General', gradeClass: question.gradeClass?.trim() || 'All',
        difficulty: question.difficulty, marks: Number.isFinite(question.marks) && question.marks >= 0 ? question.marks : 1,
      })),
    });
    revalidatePath('/admin/questions');
    logger.action('bulkAddQuestionsAction', `${questions.length} questions saved`);
    return { success: true, count: questions.length };
  } catch (error) {
    return { success: false, count: 0, message: handleServerError(error, 'bulkAddQuestionsAction') };
  }
}

export async function parseDocumentAction(formData: FormData) {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, questions: [], message: 'Please select a document.' };
  }

  try {
    const content = await extractDocumentText(file.name, Buffer.from(await file.arrayBuffer()));
    const questions: ParsedQuestion[] = parseDocumentQuestionText(content);
    if (questions.length) logger.action('parseDocumentAction', `${questions.length} questions parsed`);
    return questions.length
      ? { success: true, questions }
      : { success: false, questions: [], message: 'No complete questions were found in this document.' };
  } catch (error) {
    return { success: false, questions: [], message: handleServerError(error, 'parseDocumentAction') };
  }
}

export async function getStudentSubmissionDetail(submissionId: number) {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: {
        score: true,
        total: true,
        warningCount: true,
        answersJson: true,
        student: {
          select: {
            name: true,
            gradeClass: true,
            section: true,
            rollNumber: true,
          },
        },
      },
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
      warningCount: submission.warningCount,
      breakdown,
    };
  } catch (error) {
    handleServerError(error, 'getStudentSubmissionDetail');
    return null;
  }
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

  try {
    await prisma.question.createMany({
      data: parsed.map((q) => ({
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: q.correctAnswer || q.correctOption,
        subject: 'General',
        gradeClass: 'All',
        difficulty: 'Medium',
        marks: 1,
      })),
    });

    revalidatePath('/admin/questions');
    logger.action('importQuestionsAction', `${parsed.length} questions imported`);
    return { success: true, count: parsed.length };
  } catch (error) {
    return { success: false, count: 0, message: handleServerError(error, 'importQuestionsAction') };
  }
}

export async function clearAllQuestionsAction() {
  try {
    const result = await prisma.question.deleteMany();
    revalidatePath('/admin/questions');
    logger.action('clearAllQuestionsAction', `${result.count} questions deleted`);
    return { success: true };
  } catch (error) {
    return { success: false, message: handleServerError(error, 'clearAllQuestionsAction') };
  }
}