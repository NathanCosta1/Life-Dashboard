export default function MusicLoading() {
  return (
    <div className="pt-6" aria-label="Loading music data">
      <div className="animate-pulse">
        <div className="h-4 w-36 rounded bg-muted" />
        <div className="mt-3 h-9 w-72 max-w-full rounded bg-muted" />
        <div className="mt-3 h-5 w-[34rem] max-w-full rounded bg-muted" />
        <div className="mt-8 grid gap-4 xl:grid-cols-2">
          <div className="h-96 rounded-2xl border bg-card" />
          <div className="h-96 rounded-2xl border bg-card" />
        </div>
      </div>
    </div>
  );
}
