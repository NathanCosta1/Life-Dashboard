import type { MusicIssue } from "@/lib/music";

export function MusicIssues({ issues }: { issues: readonly MusicIssue[] }) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <div
      role="status"
      className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm"
    >
      <p className="font-medium text-amber-100">
        Some playlist rows need attention
      </p>
      <p className="mt-1 text-amber-100/75">
        {issues.length} row{issues.length === 1 ? "" : "s"} could not be fully
        used. Available music is still shown.
      </p>
      <ul className="mt-3 space-y-1 text-xs text-amber-100/65">
        {issues.slice(0, 3).map((issue) => (
          <li key={`${issue.tab}-${issue.rowNumber}-${issue.field}`}>
            {issue.tab}, row {issue.rowNumber}: {issue.field} — {issue.message}
          </li>
        ))}
        {issues.length > 3 && <li>{issues.length - 3} additional row issues.</li>}
      </ul>
    </div>
  );
}
