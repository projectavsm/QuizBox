import { prisma } from '@/lib/prisma';
import SubmissionTable, { SubmissionRow } from './SubmissionTable';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const [totalQuestions, totalSubmissions, settings, submissions] = await Promise.all([
    prisma.question.count(),
    prisma.submission.count(),
    prisma.settings.findFirst(),
    prisma.submission.findMany({
      include: { student: true },
      orderBy: { submittedAt: 'desc' },
    }),
  ]);

  const submissionRows: SubmissionRow[] = submissions.map((submission) => ({
    id: submission.id,
    name: submission.student.name,
    gradeClass: submission.student.gradeClass,
    section: submission.student.section,
    rollNumber: submission.student.rollNumber,
    score: submission.score,
    total: submission.total,
    submittedAt: submission.submittedAt.toISOString(),
  }));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 overflow-x-hidden px-4 py-6 text-slate-900 sm:space-y-8 sm:px-6 lg:px-8">
      <h1 className="text-xl font-bold text-white sm:text-2xl">QuizBox Admin Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Questions</p>
          <p className="text-3xl font-extrabold text-indigo-600">{totalQuestions}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Submissions</p>
          <p className="text-3xl font-extrabold text-emerald-600">{totalSubmissions}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Exam Duration</p>
          <p className="text-3xl font-extrabold text-purple-600">{settings?.durationMinutes || 30} mins</p>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col items-start gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-900">Student Submissions</h2>
        </div>
        <SubmissionTable submissions={submissionRows} />
      </div>
    </div>
  );
}