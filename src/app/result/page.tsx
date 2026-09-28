import { prisma } from '@/lib/prisma';
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

  const submission = await prisma.submission.findUnique({ where: { studentId } });
  if (!submission) redirect('/test');

  let answersMap: Record<string, string> = {};
  try {
    const parsed = JSON.parse(submission.answersJson) as unknown;
    if (parsed && typeof parsed === 'object') answersMap = parsed as Record<string, string>;
  } catch {
    answersMap = {};
  }

  const questions = await prisma.question.findMany({ orderBy: { id: 'asc' } });
  const breakdown = questions.map((question) => {
    const studentChoice = answersMap[question.id] || answersMap[String(question.id)];
    const isSkipped = !studentChoice;
    const isCorrect = !isSkipped && studentChoice.toUpperCase() === question.correctOption.toUpperCase();
    return { question, studentChoice, isSkipped, isCorrect };
  });

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950 p-4 text-white sm:p-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">QuizBox Complete</p>
          <h1 className="mt-2 text-3xl font-extrabold">Test Submitted!</h1>
          <p className="mt-2 text-slate-300">Score: {submission.score} / {submission.total}</p>
        </header>
        <section className="space-y-3">
          {breakdown.map(({ question, studentChoice, isSkipped, isCorrect }, index) => (
            <article key={question.id} className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <h2 className="font-semibold">{index + 1}. {question.questionText}</h2>
              <p className="mt-2 text-sm text-slate-300">Your answer: {studentChoice || 'No answer'}</p>
              <p className={`mt-2 text-sm font-bold ${isSkipped ? 'text-amber-300' : isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                {isSkipped ? 'Skipped / No marks' : isCorrect ? 'Correct (+1)' : 'Incorrect'}
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}