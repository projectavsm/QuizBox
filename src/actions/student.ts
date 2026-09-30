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
    const name = input.name.trim();
    const gradeClass = input.gradeClass.trim();
    const section = input.section.trim().toUpperCase() || 'A';
    const rollNumber = input.rollNumber.trim();

    if (!name || !gradeClass || !rollNumber) {
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
  let studentId: number;

  try {
    const name = typeof data?.name === 'string' ? data.name.trim() : '';
    const rollNumber = typeof data?.rollNumber === 'string' ? data.rollNumber.trim() : '';
    const gradeClass = typeof data?.gradeClass === 'string' ? data.gradeClass.trim() : '';
    const section = typeof data?.section === 'string' ? data.section.trim().toUpperCase() || 'A' : 'A';

    if (!name || !gradeClass || !rollNumber) {
      return { success: false, message: 'All fields are required.' };
    }

    if (name.length < 2 || name.length > 50 || !/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(name)) {
      return { success: false, message: 'Invalid name. Use 2 to 50 letters and spaces only.' };
    }

    if (!/^(?:[1-9]|1[0-2])$/.test(gradeClass)) {
      return { success: false, message: 'Invalid grade/class. Please enter a number between 1 and 12.' };
    }

    if (!/^[A-Z0-9]{1,3}$/.test(section)) {
      return { success: false, message: 'Invalid section. Use 1 to 3 uppercase letters or numbers.' };
    }

    if (!/^[1-9]\d{0,3}$/.test(rollNumber)) {
      return { success: false, message: 'Invalid roll number. Please enter a number between 1 and 9999.' };
    }

    const existingStudent = await prisma.student.findFirst({
      where: { rollNumber, gradeClass, section },
      include: { submission: true },
    });

    if (existingStudent?.submission) {
      return {
        success: false,
        message: `Roll Number ${rollNumber} in Class ${gradeClass} has already completed this exam. Please check your roll number or contact the supervisor.`,
      };
    }

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

    studentId = student.id;
  } catch (error: unknown) {
    return { success: false, message: handleServerError(error, 'registerStudentAction') };
  }

  logger.action('registerStudentAction', `Student #${studentId} registered`);
  redirect('/test');
  return { success: true, studentId: String(studentId) };
}