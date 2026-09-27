'use client';

import { useState } from 'react';
import { bulkAddQuestionsAction } from '@/actions/admin';
import type { QuestionInput } from '@/actions/admin';

interface ParsedQuestionsPreviewProps {
  questions: QuestionInput[];
  onSaved: () => void;
}

export default function ParsedQuestionsPreview({ questions: initialQuestions, onSaved }: ParsedQuestionsPreviewProps) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  function updateQuestion(index: number, field: keyof QuestionInput, value: string | number) {
    setQuestions((current) => current.map((question, questionIndex) => questionIndex === index ? { ...question, [field]: value } as QuestionInput : question));
  }

  async function saveQuestions() {
    setIsSaving(true);
    setStatus(null);
    try {
      const result = await bulkAddQuestionsAction(questions);
      if (result.success) {
        setStatus(`${result.count} questions saved successfully.`);
        onSaved();
      } else {
        setStatus(result.message || 'Unable to save questions.');
      }
    } catch {
      setStatus('Unable to save questions. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  const inputClass = 'w-full min-w-0 rounded border border-slate-300 px-2 py-2 text-sm text-slate-900';

  return (
    <section className="min-w-0 space-y-4 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 sm:p-5" aria-labelledby="parsed-preview-title">
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <h2 id="parsed-preview-title" className="text-lg font-bold text-slate-900">Preview ({questions.length} questions)</h2>
        <button type="button" onClick={saveQuestions} disabled={isSaving} className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 sm:w-auto sm:py-2">
          {isSaving ? 'Saving...' : 'Save All to Database'}
        </button>
      </div>
      <div className="max-h-[560px] space-y-4 overflow-y-auto pr-1">
        {questions.map((question, index) => (
          <article key={index} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <label className="block text-sm font-semibold text-slate-700">Question {index + 1}
              <textarea rows={2} value={question.questionText} onChange={(event) => updateQuestion(index, 'questionText', event.target.value)} className={`${inputClass} mt-1`} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {(['optionA', 'optionB', 'optionC', 'optionD'] as const).map((field) => (
                <label key={field} className="text-sm font-medium text-slate-700">{field.slice(-1)}
                  <input value={question[field]} onChange={(event) => updateQuestion(index, field, event.target.value)} className={`${inputClass} mt-1`} />
                </label>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">Correct option
                <select value={question.correctOption} onChange={(event) => updateQuestion(index, 'correctOption', event.target.value)} className={`${inputClass} mt-1`}>
                  {['A', 'B', 'C', 'D'].map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">Difficulty
                <select value={question.difficulty} onChange={(event) => updateQuestion(index, 'difficulty', event.target.value)} className={`${inputClass} mt-1`}>
                  {['Easy', 'Medium', 'Hard'].map((value) => <option key={value}>{value}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">Marks
                <input type="number" min={0} step={0.5} value={question.marks} onChange={(event) => updateQuestion(index, 'marks', Number(event.target.value))} className={`${inputClass} mt-1`} />
              </label>
            </div>
          </article>
        ))}
      </div>
      {status && <p className="text-sm font-semibold text-indigo-700">{status}</p>}
    </section>
  );
}
