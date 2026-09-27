'use client';

import { useState } from 'react';
import { importQuestionsAction, clearAllQuestionsAction } from '@/actions/admin';
import AddQuestionModal from '@/components/admin/AddQuestionModal';
import DocumentQuestionImporter from '@/components/admin/DocumentQuestionImporter';
import CsvExcelImporter from '@/components/admin/CsvExcelImporter';

export default function QuestionUploadTabs() {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [textInput, setTextInput] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus('Reading CSV file...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await importQuestionsAction(formData);
      if (res.success) {
        setStatus(`Successfully imported ${res.count} questions! Refreshing...`);
        window.location.reload();
      } else {
        setStatus(`Error: ${res.message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append('rawText', textInput);

    const res = await importQuestionsAction(formData);

    setLoading(false);
    if (res.success) {
      setStatus(`Successfully imported ${res.count} questions!`);
      setTextInput('');
    } else {
      setStatus(res.message || 'Failed to import questions.');
    }
  }

  async function handleClearAll() {
    if (!confirm('Are you sure you want to delete ALL questions?')) return;
    setLoading(true);
    await clearAllQuestionsAction();
    window.location.reload();
  }

  return (
    <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col items-stretch gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`w-full rounded-lg px-4 py-3 text-sm font-bold transition-colors sm:w-auto sm:py-2 ${
              activeTab === 'file' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Upload File (CSV)
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`w-full border-b-2 pb-3 text-left font-semibold sm:w-auto sm:pb-2 ${
              activeTab === 'text' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
            }`}
          >
            Paste Text
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="w-full rounded-lg bg-emerald-600 px-3 py-3 text-xs font-semibold text-white hover:bg-emerald-700 sm:w-auto sm:py-1.5"
        >
          Add Question
        </button>
        <button
          type="button"
          onClick={handleClearAll}
          disabled={loading}
          className="w-full rounded border border-red-300 bg-red-100 px-3 py-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-200 sm:w-auto sm:py-1.5"
        >
          Clear All Questions
        </button>
      </div>

      <DocumentQuestionImporter />
      <CsvExcelImporter />

      {activeTab === 'file' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-800">Select CSV File (Format: Question, OptionA, OptionB, OptionC, OptionD, Answer):</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={loading}
              className="block w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-700"
            />
          </div>
          
        </div>
      ) : (
        <form onSubmit={handleTextSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-800">Paste Formatted Questions</label>
            <textarea
              rows={6}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={`Q: What is 2+2?\nA) 1\nB) 2\nC) 4\nD) 5\nANS: C`}
              required
              className="w-full rounded border border-slate-300 p-3 font-mono text-sm text-slate-900"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Importing...' : 'Parse & Import Text'}
          </button>
        </form>
      )}

      {status && <p className="text-sm font-bold text-indigo-700 pt-2">{status}</p>}
      <AddQuestionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}