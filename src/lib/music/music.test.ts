import { describe, expect, it } from "vitest";
import {
  buildAlbumCandidates,
  buildMusicInsights,
  chooseRandomAlbum,
  getMusicLibraryRange,
  parseMusicLibrary,
} from "./index";

const headers = [
  "Track name",
  "Artist name",
  "Album",
  "Playlist name",
  "Type",
  "ISRC",
  "Apple - id",
];

function row(
  title: string,
  artist: string,
  album: string,
  playlistName: string,
  isrc: string,
): string[] {
  return [title, artist, album, playlistName, "Playlist", isrc, "12345"];
}

describe("parseMusicLibrary", () => {
  it("reads the album playlist and both annual playlist formats", () => {
    const result = parseMusicLibrary([
      headers,
      row("First Song", "First Artist", "Shared Album", "Albums: To Listen", "USRC17607839"),
      row("Second Song", "First Artist", "Shared Album", "Albums: To Listen", "USRC17607840"),
      row("First Song", "First Artist", "Shared Album", "Replay 2024", "USRC17607839"),
      row("Second Song", "First Artist", "Shared Album", "2024 - Everything", "USRC17607840"),
      row("Third Song", "Second Artist", "Another Album", "2025 Replay", "USRC17607841"),
    ]);

    expect(result.issues).toEqual([]);
    expect(result.albumTracks).toHaveLength(2);
    expect(result.annualLists.map((list) => [list.year, list.kind, list.tracks.length])).toEqual([
      [2025, "replay", 1],
      [2024, "everything", 1],
      [2024, "replay", 1],
    ]);
  });

  it("returns a visible structural diagnostic when the source headers are missing", () => {
    const result = parseMusicLibrary([["Unexpected", "columns"], ["data", "rows"]]);

    expect(result.annualLists).toEqual([]);
    expect(result.issues[0]).toMatchObject({
      tab: "My Apple Music Library",
      rowNumber: 1,
      field: "headers",
    });
  });

  it("skips malformed target rows and uses title and artist when an ISRC is invalid", () => {
    const result = parseMusicLibrary([
      headers,
      row("Fallback Song", "Artist", "Album", "Replay 2024", "bad-isrc"),
      row("", "Artist", "Album", "Replay 2024", ""),
      row("No Album", "Artist", "", "Albums: To Listen", ""),
    ]);

    expect(result.annualLists[0].tracks[0].id).toBe("text:fallback song\u0000artist");
    expect(result.issues).toHaveLength(3);
    expect(result.issues.map((issue) => issue.field)).toEqual(["ISRC", "Track name", "Album"]);
  });

  it("deduplicates album candidates by normalized album and credited artist", () => {
    const parsed = parseMusicLibrary([
      headers,
      row("First Song", "Artist", " The Album ", "Albums: To Listen", ""),
      row("Second Song", "artist", "the album", "Albums: To Listen", ""),
      row("Third Song", "Other Artist", "The Album", "Albums: To Listen", ""),
    ]);

    const albums = buildAlbumCandidates(parsed.albumTracks);
    expect(albums).toHaveLength(2);
    expect(albums.find((album) => album.artist === "Artist")).toMatchObject({
      title: "The Album",
      representativeTrack: "First Song",
      trackCount: 2,
    });
  });

  it("chooses a candidate at each half-open random interval boundary", () => {
    const candidates = ["first", "second", "third"];

    expect(chooseRandomAlbum(candidates, 0)).toBe("first");
    expect(chooseRandomAlbum(candidates, 1 / 3)).toBe("second");
    expect(chooseRandomAlbum(candidates, 2 / 3)).toBe("third");
    expect(chooseRandomAlbum(candidates, 0.999999)).toBe("third");
    expect(chooseRandomAlbum(["only"], 0.999999)).toBe("only");
    expect(chooseRandomAlbum([], 0)).toBeNull();
    expect(() => chooseRandomAlbum(candidates, 1)).toThrow(RangeError);
    expect(() => chooseRandomAlbum(candidates, Number.NaN)).toThrow(RangeError);
  });

  it("counts recurring songs and albums once per playlist and artist rows per list", () => {
    const parsed = parseMusicLibrary([
      headers,
      row("Shared Song", "Featured Pair", "Shared Album", "Replay 2024", "USRC17607839"),
      row("Shared Song", "Featured Pair", "Shared Album", "Replay 2024", "USRC17607839"),
      row("Other Song", "Featured Pair", "Other Album", "Replay 2024", "USRC17607840"),
      row("Shared Song", "Featured Pair", "Shared Album", "Replay 2025", "USRC17607839"),
      row("Different Song", "Another Artist", "Shared Album", "2025 - Everything", "USRC17607841"),
    ]);

    const insights = buildMusicInsights(parsed);
    expect(insights.totalLists).toBe(3);
    expect(insights.recurringSongs[0]).toMatchObject({
      name: "Shared Song",
      appearances: 2,
      years: 2,
    });
    expect(insights.recurringAlbums[0]).toMatchObject({
      name: "Shared Album",
      appearances: 3,
      years: 2,
    });
    expect(insights.topArtists[0]).toMatchObject({
      name: "Featured Pair",
      appearances: 3,
      years: 2,
      lists: ["Replay 2025", "Replay 2024"],
    });
    expect(insights.yearlySummaries[0]).toMatchObject({
      year: 2025,
      listCount: 2,
      trackCount: 2,
      uniqueTracks: 2,
      uniqueAlbums: 1,
    });
  });

  it("uses a stable name order to resolve ranking ties", () => {
    const parsed = parseMusicLibrary([
      headers,
      row("Zulu Song", "Artist Z", "Album Z", "Replay 2024", "USRC17607839"),
      row("Alpha Song", "Artist A", "Album A", "Replay 2024", "USRC17607840"),
    ]);

    expect(buildMusicInsights(parsed).recurringSongs.map((song) => song.name)).toEqual([
      "Alpha Song",
      "Zulu Song",
    ]);
  });

  it("keeps distinct album titles when one recording appears on multiple releases", () => {
    const parsed = parseMusicLibrary([
      headers,
      row("Same Recording", "Artist", "Original Album", "Replay 2024", "USRC17607839"),
      row("Same Recording", "Artist", "Compilation Album", "Replay 2024", "USRC17607839"),
    ]);

    const insights = buildMusicInsights(parsed);
    expect(insights.uniqueTracks).toBe(1);
    expect(insights.uniqueAlbums).toBe(2);
    expect(insights.recurringSongs).toHaveLength(1);
    expect(insights.recurringAlbums).toHaveLength(2);
    expect(insights.yearlySummaries[0].uniqueAlbums).toBe(2);
  });

  it("matches a missing ISRC to one unambiguous identified recording", () => {
    const parsed = parseMusicLibrary([
      headers,
      row("Same Song", "Same Artist", "Album", "Replay 2024", ""),
      row("Same Song", "Same Artist", "Album", "Replay 2025", "USRC17607839"),
    ]);

    const insights = buildMusicInsights(parsed);
    expect(insights.uniqueTracks).toBe(1);
    expect(insights.recurringSongs[0]).toMatchObject({
      name: "Same Song",
      appearances: 2,
      years: 2,
    });
  });
});

describe("getMusicLibraryRange", () => {
  it("bounds the range to the declared row count and configured ceiling", () => {
    expect(getMusicLibraryRange(4944)).toBe("'My Apple Music Library'!A1:I4944");
    expect(getMusicLibraryRange(null)).toBe("'My Apple Music Library'!A1:I5000");
    expect(getMusicLibraryRange(50_000)).toBe("'My Apple Music Library'!A1:I10000");
  });
});
