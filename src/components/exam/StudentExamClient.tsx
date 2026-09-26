'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ExamHeader from './ExamHeader';
import QuestionView from './QuestionView';
import QuestionPalette from './QuestionPalette';
import NavigationControls from './NavigationControls';
import { submitExamAction } from '@/actions/exam';

interface Question {
  id: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

interface StudentExamClientProps {
  initialQuestions: Question[];
  durationMinutes: number;
  examTitle: string;
  studentId: number;
}

export default function StudentExamClient({
  initialQuestions,
  durationMinutes,
  examTitle,
  studentId,
}: StudentExamClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});

  const currentQuestion = initialQuestions[currentIndex];
  const questionIds = initialQuestions.map((q) => q.id);

  const handleSelectOption = (option: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }));
  };

  const handleToggleMarkForReview = () => {
    if (!currentQuestion) return;
    setMarkedForReview((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  };

  const handleSubmitExam = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await submitExamAction({
        answers,
        studentId: String(studentId),
      });
      if (res.success) {
        window.location.replace('/result');
      } else {
        console.error('Submission failed:', res.message);
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Submit redirect fallback:', err);
      window.location.replace('/result');
    }
  }, [answers, isSubmitting, studentId]);

  if (!initialQuestions || initialQuestions.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-white rounded-xl border border-gray-200 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">No Questions Available</h2>
        <p className="text-gray-600">There are currently no questions published for this exam.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ExamHeader
        examTitle={examTitle}
        durationMinutes={durationMinutes}
        onTimeUp={handleSubmitExam}
      />

      <div className="max-w-7xl mx-auto w-full px-4 py-6 flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 flex flex-col justify-between">
          <QuestionView
            question={currentQuestion}
            currentIndex={currentIndex}
            totalQuestions={initialQuestions.length}
            selectedOption={answers[currentQuestion.id] || null}
            onSelectOption={handleSelectOption}
          />

          <NavigationControls
            currentIndex={currentIndex}
            totalQuestions={initialQuestions.length}
            isMarked={!!markedForReview[currentQuestion.id]}
            onPrev={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            onNext={() => setCurrentIndex((prev) => Math.min(initialQuestions.length - 1, prev + 1))}
            onToggleMarkForReview={handleToggleMarkForReview}
            onSubmit={handleSubmitExam}
            isSubmitting={isSubmitting}
          />
        </div>

        <div className="lg:col-span-1">
          <QuestionPalette
            totalQuestions={initialQuestions.length}
            currentIndex={currentIndex}
            answers={answers}
            markedForReview={markedForReview}
            questionIds={questionIds}
            onSelectQuestion={(index) => setCurrentIndex(index)}
          />
        </div>
      </div>
    </div>
  );
}