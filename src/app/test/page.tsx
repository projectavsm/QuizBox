import { prisma } from '@/lib/prisma';
import StudentExamClient from '@/components/exam/StudentExamClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function TestPage() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get('student_session')?.value;

  if (!sessionValue) redirect('/');

  let session: { studentId: number; name: string; rollNumber: string };
  try {
    session = JSON.parse(sessionValue);
  } catch {
    redirect('/');
  }

  const submission = await prisma.submission.findUnique({
    where: { studentId: session.studentId },
  });

  if (submission) redirect('/result');

  // Fetch settings for timer duration and exam title
  const [settings, questions] = await Promise.all([
    prisma.settings.findFirst(),
    prisma.question.findMany({
      select: { id: true, questionText: true, optionA: true, optionB: true, optionC: true, optionD: true },
      orderBy: { id: 'asc' },
    }),
  ]);

  return (
    <StudentExamClient
      initialQuestions={questions}
      durationMinutes={settings?.durationMinutes || 30}
      examTitle={settings?.examTitle || 'QuizBox Examination'}
      studentId={session.studentId}
    />
  );
}