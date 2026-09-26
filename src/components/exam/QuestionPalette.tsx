'use client';

interface QuestionPaletteProps {
  totalQuestions: number;
  currentIndex: number;
  answers: Record<number, string>;
  markedForReview: Record<number, boolean>;
  questionIds: number[];
  onSelectQuestion: (index: number) => void;
}

export default function QuestionPalette({
  totalQuestions,
  currentIndex,
  answers,
  markedForReview,
  questionIds,
  onSelectQuestion,
}: QuestionPaletteProps) {
  const getStatusColor = (index: number, qId: number) => {
    const isCurrent = index === currentIndex;
    const isAnswered = Boolean(answers[qId]);
    const isMarked = Boolean(markedForReview[qId]);

    if (isCurrent) return 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-1';
    if (isMarked) return 'bg-amber-500 text-white';
    if (isAnswered) return 'bg-emerald-600 text-white';
    return 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-base font-semibold text-gray-800 mb-4">Question Palette</h3>

      {/* Color Legend */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-600"></span>
          <span className="text-gray-600">Current</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
          <span className="text-gray-600">Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span className="text-gray-600">Marked</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gray-200 border"></span>
          <span className="text-gray-600">Unanswered</span>
        </div>
      </div>

      {/* Grid Palette */}
      <div className="grid grid-cols-5 gap-2 max-h-[320px] overflow-y-auto p-1">
        {Array.from({ length: totalQuestions }).map((_, idx) => {
          const qId = questionIds[idx];
          return (
            <button
              key={idx}
              onClick={() => onSelectQuestion(idx)}
              className={`h-9 w-9 rounded-lg font-medium text-sm flex items-center justify-center transition-all ${getStatusColor(
                idx,
                qId
              )}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}