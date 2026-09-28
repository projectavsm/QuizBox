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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  function updateField(field: keyof QuestionInput, value: string | number) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function closeModal() {
    if (uploading) return;
    setForm(initialForm);
    setImageFile(null);
    setError(null);
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setUploading(true);
    setError(null);

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const response = await fetch('/api/admin/upload-image', { method: 'POST', body: formData });
        const data = await response.json() as { success?: boolean; imageUrl?: string; message?: string; error?: string };
        if (!response.ok || !data.success || !data.imageUrl) {
          throw new Error(data.message || data.error || 'Failed to upload image.');
        }
        imageUrl = data.imageUrl;
      }

      const result = await addSingleQuestionAction({ ...form, imageUrl });
      if (result.success) {
        setForm(initialForm);
        setImageFile(null);
        onClose();
      } else {
        setError('Unable to add the question.');
      }
    } catch {
      setError('Unable to add the question. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploading(false);
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
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Question Diagram / Image (Optional)</label>
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(event) => setImageFile(event.target.files?.[0] || null)}
            className="w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
          />
          {imageFile && <p className="mt-1 text-xs text-gray-500">Selected: <span className="font-medium text-gray-700">{imageFile.name}</span></p>}
        </div>
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
          <button type="button" onClick={closeModal} disabled={uploading} className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50 sm:w-auto sm:py-2">Cancel</button>
          <button type="submit" disabled={isSubmitting || uploading} className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 sm:w-auto sm:py-2">{uploading ? 'Uploading...' : 'Add Question'}</button>
        </div>
      </form>
    </div>
  );
}
