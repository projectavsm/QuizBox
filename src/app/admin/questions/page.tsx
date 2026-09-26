import { prisma } from '@/lib/prisma';
import QuestionUploadTabs from './QuestionUploadTabs';

export default async function AdminQuestionsPage() {
  const questions = await prisma.question.findMany();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Manage Questions ({questions.length})</h1>
      <QuestionUploadTabs />
      
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-base">
              {idx + 1}. {q.questionText}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-slate-700">
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