'use client';

import { ChangeEvent, useState } from 'react';
import * as XLSX from 'xlsx';
import { bulkInsertCsvQuestionsAction } from '@/actions/admin';
import { CsvQuestion, generateSampleCsv, parseCsvQuestions, parseCsvRows } from '@/lib/csvParser';

export default function CsvExcelImporter() {
  const [questions, setQuestions] = useState<CsvQuestion[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isReading, setIsReading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  function downloadTemplate() {
    const blob = new Blob([generateSampleCsv()], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_quizbox_questions.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsReading(true);
    setErrors([]);
    setStatus(null);
    try {
      let result;
      if (file.name.toLowerCase().endsWith('.xlsx')) {
        const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        result = parseCsvRows(XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' }));
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        result = parseCsvQuestions(await file.text());
      } else {
        setStatus('Please choose a CSV or XLSX file.');
        return;
      }
      setQuestions(result.questions);
      setErrors(result.errors);
      if (!result.questions.length && !result.errors.length) setStatus('No questions found in the file.');
    } catch {
      setStatus('Unable to read this file. Check that it is a valid CSV or XLSX document.');
      setQuestions([]);
    } finally {
      setIsReading(false);
      event.target.value = '';
    }
  }

  async function saveQuestions() {
    setIsSaving(true);
    setStatus(null);
    try {
      const result = await bulkInsertCsvQuestionsAction(questions);
      if (result.success) {
        setStatus(`${result.count} questions imported successfully.`);
        setQuestions([]);
      } else {
        setStatus(result.message || 'Unable to import questions.');
      }
    } catch {
      setStatus('Unable to save questions. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Bulk CSV / Excel Import</h2>
          <p className="text-sm text-slate-500">Upload the standard QuizBox question columns for a single bulk import.</p>
        </div>
        <button type="button" onClick={downloadTemplate} className="w-full rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 sm:w-auto sm:py-2">Download Sample CSV Template</button>
      </div>
      <label className="block cursor-pointer rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-indigo-400">
        <span className="text-sm font-semibold text-slate-700">{isReading ? 'Reading file...' : 'Choose CSV or XLSX file'}</span>
        <input type="file" accept=".csv,.xlsx" onChange={handleFile} disabled={isReading || isSaving} className="sr-only" />
      </label>
      {errors.length > 0 && <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800"><p className="font-semibold">Some rows need attention:</p>{errors.map((error) => <p key={error}>{error}</p>)}</div>}
      {questions.length > 0 && (
        <div className="min-w-0 space-y-3">
          <p className="text-sm font-semibold text-slate-800">Ready to import {questions.length} questions</p>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 text-sm">
            {questions.slice(0, 10).map((question, index) => <div key={`${question.questionText}-${index}`} className="border-b border-slate-100 p-3 last:border-0"><span className="font-semibold">{index + 1}. </span>{question.questionText} <span className="text-slate-500">({question.correctOption}, {question.marks} marks)</span></div>)}
          </div>
          <button type="button" onClick={saveQuestions} disabled={isSaving} className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 sm:w-auto sm:py-2">{isSaving ? 'Importing...' : 'Import All Questions'}</button>
        </div>
      )}
      {status && <p className="text-sm font-semibold text-indigo-700">{status}</p>}
    </section>
  );
}
