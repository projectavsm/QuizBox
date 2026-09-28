'use client';

import { useEffect, useState } from 'react';
import { getLiveStatsAction } from '@/actions/admin';

type LiveStats = {
  totalRegistered: number;
  totalSubmitted: number;
  averageScore: number;
  highestScore: number;
  recentSubmissions: Array<{
    id: number;
    name: string;
    rollNumber: string;
    score: number;
    total: number;
    submittedAt: string;
  }>;
};

export default function LiveMonitor() {
  const [isLive, setIsLive] = useState(true);
  const [stats, setStats] = useState<LiveStats | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      const result = await getLiveStatsAction();
      if (isMounted && result.success && result.stats) setStats(result.stats);
    };

    void fetchStats();
    if (!isLive) return () => { isMounted = false; };

    const interval = window.setInterval(() => void fetchStats(), 3000);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [isLive]);

  const cards = [
    { label: 'Total Registered', value: stats?.totalRegistered ?? 0, color: 'text-indigo-600' },
    { label: 'Completed', value: stats?.totalSubmitted ?? 0, color: 'text-emerald-600' },
    { label: 'Average Score', value: stats ? stats.averageScore.toFixed(1) : '0.0', color: 'text-amber-600' },
    { label: 'Highest Score', value: stats?.highestScore ?? 0, color: 'text-rose-600' },
  ];

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6" aria-labelledby="live-monitor-title">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="live-monitor-title" className="text-lg font-bold text-slate-900">Live Monitoring</h2>
          <p className="text-sm text-slate-500">Updates every three seconds while live mode is enabled.</p>
        </div>
        <button type="button" onClick={() => setIsLive((current) => !current)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${isLive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          {isLive ? 'Live' : 'Paused'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-slate-200 p-4">
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className={`mt-1 text-2xl font-extrabold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr><th className="px-3 py-2">Student</th><th className="px-3 py-2">Roll Number</th><th className="px-3 py-2">Score</th><th className="px-3 py-2">Submitted</th></tr>
          </thead>
          <tbody>
            {stats?.recentSubmissions.map((submission) => (
              <tr key={submission.id} className="border-b border-slate-100 last:border-0">
                <td className="px-3 py-3 font-medium text-slate-900">{submission.name}</td>
                <td className="px-3 py-3 text-slate-600">{submission.rollNumber}</td>
                <td className="px-3 py-3 text-slate-600">{submission.score} / {submission.total}</td>
                <td className="px-3 py-3 text-slate-600">{submission.submittedAt}</td>
              </tr>
            ))}
            {!stats?.recentSubmissions.length && <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-500">No submissions yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}