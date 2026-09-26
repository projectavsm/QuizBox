'use client';

import { useMemo, useState } from 'react';

export interface SubmissionRow {
  id: number;
  name: string;
  gradeClass: string;
  section: string;
  rollNumber: string;
  score: number;
  total: number;
  submittedAt: string;
}

export default function SubmissionTable({ submissions }: { submissions: SubmissionRow[] }) {
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');

  const classes = useMemo(
    () => Array.from(new Set(submissions.map((submission) => submission.gradeClass))).sort(),
    [submissions],
  );
  const sections = useMemo(
    () => Array.from(new Set(submissions.map((submission) => submission.section))).sort(),
    [submissions],
  );
  const filteredSubmissions = submissions.filter(
    (submission) =>
      (!classFilter || submission.gradeClass === classFilter) &&
      (!sectionFilter || submission.section === sectionFilter),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select
          value={classFilter}
          onChange={(event) => setClassFilter(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
          aria-label="Filter by class"
        >
          <option value="">All Classes</option>
          {classes.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <select
          value={sectionFilter}
          onChange={(event) => setSectionFilter(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
          aria-label="Filter by section"
        >
          <option value="">All Sections</option>
          {sections.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </div>

      {filteredSubmissions.length === 0 ? (
        <p className="py-4 text-sm text-slate-500">No submissions match the selected filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                <th className="p-3 font-semibold">Student Name</th>
                <th className="p-3 font-semibold">Class / Grade</th>
                <th className="p-3 font-semibold">Section</th>
                <th className="p-3 font-semibold">Roll No.</th>
                <th className="p-3 font-semibold">Score</th>
                <th className="p-3 font-semibold">Submitted At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredSubmissions.map((submission) => (
                <tr key={submission.id} className="transition-colors hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900">{submission.name}</td>
                  <td className="p-3">{submission.gradeClass}</td>
                  <td className="p-3">{submission.section}</td>
                  <td className="p-3">{submission.rollNumber}</td>
                  <td className="p-3 font-bold text-emerald-600">{submission.score} / {submission.total}</td>
                  <td className="p-3 text-xs text-slate-500">{new Date(submission.submittedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}