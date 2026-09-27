'use client';

import { DragEvent, useState } from 'react';
import { parseDocumentAction } from '@/actions/admin';
import type { ParsedQuestion } from '@/lib/parser';
import ParsedQuestionsPreview from './ParsedQuestionsPreview';
import type { QuestionInput } from '@/actions/admin';

function toQuestionInput(question: ParsedQuestion): QuestionInput {
  return {
    questionText: question.questionText,
    optionA: question.optionA,
    optionB: question.optionB,
    optionC: question.optionC,
    optionD: question.optionD,
    correctOption: question.correctAnswer,
    subject: question.subject,
    gradeClass: question.gradeClass,
    difficulty: question.difficulty,
    marks: question.marks,
  };
}

export default function DocumentQuestionImporter() {
  const [questions, setQuestions] = useState<QuestionInput[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function parseFile(file: File) {
    const extension = file.name.toLowerCase().split('.').pop();
    if (!extension || !['pdf', 'docx', 'txt'].includes(extension)) {
      setStatus('Only PDF, DOCX, and TXT files are supported.');
      return;
    }

    setIsParsing(true);
    setStatus(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await parseDocumentAction(formData);
      if (result.success) {
        setQuestions(result.questions.map(toQuestionInput));
      } else {
        setQuestions([]);
        setStatus(result.message || 'No questions could be parsed from this document.');
      }
    } catch {
      setStatus('Unable to read this document. Please check the file and try again.');
    } finally {
      setIsParsing(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void parseFile(file);
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${isDragging ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300 bg-slate-50'}`}
      >
        <p className="font-semibold text-slate-800">Drop a PDF, Word document, or text file here</p>
        <p className="mt-1 text-sm text-slate-500">Questions must include A-D options. Correct answers may use *A) or Answer: A.</p>
        <label className="mt-4 inline-block cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          {isParsing ? 'Parsing...' : 'Choose Document'}
          <input type="file" accept=".pdf,.docx,.txt" disabled={isParsing} onChange={(event) => { const file = event.target.files?.[0]; if (file) void parseFile(file); }} className="sr-only" />
        </label>
      </div>
      {status && <p className="text-sm font-medium text-red-600">{status}</p>}
      {questions.length > 0 && <ParsedQuestionsPreview questions={questions} onSaved={() => { setQuestions([]); setStatus('Questions saved.'); }} />}
    </div>
  );
}
