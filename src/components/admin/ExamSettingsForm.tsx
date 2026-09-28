'use client';

import { FormEvent, useState } from 'react';
import { updateExamSettingsAction } from '@/actions/admin';

interface ExamSettingsFormProps {
  settings: { examTitle: string; durationMinutes: number; isExamActive: boolean } | null;
}

export default function ExamSettingsForm({ settings }: ExamSettingsFormProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setStatus(null);
    const formData = new FormData(event.currentTarget);
    const result = await updateExamSettingsAction({
      examTitle: String(formData.get('examTitle') || ''),
      durationMinutes: Number(formData.get('durationMinutes')),
      isExamActive: formData.get('isExamActive') === 'on',
    });
    setStatus(result.success ? 'Settings saved.' : result.message || 'Unable to save settings.');
    setIsSaving(false);
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6" aria-labelledby="exam-settings-title">
      <div>
        <h2 id="exam-settings-title" className="text-lg font-bold text-slate-900">Exam Settings</h2>
        <p className="text-sm text-slate-500">Set the title and duration used when a student starts an exam.</p>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px_auto] sm:items-end">
        <label className="text-sm font-semibold text-slate-700">Exam title
          <input name="examTitle" defaultValue={settings?.examTitle || 'QuizBox Examination'} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" />
        </label>
        <label className="text-sm font-semibold text-slate-700">Duration (minutes)
          <input name="durationMinutes" type="number" min="1" required defaultValue={settings?.durationMinutes ?? 30} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" />
        </label>
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input name="isExamActive" type="checkbox" defaultChecked={settings?.isExamActive ?? true} className="h-4 w-4" />
            Exam active
          </label>
          <button type="submit" disabled={isSaving} className="mt-3 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{isSaving ? 'Saving...' : 'Save Settings'}</button>
        </div>
      </form>
      {status && <p className="text-sm font-semibold text-indigo-700" role="status">{status}</p>}
    </section>
  );
}