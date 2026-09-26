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
    <main className="min-h-screen bg-gray-50 p-6">
      <form onSubmit={handleRegister} className="mx-auto max-w-md space-y-5 rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">QuizBox Registration</h1>
        <label className="block text-sm font-medium">Full Name<input required name="name" type="text" className="mt-1 w-full rounded border p-2" /></label>
        <label className="block text-sm font-medium">Grade/Class<input required name="gradeClass" type="text" className="mt-1 w-full rounded border p-2" /></label>
        <label className="block text-sm font-medium">Section<input required name="section" type="text" className="mt-1 w-full rounded border p-2" /></label>
        <label className="block text-sm font-medium">Roll Number<input required name="rollNumber" type="text" className="mt-1 w-full rounded border p-2" /></label>
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <button disabled={isSubmitting} type="submit" className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">
          {isSubmitting ? 'Registering...' : 'Start Exam'}
        </button>
      </form>
    </main>
  );
}