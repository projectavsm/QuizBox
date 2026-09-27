'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

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
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  optionOrder: OptionKey[];
};

function optionText(question: ExamQuestionRecord, option: OptionKey): string {
  return question[`option${option}` as 'optionA' | 'optionB' | 'optionC' | 'optionD'];
}

async function getShuffledQuestionRecords(studentId: number): Promise<ExamQuestionRecord[]> {
  const questions = await prisma.question.findMany({ orderBy: { id: 'asc' } });
  const secret = process.env.QUIZBOX_SHUFFLE_SECRET || 'quizbox-local-exam';
  return shuffle(questions, seedFrom(`questions:${secret}:${studentId}`)).map((question) => ({
    ...question,
    optionOrder: shuffle(optionKeys, seedFrom(`options:${secret}:${studentId}:${question.id}`)),
  }));
}

export async function getShuffledExamQuestions(studentId: number) {
  const records = await getShuffledQuestionRecords(studentId);
  return records.map((question) => ({
    id: question.id,
    questionText: question.questionText,
    optionA: optionText(question, question.optionOrder[0]),
    optionB: optionText(question, question.optionOrder[1]),
    optionC: optionText(question, question.optionOrder[2]),
    optionD: optionText(question, question.optionOrder[3]),
  }));
}

export async function submitExamAction({
  studentId,
  answers,
}: {
  studentId: string;
  answers: Record<string, string>;
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
      const displayedAnswer = answers[String(question.id)]?.toUpperCase() as OptionKey | undefined;
      const displayedIndex = displayedAnswer ? optionKeys.indexOf(displayedAnswer) : -1;
      const originalAnswer = displayedIndex >= 0 ? question.optionOrder[displayedIndex] : undefined;
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
            answersJson: JSON.stringify(normalizedAnswers),
            submittedAt: new Date(),
          },
        })
      : await prisma.submission.create({
          data: {
            studentId: student.id,
            score,
            total: questions.length,
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

    return {
      success: true,
      submissionId: submission.id,
      score,
      total: questions.length,
    };
  } catch (error: unknown) {
    console.error('Error in submitExamAction:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Failed to submit exam.' };
  }
}