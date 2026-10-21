"use client";

export default function MusicError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="pt-6">
      <div className="rounded-xl border border-rose-400/40 bg-rose-400/10 p-6">
        <p className="text-sm font-medium text-rose-200">Music data unavailable</p>
        <p className="mt-2 text-sm text-rose-100/80">
          The Music sheet could not be loaded. Confirm that
          {" "}
          <code className="rounded bg-rose-950/50 px-1 py-0.5">GOOGLE_SHEET_ID_MUSIC</code>
          {" "}
          and the Google service-account credentials are set in this
          workspace&apos;s <code>.env.local</code>. If you just added them,
          restart the development server. Also confirm the service account has
          read access to the spreadsheet.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-lg border border-rose-300/40 px-3 py-2 text-sm text-rose-100 hover:bg-rose-300/10"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
