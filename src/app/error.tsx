"use client";

export default function RootError({ reset }: { reset: () => void }) {
  return (
    <section className="min-h-screen px-6 py-16 sm:px-10 lg:px-12" role="alert">
      <p className="text-sm font-medium text-rose-300">Dashboard unavailable</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Could not load this page</h1>
      <p className="mt-3 max-w-lg text-muted-foreground">Try the page again or return in a moment.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
      >
        Try again
      </button>
    </section>
  );
}
