export default function FinanceLoading() {
  return (
    <div className="min-h-screen px-6 py-8 sm:px-10 lg:px-12" aria-label="Loading finance data">
      <div className="animate-pulse">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="mt-3 h-9 w-48 rounded bg-muted" />
        <div className="mt-3 h-5 w-80 max-w-full rounded bg-muted" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-32 rounded-xl border bg-card" />)}
        </div>
        <div className="mt-6 h-80 rounded-xl border bg-card" />
      </div>
    </div>
  );
}
