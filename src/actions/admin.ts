'use server';

import { prisma } from '@/lib/prisma';
import { parseCSV, parseFormattedText } from '@/lib/parser';
import { revalidatePath } from 'next/cache';

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

export async function updateExamSettingsAction(formData: FormData) {
  const durationMinutes = parseInt(formData.get('durationMinutes') as string) || 30;
  const examTitle = (formData.get('examTitle') as string) || 'QuizBox Assessment';
  const isExamActive = formData.get('isExamActive') === 'on';

  const existing = await prisma.settings.findFirst();

  if (existing) {
    await prisma.settings.update({
      where: { id: existing.id },
      data: { durationMinutes, examTitle, isExamActive },
    });
  } else {
    await prisma.settings.create({
      data: { durationMinutes, examTitle, isExamActive },
    });
  }

  revalidatePath('/');
}