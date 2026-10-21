import { musicSource } from "./sources";
import type {
  AlbumCandidate,
  AnnualMusicList,
  MusicIssue,
  MusicLibraryData,
  MusicTrack,
} from "./types";

type PlaylistIdentity = {
  year: number;
  kind: AnnualMusicList["kind"];
};

const requiredHeaders = ["track name", "artist name", "album", "playlist name"] as const;

function normalizeHeader(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeIdentity(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();
}

function normalizeIsrc(value: string): string | null {
  const normalized = value.trim().replace(/[\s-]/g, "").toLocaleUpperCase();
  return /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(normalized) ? normalized : null;
}

function identifyAnnualPlaylist(name: string): PlaylistIdentity | null {
  const normalizedName = name.trim().replace(/\s+/g, " ");
  const replayMatch = normalizedName.match(/^(?:replay\s+(\d{4})|(\d{4})\s+replay)$/i);
  const everythingMatch = normalizedName.match(
    /^(\d{4})(?:\s*[-–—]\s*|\s+)(?:year\s+)?everything$/i,
  );
  const yearValue = replayMatch?.[1] ?? replayMatch?.[2] ?? everythingMatch?.[1];
  if (!yearValue) {
    return null;
  }

  const year = Number(yearValue);
  if (year < 1900 || year > 2100) {
    return null;
  }
  return { year, kind: replayMatch ? "replay" : "everything" };
}

function isBlankRow(row: readonly string[]): boolean {
  return row.every((cell) => !cell.trim());
}

function buildTrackId(isrc: string | null, title: string, artist: string): string {
  return isrc
    ? `isrc:${isrc}`
    : `text:${normalizeIdentity(title)}\u0000${normalizeIdentity(artist)}`;
}

export function parseMusicLibrary(
  rows: readonly (readonly string[])[],
  tab = musicSource.libraryTab,
): MusicLibraryData {
  const issues: MusicIssue[] = [];
  const headerIndex = rows.slice(0, 10).findIndex((row) => {
    const headers = row.map(normalizeHeader);
    return requiredHeaders.every((header) => headers.includes(normalizeHeader(header)));
  });

  if (headerIndex === -1) {
    return {
      albumTracks: [],
      annualLists: [],
      issues: [{
        source: "music",
        tab,
        rowNumber: 1,
        field: "headers",
        message: "Expected Track name, Artist name, Album, and Playlist name headers were not found.",
      }],
    };
  }

  const headers = rows[headerIndex].map(normalizeHeader);
  const columns = {
    title: headers.indexOf("trackname"),
    artist: headers.indexOf("artistname"),
    album: headers.indexOf("album"),
    playlist: headers.indexOf("playlistname"),
    isrc: headers.indexOf("isrc"),
  };
  const albumTracks: MusicTrack[] = [];
  const annualListsByName = new Map<string, AnnualMusicList>();

  for (let index = headerIndex + 1; index < rows.length; index += 1) {
    const row = rows[index];
    if (isBlankRow(row)) {
      continue;
    }

    const playlistName = (row[columns.playlist] ?? "").trim();
    if (!playlistName) {
      continue;
    }

    const isAlbumPlaylist =
      normalizeIdentity(playlistName) === normalizeIdentity(musicSource.albumPlaylistName);
    const annualIdentity = identifyAnnualPlaylist(playlistName);
    if (!isAlbumPlaylist && !annualIdentity) {
      continue;
    }

    const source = { source: "music" as const, tab, rowNumber: index + 1 };
    const title = (row[columns.title] ?? "").trim();
    const artist = (row[columns.artist] ?? "").trim();
    const album = (row[columns.album] ?? "").trim();
    if (!title || !artist) {
      issues.push({
        ...source,
        playlistName,
        field: !title ? "Track name" : "Artist name",
        message: "Playlist row is missing a track title or credited artist.",
      });
      continue;
    }
    if (isAlbumPlaylist && !album) {
      issues.push({
        ...source,
        playlistName,
        field: "Album",
        message: "Album-picker row is missing an album title.",
      });
      continue;
    }

    const rawIsrc = row[columns.isrc]?.trim() ?? "";
    const isrc = rawIsrc ? normalizeIsrc(rawIsrc) : null;
    if (rawIsrc && !isrc) {
      issues.push({
        ...source,
        playlistName,
        field: "ISRC",
        message: "ISRC is malformed; track identity falls back to title and credited artist.",
      });
    }

    const track: MusicTrack = {
      id: buildTrackId(isrc, title, artist),
      title,
      artist,
      album,
      isrc,
      playlistName,
      source,
    };

    if (isAlbumPlaylist) {
      albumTracks.push(track);
      continue;
    }
    if (!annualIdentity) {
      continue;
    }

    const key = normalizeIdentity(playlistName);
    let annualList = annualListsByName.get(key);
    if (!annualList) {
      annualList = { name: playlistName, ...annualIdentity, tracks: [] };
      annualListsByName.set(key, annualList);
    }
    annualList.tracks.push(track);
  }

  const annualLists = [...annualListsByName.values()].sort(
    (left, right) => right.year - left.year || left.name.localeCompare(right.name),
  );

  return { albumTracks, annualLists, issues };
}

export function buildAlbumCandidates(tracks: readonly MusicTrack[]): AlbumCandidate[] {
  const albums = new Map<string, AlbumCandidate>();
  for (const track of tracks) {
    const normalizedAlbum = normalizeIdentity(track.album);
    const normalizedArtist = normalizeIdentity(track.artist);
    if (!normalizedAlbum || !normalizedArtist) {
      continue;
    }

    const id = `${normalizedAlbum}\u0000${normalizedArtist}`;
    const candidate = albums.get(id);
    if (candidate) {
      candidate.trackCount += 1;
    } else {
      albums.set(id, {
        id,
        title: track.album,
        artist: track.artist,
        representativeTrack: track.title,
        trackCount: 1,
      });
    }
  }
  return [...albums.values()].sort(
    (left, right) => left.title.localeCompare(right.title) || left.artist.localeCompare(right.artist),
  );
}

export function chooseRandomAlbum<T>(
  candidates: readonly T[],
  randomValue = Math.random(),
): T | null {
  if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
    throw new RangeError("Random value must be greater than or equal to 0 and less than 1.");
  }
  if (candidates.length === 0) {
    return null;
  }
  return candidates[Math.floor(randomValue * candidates.length)];
}
