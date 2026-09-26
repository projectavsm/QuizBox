'use client';

import { useState } from 'react';
import { importQuestionsAction, clearAllQuestionsAction } from '@/actions/admin';

export default function QuestionUploadTabs() {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [textInput, setTextInput] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-6 shadow-sm">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`px-4 py-2 font-bold rounded-lg text-sm transition-colors ${
              activeTab === 'file' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Upload File (CSV)
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`font-semibold pb-2 border-b-2 ${
              activeTab === 'text' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
            }`}
          >
            Paste Text
          </button>
        </div>

        <button
          type="button"
          onClick={handleClearAll}
          disabled={loading}
          className="text-xs px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded border border-red-300 font-semibold transition-colors"
        >
          Clear All Questions
        </button>
      </div>

      {activeTab === 'file' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-800">Select CSV File (Format: Question, OptionA, OptionB, OptionC, OptionD, Answer):</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={loading}
              className="block w-full text-sm text-slate-900 border border-slate-300 rounded-lg p-2 bg-slate-50 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
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
              className="w-full border border-slate-300 p-2 rounded font-mono text-sm text-slate-900"
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
    </div>
  );
}