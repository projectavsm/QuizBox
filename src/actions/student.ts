'use server';

import { prisma } from '@/lib/prisma';
import { StudentRegistrationInput } from '@/types';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { handleServerError } from '@/lib/errorUtils';
import { logger } from '@/lib/logger';

export async function checkStudentSessionAction() {
  const cookieStore = await cookies();
  const isSubmitted = cookieStore.get('quizbox_exam_submitted')?.value === 'true';
  return { isSubmitted };
}

export async function finishStudentSessionAction() {
  const cookieStore = await cookies();
  cookieStore.delete('student_session');
  cookieStore.delete('quizbox_student_id');
  cookieStore.delete('quizbox_exam_submitted');
  redirect('/');
}

export async function registerStudent(input: StudentRegistrationInput) {
  try {
    const { name, gradeClass, section, rollNumber } = input;

    if (!name || !gradeClass || !section || !rollNumber) {
      return { success: false, error: 'All fields are required.' };
    }

    // Check cookie submission lock first
    const cookieStore = await cookies();
    if (cookieStore.get('quizbox_exam_submitted')?.value === 'true') {
      return {
        success: false,
        error: 'You have already submitted your QuizBox exam. Multiple attempts are not permitted.',
      };
    }

    // Check database if student record already exists and has a submission
    const existingStudent = await prisma.student.findUnique({
      where: {
        rollNumber_gradeClass_section: {
          rollNumber,
          gradeClass,
          section,
        },
      },
      include: { submission: true },
    });

    if (existingStudent?.submission) {
      return {
        success: false,
        error: 'You have already submitted your QuizBox exam. Multiple attempts are not permitted.',
      };
    }

    // Upsert student record
    const student = await prisma.student.upsert({
      where: {
        rollNumber_gradeClass_section: {
          rollNumber,
          gradeClass,
          section,
        },
      },
      update: { name },
      create: {
        name,
        gradeClass,
        section,
        rollNumber,
      },
    });

    // Set HTTP-Only Cookie for student session
    cookieStore.set('quizbox_student_id', student.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    logger.action('registerStudent', `Student #${student.id} registered`);
    return { success: true, studentId: student.id };
  } catch (error) {
    return { success: false, error: handleServerError(error, 'registerStudent') };
  }
}

export async function getCurrentStudentSession() {
  try {
    const cookieStore = await cookies();
    const studentId = cookieStore.get('quizbox_student_id')?.value;

    if (!studentId) return null;

    return await prisma.student.findUnique({
      where: { id: parseInt(studentId, 10) },
      select: {
        id: true,
        name: true,
        gradeClass: true,
        section: true,
        rollNumber: true,
      },
    });
  } catch (error) {
    handleServerError(error, 'getCurrentStudentSession');
    return null;
  }
}

export async function registerStudentAction(data: StudentRegistrationInput) {
  try {
    const name = data.name.trim();
    const gradeClass = data.gradeClass.trim();
    const section = data.section.trim();
    const rollNumber = data.rollNumber.trim();

    if (!name || !gradeClass || !section || !rollNumber) {
      return { success: false, message: 'All fields are required.' };
    }

    const existingStudent = await prisma.student.findFirst({
      where: { rollNumber, gradeClass, section },
    });
    const student = existingStudent ?? await prisma.student.create({
      data: { name, gradeClass, section, rollNumber },
    });

    const cookieStore = await cookies();
    cookieStore.set('student_session', JSON.stringify({ studentId: student.id, name: student.name, rollNumber: student.rollNumber }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    logger.action('registerStudentAction', `Student #${student.id} registered`);
    return { success: true, studentId: String(student.id) };
  } catch (error: unknown) {
    return { success: false, message: handleServerError(error, 'registerStudentAction') };
  }
}