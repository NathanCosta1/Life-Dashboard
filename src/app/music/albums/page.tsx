import type { Metadata } from "next";
import { AlbumPicker } from "@/components/music/album-picker";
import { MusicIssues } from "@/components/music/music-issues";
import { buildAlbumCandidates, loadMusicLibrary, musicSource } from "@/lib/music";

export const metadata: Metadata = {
  title: "Albums to Listen | Music",
};

export default async function AlbumsPage() {
  const data = await loadMusicLibrary();
  const albumTracks = data.albumTracks;
  const albums = buildAlbumCandidates(albumTracks);
  const issues = data.issues.filter(
    (issue) => issue.playlistName?.trim().toLocaleLowerCase() === musicSource.albumPlaylistName.toLocaleLowerCase(),
  );

  return (
    <main className="pt-6">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-amber-200">Albums: To Listen</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Pick your next album
        </h1>
        <p className="mt-3 leading-6 text-muted-foreground">
          Every album represented in your playlist gets one equal chance,
          regardless of how many tracks you saved from it.
        </p>
      </div>

      <MusicIssues issues={issues} />
      <AlbumPicker albums={albums} />

      <p className="mt-5 text-xs leading-5 text-muted-foreground">
        Album identity uses the normalized album title and credited artist
        because the sheet does not include a separate album-artist field.
        Choices are not saved or removed from Apple Music.
      </p>
    </main>
  );
}
