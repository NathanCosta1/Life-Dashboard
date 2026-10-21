"use client";

import { useState } from "react";
import type { AnnualMusicList, MusicInsights, MusicTrack } from "@/lib/music";

type PublicTrack = Pick<MusicTrack, "id" | "title" | "artist" | "album" | "source">;
type PublicList = Omit<AnnualMusicList, "tracks"> & { tracks: PublicTrack[] };

function MetricCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p>
      {detail && <p className="mt-2 text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}

function Rankings({
  title,
  description,
  items,
  appearanceLabel,
}: {
  title: string;
  description: string;
  items: MusicInsights["recurringSongs"];
  appearanceLabel: string;
}) {
  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      {items.length > 0 ? (
        <ol className="mt-5 space-y-4">
          {items.map((item, index) => (
            <li key={`${item.name}-${item.artist ?? ""}`} className="flex items-start gap-3">
              <span className="grid size-7 flex-none place-items-center rounded-lg bg-muted text-xs font-semibold tabular-nums text-muted-foreground">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.name}</p>
                {item.artist && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.artist}</p>
                )}
              </div>
              <div className="flex-none text-right">
                <p className="text-sm font-semibold tabular-nums">{item.appearances}</p>
                <p className="text-[11px] text-muted-foreground">{appearanceLabel}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">No usable entries found.</p>
      )}
    </section>
  );
}

export function YearInReview({
  lists,
  insights,
  defaultListName,
}: {
  lists: readonly PublicList[];
  insights: MusicInsights;
  defaultListName: string;
}) {
  const years = [...new Set(lists.map((list) => list.year))].sort((left, right) => right - left);
  const [year, setYear] = useState(years[0] ?? 0);
  const yearLists = lists.filter((list) => list.year === year);
  const [listName, setListName] = useState(defaultListName);
  const selectedList = yearLists.find((list) => list.name === listName) ?? yearLists[0];
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"sheet" | "title" | "artist">("sheet");
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const filteredTracks = (() => {
    if (!selectedList) return [];
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const filtered = selectedList.tracks.filter((track) =>
      `${track.title} ${track.artist} ${track.album}`.toLocaleLowerCase().includes(normalizedQuery),
    );
    if (sort === "title") {
      return filtered.sort((left, right) => left.title.localeCompare(right.title));
    }
    if (sort === "artist") {
      return filtered.sort((left, right) =>
        left.artist.localeCompare(right.artist) || left.title.localeCompare(right.title),
      );
    }
    return filtered;
  })();

  const pageCount = Math.ceil(filteredTracks.length / pageSize);
  const visibleTracks = filteredTracks.slice(page * pageSize, (page + 1) * pageSize);
  const yearlySummary = insights.yearlySummaries.find((summary) => summary.year === year);
  const selectedTrackCount = selectedList?.tracks.length ?? 0;

  function changeYear(nextYear: number) {
    setYear(nextYear);
    setPage(0);
    const nextLists = lists.filter((list) => list.year === nextYear);
    const replay = nextLists.find((list) => list.kind === "replay");
    setListName(replay?.name ?? nextLists[0]?.name ?? "");
  }

  function changeList(nextListName: string) {
    setListName(nextListName);
    setPage(0);
  }

  function changeQuery(value: string) {
    setQuery(value);
    setPage(0);
  }

  return (
    <div className="mt-8 space-y-8">
      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Browse a year</p>
            <h2 className="mt-1 text-xl font-semibold">Your saved Apple Music lists</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
              Year
              <select
                value={year}
                onChange={(event) => changeYear(Number(event.target.value))}
                className="min-w-32 rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
              >
                {years.map((availableYear) => (
                  <option key={availableYear} value={availableYear}>{availableYear}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
              Playlist
              <select
                value={selectedList?.name ?? ""}
                onChange={(event) => changeList(event.target.value)}
                className="min-w-48 rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
              >
                {yearLists.map((list) => (
                  <option key={list.name} value={list.name}>{list.name}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
        {selectedList ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {selectedTrackCount} saved track rows in <span className="text-foreground">{selectedList.name}</span>.
            {selectedList.kind === "replay"
              ? " Replay lists are shown as exported; no chart ranks are present in the sheet."
              : " This Everything playlist is kept separate from Replay for the same year."}
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No annual playlists are available.</p>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Music statistics">
        <MetricCard label="Annual playlists" value={insights.totalLists} detail="Replay and Everything lists" />
        <MetricCard label="Unique recordings" value={insights.uniqueTracks} detail="Across all annual playlists" />
        <MetricCard label="Unique album titles" value={insights.uniqueAlbums} detail="Title-based; album artist is not exported" />
        <MetricCard
          label={`${year} saved tracks`}
          value={yearlySummary?.trackCount ?? 0}
          detail={`${yearlySummary?.listCount ?? 0} playlist${yearlySummary?.listCount === 1 ? "" : "s"} · ${selectedTrackCount} in selected list`}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Rankings
          title="Songs in the most lists"
          description="Distinct playlists containing each recording; duplicates within a playlist count once."
          items={insights.recurringSongs.slice(0, 5)}
          appearanceLabel="lists"
        />
        <Rankings
          title="Albums in the most lists"
          description="Album titles are grouped by normalized title because album-artist is not in the source."
          items={insights.recurringAlbums.slice(0, 5)}
          appearanceLabel="lists"
        />
        <Rankings
          title="Top 10 credited artists"
          description="Unique track appearances across lists. Collaboration credits remain as exported."
          items={insights.topArtists}
          appearanceLabel="tracks"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-semibold">{selectedList?.name ?? `${year} playlist`}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Track order follows the exported sheet rows; no chart rank is available.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(14rem,1fr)_10rem]">
            <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
              Search tracks, artists, or albums
              <input
                type="search"
                value={query}
                onChange={(event) => changeQuery(event.target.value)}
                placeholder="Search this playlist"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
              />
            </label>
            <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
              Sort
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as typeof sort)}
                className="rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
              >
                <option value="sheet">Sheet order</option>
                <option value="title">Track title</option>
                <option value="artist">Artist</option>
              </select>
            </label>
          </div>
        </div>

        {visibleTracks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="bg-background/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Track</th>
                  <th scope="col" className="px-5 py-3 font-medium">Credited artist</th>
                  <th scope="col" className="px-5 py-3 font-medium">Album</th>
                  <th scope="col" className="px-5 py-3 font-medium">Sheet row</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleTracks.map((track) => (
                  <tr key={`${selectedList?.name}-${track.id}-${track.source.rowNumber}`}>
                    <td className="px-5 py-3.5 font-medium">{track.title}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{track.artist}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{track.album || "—"}</td>
                    <td className="px-5 py-3.5 tabular-nums text-muted-foreground">{track.source.rowNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-6 text-sm text-muted-foreground">
            {selectedList ? "No tracks match this search." : "There are no tracks in this playlist."}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 text-sm">
          <p className="text-muted-foreground">
            {filteredTracks.length} track{filteredTracks.length === 1 ? "" : "s"}
            {query.trim() ? " match your search" : " in this view"}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              disabled={page === 0}
              className="rounded-lg border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="min-w-20 text-center text-xs tabular-nums text-muted-foreground">
              {pageCount === 0 ? 0 : page + 1} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
              disabled={page >= pageCount - 1}
              className="rounded-lg border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
