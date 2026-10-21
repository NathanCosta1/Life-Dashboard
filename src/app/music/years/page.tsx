import type { Metadata } from "next";
import { MusicIssues } from "@/components/music/music-issues";
import { YearInReview } from "@/components/music/year-in-review";
import { buildMusicInsights, loadMusicLibrary, musicSource } from "@/lib/music";
import type { AnnualMusicList, MusicTrack } from "@/lib/music";

export const metadata: Metadata = {
  title: "Year in Review | Music",
};

type PublicTrack = Pick<MusicTrack, "id" | "title" | "artist" | "album" | "source">;
type PublicList = Omit<AnnualMusicList, "tracks"> & { tracks: PublicTrack[] };

export default async function MusicYearsPage() {
  const data = await loadMusicLibrary();
  const lists: PublicList[] = data.annualLists.map((list) => ({
    ...list,
    tracks: list.tracks.map(({ id, title, artist, album, source }) => ({
      id,
      title,
      artist,
      album,
      source,
    })),
  }));
  const insights = buildMusicInsights(data);
  const latestYear = lists[0]?.year;
  const defaultList =
    lists.find((list) => list.year === latestYear && list.kind === "replay") ?? lists[0];
  const issues = data.issues.filter(
    (issue) =>
      issue.playlistName !== undefined &&
      issue.playlistName.trim().toLocaleLowerCase() !== musicSource.albumPlaylistName.toLocaleLowerCase(),
  );

  return (
    <main className="pt-6">
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-amber-200">Replay & Everything</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Your music, year by year
        </h1>
        <p className="mt-3 leading-6 text-muted-foreground">
          Browse each saved annual playlist and see the songs, album titles, and
          credited artists that recur across your lists.
        </p>
      </div>

      <MusicIssues issues={issues} />
      {lists.length > 0 ? (
        <YearInReview
          lists={lists}
          insights={insights}
          defaultListName={defaultList?.name ?? ""}
        />
      ) : (
        <div className="mt-8 rounded-2xl border bg-card p-6">
          <p className="font-medium">No annual playlists found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            The configured sheet does not contain a recognized Replay or
            year-specific Everything playlist yet.
          </p>
        </div>
      )}
    </main>
  );
}
