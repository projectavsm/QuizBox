'use client';

import { useCallback, useEffect, useState } from 'react';
import { submitExamAction } from '@/actions/exam';
import { shuffleArray } from '@/lib/utils';
import NavigationControls from './NavigationControls';
import QuestionPalette from './QuestionPalette';
import QuestionView from './QuestionView';

interface Question { id: number; questionText: string; imageUrl?: string | null; optionA: string; optionB: string; optionC: string; optionD: string; }
interface StudentExamClientProps { initialQuestions: Question[]; durationMinutes: number; examTitle: string; studentId: number; }
interface DisplayOption { key: 'A' | 'B' | 'C' | 'D'; text: string; }

export default function StudentExamClient({ initialQuestions, durationMinutes, examTitle, studentId }: StudentExamClientProps) {
  const endTimeStorageKey = `quizbox_exam_end_time_${studentId}`;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [displayOptions, setDisplayOptions] = useState<Record<number, DisplayOption[]>>({});
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
  const [warningCount, setWarningCount] = useState(0);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(durationMinutes * 60);

  useEffect(() => {
    const shuffledQuestions = shuffleArray(initialQuestions);
    const optionsByQuestion: Record<number, DisplayOption[]> = {};
    shuffledQuestions.forEach((question) => {
      optionsByQuestion[question.id] = shuffleArray([
        { key: 'A' as const, text: question.optionA },
        { key: 'B' as const, text: question.optionB },
        { key: 'C' as const, text: question.optionC },
        { key: 'D' as const, text: question.optionD },
      ]);
    });
    setQuestions(shuffledQuestions);
    setDisplayOptions(optionsByQuestion);

    const storedEndTime = window.localStorage.getItem(endTimeStorageKey);
    const parsedEndTime = storedEndTime ? Number.parseInt(storedEndTime, 10) : Number.NaN;
    const nextEndTime = Number.isFinite(parsedEndTime) ? parsedEndTime : Date.now() + durationMinutes * 60 * 1000;
    window.localStorage.setItem(endTimeStorageKey, nextEndTime.toString());
    setEndTime(nextEndTime);
    setRemainingSeconds(Math.max(0, Math.floor((nextEndTime - Date.now()) / 1000)));
  }, [durationMinutes, initialQuestions]);

  const handleSubmitExam = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await submitExamAction({ answers, studentId: String(studentId), warningCount });
      if (result.success) {
        window.localStorage.removeItem(endTimeStorageKey);
        window.location.replace('/result');
      } else {
        console.error('Submission failed:', result.message);
        setIsSubmitting(false);
        setIsAutoSubmitting(false);
      }
    } catch (error) {
      console.error('Submission failed:', error);
      window.localStorage.removeItem(endTimeStorageKey);
      window.location.replace('/result');
    }
  }, [answers, isSubmitting, studentId, warningCount]);

  useEffect(() => {
    if (!endTime || !isExamStarted || isSubmitting) return;
    let interval: number;
    const updateTimer = () => {
      const nextRemainingSeconds = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setRemainingSeconds(nextRemainingSeconds);
      if (nextRemainingSeconds === 0) {
        setIsAutoSubmitting(true);
        window.clearInterval(interval);
        void handleSubmitExam();
      }
    };
    interval = window.setInterval(updateTimer, 1000);
    updateTimer();
    return () => window.clearInterval(interval);
  }, [endTime, handleSubmitExam, isExamStarted, isSubmitting]);

  useEffect(() => {
    if (!isExamStarted || isSubmitting) return;
    const logWarning = (message: string) => { setWarningCount((count) => count + 1); setWarningMessage(message); };
    const handleVisibilityChange = () => { if (document.hidden) logWarning('Warning: Leaving the exam tab has been logged!'); };
    const handleWindowBlur = () => logWarning('Warning: Leaving the exam window has been logged!');
    const handleFullscreenChange = () => {
      const fullscreen = Boolean(document.fullscreenElement);
      setIsFullscreen(fullscreen);
      if (!fullscreen) logWarning('You have exited fullscreen mode. Click below to return to the exam.');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isExamStarted, isSubmitting]);

  useEffect(() => {
    if (!warningMessage) return;
    const timeout = window.setTimeout(() => setWarningMessage(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [warningMessage]);

  async function enterFullscreen() {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch {
      setIsFullscreen(false);
      setWarningMessage('Fullscreen could not be enabled. Please allow fullscreen for this exam.');
    }
  }

  function startExam() { setIsExamStarted(true); void enterFullscreen(); }

  if (!initialQuestions.length) return <div className="mx-auto my-8 w-full max-w-xl rounded-xl border border-gray-200 bg-white p-5 text-center"><h2 className="text-xl font-bold text-gray-800">No Questions Available</h2><p className="mt-2 text-gray-600">There are currently no questions published for this exam.</p></div>;
  if (!isExamStarted) return <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white"><section className="w-full max-w-xl space-y-5 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl sm:p-8"><p className="text-sm font-semibold uppercase tracking-wider text-indigo-300">QuizBox Examination</p><h1 className="text-3xl font-bold">{examTitle}</h1><p className="text-slate-300">You have {durationMinutes} minutes to complete {initialQuestions.length} questions. Your exam activity is monitored.</p><button type="button" onClick={startExam} className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-500">Start Exam &amp; Enter Fullscreen</button></section></main>;

  const currentQuestion = questions[currentIndex];
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const options = displayOptions[currentQuestion.id] || [];

  return <div className="flex min-h-screen flex-col overflow-x-hidden bg-gray-50">
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-6"><div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4"><div className="min-w-0"><h1 className="break-words text-lg font-bold text-gray-800 sm:text-xl">{examTitle}</h1><p className="text-sm text-gray-500">Exam in progress</p></div><div className={`shrink-0 rounded-lg border px-3 py-2 font-mono text-base font-bold sm:px-4 sm:text-lg ${remainingSeconds < 300 ? 'border-red-300 bg-red-50 text-red-600' : 'border-blue-200 bg-blue-50 text-blue-700'}`} aria-live="polite">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</div></div></header>
    {warningMessage && <div role="alert" className="fixed right-4 top-20 z-[60] max-w-sm rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 shadow-lg">{warningMessage}</div>}
    {!isFullscreen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"><div className="w-full max-w-md rounded-xl bg-white p-6 text-center shadow-2xl"><h2 className="text-xl font-bold text-slate-900">You have exited fullscreen mode.</h2><p className="mt-2 text-slate-600">Click below to return to the exam.</p><button type="button" onClick={() => void enterFullscreen()} className="mt-5 rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700">Return to Fullscreen</button></div></div>}
    {isAutoSubmitting && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4"><div className="rounded-xl bg-white p-6 text-center shadow-2xl"><p className="font-semibold text-slate-900">Time is up. Submitting your exam...</p></div></div>}
    <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:grid-cols-4 lg:px-8"><div className="flex min-w-0 flex-col justify-between lg:col-span-3"><QuestionView question={currentQuestion} displayOptions={options} currentIndex={currentIndex} totalQuestions={questions.length} selectedOption={answers[currentQuestion.id] || null} onSelectOption={(option) => setAnswers((previous) => ({ ...previous, [currentQuestion.id]: option }))} /><NavigationControls currentIndex={currentIndex} totalQuestions={questions.length} isMarked={!!markedForReview[currentQuestion.id]} onPrev={() => setCurrentIndex((previous) => Math.max(0, previous - 1))} onNext={() => setCurrentIndex((previous) => Math.min(questions.length - 1, previous + 1))} onToggleMarkForReview={() => setMarkedForReview((previous) => ({ ...previous, [currentQuestion.id]: !previous[currentQuestion.id] }))} onSubmit={() => void handleSubmitExam()} isSubmitting={isSubmitting || isAutoSubmitting} /></div><div className="min-w-0 lg:col-span-1"><QuestionPalette totalQuestions={questions.length} currentIndex={currentIndex} answers={answers} markedForReview={markedForReview} questionIds={questions.map((question) => question.id)} onSelectQuestion={setCurrentIndex} /></div></div>
  </div>;
}