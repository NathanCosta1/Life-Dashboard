"use client";

export default function FinanceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen px-6 py-8 sm:px-10 lg:px-12">
      <div className="rounded-xl border border-rose-400/40 bg-rose-400/10 p-6">
        <p className="text-sm font-medium text-rose-200">Finance data unavailable</p>
        <p className="mt-2 text-sm text-rose-100/80">
          This Finance area could not load its connected data. Check the configured sheet access and try again.
        </p>
        <button type="button" onClick={reset} className="mt-4 rounded-lg border border-rose-300/40 px-3 py-2 text-sm text-rose-100 hover:bg-rose-300/10">
          Try again
        </button>
      </div>
    </div>
  );
}
