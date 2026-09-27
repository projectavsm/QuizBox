'use client';

interface NavigationControlsProps {
  currentIndex: number;
  totalQuestions: number;
  isMarked: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToggleMarkForReview: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export default function NavigationControls({
  currentIndex,
  totalQuestions,
  isMarked,
  onPrev,
  onNext,
  onToggleMarkForReview,
  onSubmit,
  isSubmitting = false,
}: NavigationControlsProps) {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalQuestions - 1;

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-4">
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirst}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:px-4 sm:py-2"
        >
          Previous
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={isLast}
          className="flex-1 rounded-lg bg-blue-600 px-3 py-3 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:px-4 sm:py-2"
        >
          Next
        </button>
      </div>

      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onToggleMarkForReview}
          className={`w-full rounded-lg border px-4 py-3 text-sm font-medium transition-all sm:w-auto sm:py-2 ${
            isMarked
              ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600'
              : 'border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100'
          }`}
        >
          {isMarked ? 'Unmark Review' : 'Mark for Review'}
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50 sm:w-auto sm:py-2"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Exam'}
        </button>
      </div>
    </div>
  );
}