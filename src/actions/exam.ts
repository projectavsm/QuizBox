'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

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

    const questions = await prisma.question.findMany();
    let score = 0;
    questions.forEach((q) => {
      const studentAns = answers[String(q.id)];
      if (studentAns && studentAns.toUpperCase() === q.correctOption.toUpperCase()) {
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
            answersJson: JSON.stringify(answers),
            submittedAt: new Date(),
          },
        })
      : await prisma.submission.create({
          data: {
            studentId: student.id,
            score,
            total: questions.length,
            answersJson: JSON.stringify(answers),
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