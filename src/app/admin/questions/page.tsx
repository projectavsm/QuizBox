import { prisma } from '@/lib/prisma';
import QuestionUploadTabs from './QuestionUploadTabs';

export default async function AdminQuestionsPage() {
  const questions = await prisma.question.findMany();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-xl font-bold sm:text-2xl">Manage Questions ({questions.length})</h1>
      <QuestionUploadTabs />
      
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h3 className="font-bold text-slate-900 text-base">
              {idx + 1}. {q.questionText}
            </h3>
            <div className="grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-2">
              <p><span className="font-semibold text-slate-900">A:</span> {q.optionA}</p>
              <p><span className="font-semibold text-slate-900">B:</span> {q.optionB}</p>
              <p><span className="font-semibold text-slate-900">C:</span> {q.optionC}</p>
              <p><span className="font-semibold text-slate-900">D:</span> {q.optionD}</p>
            </div>
            <p className="text-xs font-bold text-emerald-600">Correct Answer: {q.correctOption}</p>
          </div>
        ))}
      </div>
    </div>
  );
}