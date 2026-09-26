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
    <div className="space-y-8 p-6 text-slate-900">
      <h1 className="text-2xl font-bold text-white">QuizBox Admin Dashboard</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h2 className="text-lg font-bold text-slate-900">Student Submissions</h2>
        </div>
        <SubmissionTable submissions={submissionRows} />
      </div>
    </div>
  );
}