export default function ResultPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-emerald-950 px-6 py-16 text-white">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/15 ring-1 ring-emerald-300/40">
          <span className="text-4xl text-emerald-300" aria-hidden="true">&#10003;</span>
        </div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">QuizBox Complete</p>
        <h1 className="text-4xl font-extrabold tracking-tight">Test Submitted!</h1>
        <p className="mt-5 max-w-md text-lg leading-8 text-slate-300">
          Your answers have been recorded successfully. You may close this tab.
        </p>
        <div className="mt-10 h-1 w-24 rounded-full bg-emerald-400" />
      </div>
    </main>
  );
}