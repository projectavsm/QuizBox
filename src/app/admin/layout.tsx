import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-slate-950 p-6 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-8">
            <span className="bg-indigo-600 text-white font-bold text-xl px-3 py-1 rounded-lg">QB</span>
            <span className="text-xl font-bold tracking-tight">QuizBox Admin</span>
          </div>

          <nav className="space-y-2">
            <Link href="/admin" className="block px-4 py-2.5 rounded-lg font-medium hover:bg-slate-800 text-slate-300 hover:text-white">
              Dashboard & Settings
            </Link>
            <Link href="/admin/questions" className="block px-4 py-2.5 rounded-lg font-medium hover:bg-slate-800 text-slate-300 hover:text-white">
              Question Bank
            </Link>
            <a href="/admin/export" target="_blank" className="block px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-950 text-indigo-400 hover:text-indigo-300">
              Export Results (.CSV)
            </a>
            <Link href="/admin/export-pdf" className="block px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-950 text-indigo-400 hover:text-indigo-300">
              Printable Summary (PDF)
            </Link>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800">
          <Link href="/" className="block text-center px-4 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-sm">
            Exit Admin Portal
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">{children}</main>
    </div>
  );
}