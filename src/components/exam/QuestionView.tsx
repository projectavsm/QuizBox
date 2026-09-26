'use client';

interface Question {
  id: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

interface QuestionViewProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  selectedOption: string | null;
  onSelectOption: (option: string) => void;
}

export default function QuestionView({
  question,
  currentIndex,
  totalQuestions,
  selectedOption,
  onSelectOption,
}: QuestionViewProps) {
  const options = [
    { key: 'A', text: question.optionA },
    { key: 'B', text: question.optionB },
    { key: 'C', text: question.optionC },
    { key: 'D', text: question.optionD },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          Question {currentIndex + 1} of {totalQuestions}
        </span>
      </div>

      <h2 className="text-lg font-medium text-gray-900 mb-6 leading-relaxed">
        {question.questionText}
      </h2>

      <div className="space-y-3">
        {options.map((opt) => {
          const isSelected = selectedOption === opt.key;
          return (
            <label
              key={opt.key}
              onClick={() => onSelectOption(opt.key)}
              className={`flex items-start p-4 rounded-lg border cursor-pointer transition-all ${
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
                onChange={() => onSelectOption(opt.key)}
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