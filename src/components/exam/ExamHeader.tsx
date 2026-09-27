'use client';

import { useEffect, useState } from 'react';

interface ExamHeaderProps {
  examTitle: string;
  durationMinutes: number;
  onTimeUp: () => void;
  studentInfo?: { name?: string; rollNumber?: string };
}

export default function ExamHeader({
  examTitle,
  durationMinutes,
  onTimeUp,
  studentInfo,
}: ExamHeaderProps) {
  const [timeLeft, setTimeLeft] = useState<number>(durationMinutes * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isWarning = timeLeft < 300; // Less than 5 minutes

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0">
          <h1 className="break-words text-lg font-bold text-gray-800 sm:text-xl">{examTitle}</h1>
          {studentInfo?.name && (
            <p className="break-words text-sm text-gray-500">
              Student: <span className="font-medium text-gray-700">{studentInfo.name}</span>
              {studentInfo.rollNumber && ` (Roll: ${studentInfo.rollNumber})`}
            </p>
          )}
        </div>

        <div className={`flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-3 font-mono text-base font-bold sm:w-auto sm:px-4 sm:py-2 sm:text-lg ${
          isWarning 
            ? 'bg-red-50 border-red-300 text-red-600 animate-pulse' 
            : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          <span>Time Remaining:</span>
          <span>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
      </div>
    </header>
  );
}