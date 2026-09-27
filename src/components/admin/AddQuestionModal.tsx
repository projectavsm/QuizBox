'use client';

import { FormEvent, useState } from 'react';
import { addSingleQuestionAction, QuestionInput } from '@/actions/admin';

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialForm: QuestionInput = {
  questionText: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctOption: 'A',
  difficulty: 'Medium',
  marks: 1,
};

export default function AddQuestionModal({ isOpen, onClose }: AddQuestionModalProps) {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  function updateField(field: keyof QuestionInput, value: string | number) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await addSingleQuestionAction(form);
      if (result.success) {
        setForm(initialForm);
        onClose();
      } else {
        setError('Unable to add the question.');
      }
    } catch {
      setError('Unable to add the question. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="add-question-title">
      <form onSubmit={handleSubmit} className="my-auto max-h-[94vh] w-full max-w-2xl space-y-5 overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:p-6">
        <div className="flex items-center justify-between">
          <h2 id="add-question-title" className="text-xl font-bold text-slate-900">Add Question</h2>
          <button type="button" onClick={onClose} className="text-2xl leading-none text-slate-500 hover:text-slate-900" aria-label="Close">&times;</button>
        </div>

        <label className="block text-sm font-semibold text-slate-700">Question
          <textarea required rows={3} value={form.questionText} onChange={(event) => updateField('questionText', event.target.value)} className={`${inputClass} mt-1`} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          {(['optionA', 'optionB', 'optionC', 'optionD'] as const).map((field) => (
            <label key={field} className="block text-sm font-semibold text-slate-700">Option {field.slice(-1)}
              <input required value={form[field]} onChange={(event) => updateField(field, event.target.value)} className={`${inputClass} mt-1`} />
            </label>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-semibold text-slate-700">Correct answer
            <select value={form.correctOption} onChange={(event) => updateField('correctOption', event.target.value)} className={`${inputClass} mt-1`}>
              {['A', 'B', 'C', 'D'].map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">Difficulty
            <select value={form.difficulty} onChange={(event) => updateField('difficulty', event.target.value)} className={`${inputClass} mt-1`}>
              {['Easy', 'Medium', 'Hard'].map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">Marks
            <input required min={0} step={0.5} type="number" value={form.marks} onChange={(event) => updateField('marks', Number(event.target.value))} className={`${inputClass} mt-1`} />
          </label>
        </div>
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button type="button" onClick={onClose} className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 sm:w-auto sm:py-2">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 sm:w-auto sm:py-2">{isSubmitting ? 'Adding...' : 'Add Question'}</button>
        </div>
      </form>
    </div>
  );
}
