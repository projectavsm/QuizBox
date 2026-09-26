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
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{examTitle}</h1>
          {studentInfo?.name && (
            <p className="text-sm text-gray-500">
              Student: <span className="font-medium text-gray-700">{studentInfo.name}</span>
              {studentInfo.rollNumber && ` (Roll: ${studentInfo.rollNumber})`}
            </p>
          )}
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-mono text-lg font-bold ${
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