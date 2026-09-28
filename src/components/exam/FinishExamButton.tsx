'use client';

import { finishStudentSessionAction } from '@/actions/student';

export default function FinishExamButton() {
  function clearExamTimer() {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith('quizbox_exam_end_time_'))
      .forEach((key) => window.localStorage.removeItem(key));
  }

  return (
    <form action={finishStudentSessionAction} onSubmit={clearExamTimer}>
      <button type="submit" className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-500">
        Finish &amp; Return Home
      </button>
    </form>
  );
}