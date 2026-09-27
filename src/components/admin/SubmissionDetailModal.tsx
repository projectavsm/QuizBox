'use client';

interface BreakdownItem {
  questionId: number;
  questionText: string;
  options: { A: string; B: string; C: string; D: string };
  correctOption: string;
  studentChoice: string | null;
  isCorrect: boolean;
  marks: number;
}

interface SubmissionDetailData {
  student: { name: string; gradeClass: string; section: string; rollNumber: string };
  score: number;
  total: number;
  breakdown: BreakdownItem[];
}

interface SubmissionDetailModalProps {
  data: SubmissionDetailData;
  onClose: () => void;
}

export default function SubmissionDetailModal({ data, onClose }: SubmissionDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="submission-detail-title">
      <div className="my-auto flex max-h-[94vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="submission-detail-title" className="text-lg font-bold text-slate-900 sm:text-xl">Answer Breakdown</h2>
              <p className="mt-1 break-words text-sm text-slate-600">{data.student.name} | Class {data.student.gradeClass} | Section {data.student.section} | Roll {data.student.rollNumber}</p>
            </div>
            <button type="button" onClick={onClose} className="text-2xl leading-none text-slate-500 hover:text-slate-900" aria-label="Close">&times;</button>
          </div>
          <p className="mt-4 text-lg font-bold text-indigo-700">Score: {data.score} / {data.total}</p>
        </div>
        <div className="space-y-3 overflow-y-auto p-4 sm:p-6">
          {data.breakdown.map((item, index) => (
            <article key={item.questionId} className={`rounded-lg border p-4 ${item.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <h3 className="font-semibold text-slate-900">{index + 1}. {item.questionText} <span className="text-xs font-normal text-slate-500">({item.marks} marks)</span></h3>
              <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                {(['A', 'B', 'C', 'D'] as const).map((option) => (
                  <p key={option} className={item.correctOption.toUpperCase() === option ? 'font-bold underline' : ''}>{option}. {item.options[option]}</p>
                ))}
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-800">Student: {item.studentChoice || 'Skipped'} | Correct: {item.correctOption}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
