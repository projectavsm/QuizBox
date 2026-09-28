'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerStudentAction } from '@/actions/student';

export default function HomePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const res = await registerStudentAction({
      name: String(formData.get('name') || ''),
      gradeClass: String(formData.get('gradeClass') || ''),
      section: String(formData.get('section') || ''),
      rollNumber: String(formData.get('rollNumber') || ''),
    });

    if (res.success && res.studentId) {
      localStorage.setItem('quizbox_student_id', res.studentId);
      router.push('/test');
      return;
    }

    setError(res.message || 'Failed to register student.');
    setIsSubmitting(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center overflow-x-hidden bg-gray-50 p-4 sm:p-6">
      <form onSubmit={handleRegister} className="w-full max-w-md space-y-5 rounded-lg border bg-white p-5 shadow-sm sm:p-6">
        <h1 className="text-2xl font-bold">QuizBox Registration</h1>
        <label className="block text-sm font-medium">Full Name<input required name="name" type="text" className="mt-1 w-full rounded border p-3" /></label>
        <label className="block text-sm font-medium">Grade/Class<input required name="gradeClass" type="text" className="mt-1 w-full rounded border p-3" /></label>
        <label className="block text-sm font-medium">Section<input required name="section" type="text" className="mt-1 w-full rounded border p-3" /></label>
        <label className="block text-sm font-medium">Roll Number<input required name="rollNumber" type="text" className="mt-1 w-full rounded border p-3" /></label>
        {error && <p role="alert" aria-live="polite" className="rounded border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
        <button disabled={isSubmitting} type="submit" className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">
          {isSubmitting ? 'Registering...' : 'Start Exam'}
        </button>
      </form>
    </main>
  );
}