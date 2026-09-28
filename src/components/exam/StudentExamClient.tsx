'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ExamHeader from './ExamHeader';
import QuestionView from './QuestionView';
import QuestionPalette from './QuestionPalette';
import NavigationControls from './NavigationControls';
import { submitExamAction } from '@/actions/exam';

interface Question {
  id: number;
  questionText: string;
  imageUrl?: string | null;
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
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        setTabSwitchCount((count) => {
          const nextCount = count + 1;
          console.warn(`QuizBox exam tab switch detected (${nextCount}).`);
          return nextCount;
        });
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

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
      <div className="mx-auto my-8 w-full max-w-xl rounded-xl border border-gray-200 bg-white p-5 text-center sm:my-12 sm:p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">No Questions Available</h2>
        <p className="text-gray-600">There are currently no questions published for this exam.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-gray-50">
      <ExamHeader
        examTitle={examTitle}
        durationMinutes={durationMinutes}
        onTimeUp={handleSubmitExam}
      />

      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:grid-cols-4 lg:px-8">
        <div className="flex min-w-0 flex-col justify-between lg:col-span-3">
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

        <div className="min-w-0 lg:col-span-1">
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