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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mt-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirst}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Previous
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={isLast}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Next
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleMarkForReview}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
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
          className="px-5 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Exam'}
        </button>
      </div>
    </div>
  );
}