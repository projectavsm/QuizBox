'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { handleServerError } from '@/lib/errorUtils';
import { logger } from '@/lib/logger';

const optionKeys = ['A', 'B', 'C', 'D'] as const;
type OptionKey = (typeof optionKeys)[number];

function seedFrom(value: string): number {
  let seed = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    seed ^= value.charCodeAt(index);
    seed = Math.imul(seed, 16777619);
  }
  return seed >>> 0 || 1;
}

function shuffle<T>(values: readonly T[], seed: number): T[] {
  const result = [...values];
  let state = seed >>> 0 || 1;
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

type ExamQuestionRecord = {
  id: number;
  questionText: string;
  imageUrl: string | null;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
};

async function getShuffledQuestionRecords(studentId: number): Promise<ExamQuestionRecord[]> {
  const questions = await prisma.question.findMany({ orderBy: { id: 'asc' } });
  const secret = process.env.QUIZBOX_SHUFFLE_SECRET || 'quizbox-local-exam';
  return shuffle(questions, seedFrom(`questions:${secret}:${studentId}`));
}

export async function getShuffledExamQuestions(studentId: number) {
  try {
    const records = await getShuffledQuestionRecords(studentId);
    return records.map((question) => ({
      id: question.id,
      questionText: question.questionText,
      imageUrl: question.imageUrl,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
    }));
  } catch (error) {
    handleServerError(error, 'getShuffledExamQuestions');
    return [];
  }
}

export async function submitExamAction({
  studentId,
  answers,
  warningCount,
}: {
  studentId: string;
  answers: Record<string, string>;
  warningCount: number;
}) {
  try {
    const parsedStudentId = parseInt(studentId, 10);
    if (!studentId?.trim() || Number.isNaN(parsedStudentId) || parsedStudentId <= 0) {
      return { success: false, message: 'Invalid student ID format.' };
    }

    const cookieStore = await cookies();
    const sessionValue = cookieStore.get('student_session')?.value;
    try {
      const session = JSON.parse(sessionValue || '') as { studentId?: unknown };
      if (session.studentId !== parsedStudentId) {
        return { success: false, message: 'Unauthorized session. Please re-register.' };
      }
    } catch {
      return { success: false, message: 'Unauthorized session. Please re-register.' };
    }

    // Verify student exists before recalculating or writing the submission.
    const student = await prisma.student.findUnique({
      where: { id: parsedStudentId },
    });
    if (!student) {
      return { success: false, message: `Student ID ${studentId} not found.` };
    }

    const questions = await getShuffledQuestionRecords(parsedStudentId);
    let score = 0;
    const normalizedAnswers: Record<string, string> = {};
    questions.forEach((question) => {
      const originalAnswer = answers[String(question.id)]?.toUpperCase() as OptionKey | undefined;
      if (originalAnswer) normalizedAnswers[String(question.id)] = originalAnswer;
      if (originalAnswer && originalAnswer === question.correctOption.toUpperCase()) {
        score++;
      }
    });

    const existingSubmission = await prisma.submission.findUnique({
      where: { studentId: student.id },
    });

    const submission = existingSubmission
      ? await prisma.submission.update({
          where: { id: existingSubmission.id },
          data: {
            score,
            total: questions.length,
            warningCount: Math.max(0, Math.floor(warningCount)),
            answersJson: JSON.stringify(normalizedAnswers),
            submittedAt: new Date(),
          },
        })
      : await prisma.submission.create({
          data: {
            studentId: student.id,
            score,
            total: questions.length,
            warningCount: Math.max(0, Math.floor(warningCount)),
            answersJson: JSON.stringify(normalizedAnswers),
          },
        });

    cookieStore.set('quizbox_exam_submitted', 'true', {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    revalidatePath('/admin');
    revalidatePath('/admin/export');
    revalidatePath('/result');

    logger.action('submitExamAction', `Student #${student.id} (${score}/${questions.length})`);

    return {
      success: true,
      submissionId: submission.id,
      score,
      total: questions.length,
    };
  } catch (error: unknown) {
    return { success: false, message: handleServerError(error, 'submitExamAction') };
  }
}