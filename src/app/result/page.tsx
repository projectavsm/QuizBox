import { prisma } from '@/lib/prisma';
import FinishExamButton from '@/components/exam/FinishExamButton';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ResultPage() {
  const sessionValue = (await cookies()).get('student_session')?.value;
  if (!sessionValue) redirect('/');

  let studentId: number;
  try {
    studentId = (JSON.parse(sessionValue) as { studentId: number }).studentId;
  } catch {
    redirect('/');
  }

  const submission = await prisma.submission.findUnique({
    where: { studentId },
    include: { student: true },
  });
  if (!submission) redirect('/test');

  return (
    <main className="flex min-h-screen items-center justify-center overflow-x-hidden bg-slate-950 p-4 text-white sm:p-8">
      <section className="w-full max-w-xl space-y-8 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl sm:p-10">
        <header className="space-y-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">QuizBox Complete</p>
          <h1 className="text-3xl font-extrabold sm:text-4xl">🎉 Exam Submitted Successfully!</h1>
          <p className="text-slate-300">Your responses have been recorded.</p>
        </header>

        <dl className="divide-y divide-slate-700 rounded-xl border border-slate-700 bg-slate-950/50">
          <div className="flex items-center justify-between gap-4 p-4"><dt className="text-sm text-slate-400">Student Name</dt><dd className="text-right font-semibold">{submission.student.name}</dd></div>
          <div className="flex items-center justify-between gap-4 p-4"><dt className="text-sm text-slate-400">Roll Number</dt><dd className="text-right font-semibold">{submission.student.rollNumber}</dd></div>
          <div className="flex items-center justify-between gap-4 p-4"><dt className="text-sm text-slate-400">Grade/Class</dt><dd className="text-right font-semibold">{submission.student.gradeClass}</dd></div>
          <div className="flex items-center justify-between gap-4 p-4"><dt className="text-sm text-slate-400">Submission Time</dt><dd className="text-right font-semibold">{submission.submittedAt.toLocaleString()}</dd></div>
        </dl>

        <FinishExamButton />
      </section>
    </main>
  );
}