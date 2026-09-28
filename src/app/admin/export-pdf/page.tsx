'use client';

import { useEffect, useState } from 'react';

type Result = {
  id: number;
  name: string;
  gradeClass: string;
  section: string;
  rollNumber: string;
  score: number;
  total: number;
  percentage: number;
  submittedAt: string;
};

type Summary = { totalStudents: number; averageScore: number; passRate: number; results: Result[] };

export default function ExportPdfPage() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    void fetch('/api/admin/results-summary').then((response) => response.json()).then(setSummary);
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 bg-white p-4 text-slate-900 sm:p-8 print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <div><p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">QuizBox</p><h1 className="text-2xl font-bold">Executive Results Summary</h1></div>
        <button type="button" onClick={() => window.print()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Print / Save as PDF</button>
      </div>
      <div className="hidden print:block"><h1 className="text-2xl font-bold">QuizBox Results Summary</h1><p className="text-sm text-slate-500">Generated {new Date().toLocaleDateString()}</p></div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['Total Students', summary?.totalStudents ?? 0], ['Average Score', `${(summary?.averageScore ?? 0).toFixed(1)}%`], ['Pass Percentage', `${(summary?.passRate ?? 0).toFixed(1)}%`], ['Completed', summary?.results.length ?? 0]].map(([label, value]) => (
          <div key={String(label)} className="rounded-lg border border-slate-200 p-4 print:rounded-none"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-indigo-700">{value}</p></div>
        ))}
      </div>

      <div className="overflow-x-auto"><table className="w-full min-w-[720px] border-collapse text-sm"><thead><tr className="border-b-2 border-slate-300 text-left"><th className="p-2">Student</th><th className="p-2">Class</th><th className="p-2">Roll Number</th><th className="p-2">Score</th><th className="p-2">Percentage</th><th className="p-2">Submitted</th></tr></thead><tbody>{summary?.results.map((result) => <tr key={result.id} className="border-b border-slate-200"><td className="p-2">{result.name}</td><td className="p-2">{result.gradeClass} - {result.section}</td><td className="p-2">{result.rollNumber}</td><td className="p-2">{result.score} / {result.total}</td><td className="p-2">{result.percentage.toFixed(1)}%</td><td className="p-2">{new Date(result.submittedAt).toLocaleString()}</td></tr>)}</tbody></table></div>
    </main>
  );
}