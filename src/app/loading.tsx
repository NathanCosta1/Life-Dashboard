export default function Loading() {
  return (
    <div className="min-h-screen px-6 py-10 sm:px-10 lg:px-12" aria-label="Loading Life Dashboard" aria-live="polite">
      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-10 w-64 animate-pulse rounded bg-muted" />
    </div>
  );
}
