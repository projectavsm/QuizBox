'use client';

interface Question {
  id: number;
  questionText: string;
  imageUrl?: string | null;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

interface DisplayOption {
  key: 'A' | 'B' | 'C' | 'D';
  sourceKey: 'A' | 'B' | 'C' | 'D';
  text: string;
}

interface QuestionViewProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  selectedOption: string | null;
  onSelectOption: (option: string) => void;
  displayOptions?: DisplayOption[];
}

export default function QuestionView({
  question,
  currentIndex,
  totalQuestions,
  selectedOption,
  onSelectOption,
  displayOptions,
}: QuestionViewProps) {
  const options = displayOptions || [
    { key: 'A', sourceKey: 'A', text: question.optionA },
    { key: 'B', sourceKey: 'B', text: question.optionB },
    { key: 'C', sourceKey: 'C', text: question.optionC },
    { key: 'D', sourceKey: 'D', text: question.optionD },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full sm:text-sm">
          Question {currentIndex + 1} of {totalQuestions}
        </span>
      </div>

      <h2 className="mb-5 break-words text-base font-medium leading-relaxed text-gray-900 sm:mb-6 sm:text-lg">
        {question.questionText}
      </h2>

      {question.imageUrl && (
        <div className="my-4 flex justify-center">
          <img
            src={question.imageUrl}
            alt="Question Diagram"
            className="max-h-64 rounded-lg border object-contain"
          />
        </div>
      )}

      <div className="space-y-3">
        {options.map((opt) => {
          const isSelected = selectedOption === opt.sourceKey;
          return (
            <label
              key={opt.key}
              onClick={() => onSelectOption(opt.sourceKey)}
              className={`flex w-full items-start rounded-xl border p-4 text-left transition active:scale-[0.98] ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={opt.key}
                checked={isSelected}
                onChange={() => onSelectOption(opt.sourceKey)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-3 text-sm font-medium text-gray-800">
                <strong className="mr-2 text-gray-500">{opt.key}.</strong>
                {opt.text}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}