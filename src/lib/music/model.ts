import type {
  AnnualMusicList,
  AnnualMusicSummary,
  MusicInsights,
  MusicLibraryData,
  MusicRanking,
  MusicTrack,
} from "./types";

type RankingAccumulator = {
  name: string;
  artist?: string;
  listNames: Set<string>;
  years: Set<number>;
  appearances: number;
};

function normalized(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();
}

function trackNameKey(track: MusicTrack): string {
  return `${normalized(track.title)}\u0000${normalized(track.artist)}`;
}

function resolveTrackIdentities(lists: readonly AnnualMusicList[]): Map<MusicTrack, string> {
  const isrcsByName = new Map<string, Set<string>>();
  for (const list of lists) {
    for (const track of list.tracks) {
      if (!track.isrc) {
        continue;
      }
      const nameKey = trackNameKey(track);
      const isrcs = isrcsByName.get(nameKey) ?? new Set<string>();
      isrcs.add(track.id);
      isrcsByName.set(nameKey, isrcs);
    }
  }

  const identities = new Map<MusicTrack, string>();
  for (const list of lists) {
    for (const track of list.tracks) {
      if (track.isrc) {
        identities.set(track, track.id);
        continue;
      }
      const knownIsrcs = isrcsByName.get(trackNameKey(track));
      identities.set(track, knownIsrcs?.size === 1 ? [...knownIsrcs][0] : track.id);
    }
  }
  return identities;
}

function uniqueListTracks(
  list: AnnualMusicList,
  identities: ReadonlyMap<MusicTrack, string>,
): MusicTrack[] {
  const tracks = new Map<string, MusicTrack>();
  for (const track of list.tracks) {
    const identity = identities.get(track) ?? track.id;
    if (!tracks.has(identity)) {
      tracks.set(identity, track);
    }
  }
  return [...tracks.values()];
}

function addAppearance(
  rankings: Map<string, RankingAccumulator>,
  key: string,
  name: string,
  artist: string | undefined,
  list: AnnualMusicList,
): void {
  const ranking = rankings.get(key) ?? {
    name,
    artist,
    listNames: new Set<string>(),
    years: new Set<number>(),
    appearances: 0,
  };
  if (!ranking.listNames.has(list.name)) {
    ranking.listNames.add(list.name);
    ranking.years.add(list.year);
    ranking.appearances += 1;
  }
  rankings.set(key, ranking);
}

function addArtistAppearance(
  rankings: Map<string, RankingAccumulator>,
  key: string,
  name: string,
  list: AnnualMusicList,
): void {
  const ranking = rankings.get(key) ?? {
    name,
    listNames: new Set<string>(),
    years: new Set<number>(),
    appearances: 0,
  };
  if (!ranking.listNames.has(list.name)) {
    ranking.listNames.add(list.name);
    ranking.years.add(list.year);
  }
  ranking.appearances += 1;
  rankings.set(key, ranking);
}

function toRanking(accumulator: RankingAccumulator): MusicRanking {
  return {
    name: accumulator.name,
    ...(accumulator.artist ? { artist: accumulator.artist } : {}),
    appearances: accumulator.appearances,
    years: accumulator.years.size,
    lists: [...accumulator.listNames].sort((left, right) => right.localeCompare(left)),
  };
}

function sortedRankings(rankings: Map<string, RankingAccumulator>): MusicRanking[] {
  return [...rankings.values()]
    .map(toRanking)
    .sort((left, right) =>
      right.appearances - left.appearances ||
      right.years - left.years ||
      left.name.localeCompare(right.name) ||
      (left.artist ?? "").localeCompare(right.artist ?? ""),
    );
}

function countUniqueAlbums(tracks: readonly MusicTrack[]): number {
  return new Set(tracks.map((track) => normalized(track.album)).filter(Boolean)).size;
}

function buildYearlySummaries(
  lists: readonly AnnualMusicList[],
  identities: ReadonlyMap<MusicTrack, string>,
): AnnualMusicSummary[] {
  const byYear = new Map<number, AnnualMusicList[]>();
  for (const list of lists) {
    const yearLists = byYear.get(list.year) ?? [];
    yearLists.push(list);
    byYear.set(list.year, yearLists);
  }

  return [...byYear.entries()]
    .map(([year, yearLists]) => {
      const tracks = yearLists.flatMap((list) => uniqueListTracks(list, identities));
      return {
        year,
        listCount: yearLists.length,
        trackCount: yearLists.reduce((total, list) => total + list.tracks.length, 0),
        uniqueTracks: new Set(tracks.map((track) => track.id)).size,
        uniqueAlbums: countUniqueAlbums(yearLists.flatMap((list) => list.tracks)),
      };
    })
    .sort((left, right) => right.year - left.year);
}

export function buildMusicInsights(data: Pick<MusicLibraryData, "annualLists">): MusicInsights {
  const songs = new Map<string, RankingAccumulator>();
  const albums = new Map<string, RankingAccumulator>();
  const artists = new Map<string, RankingAccumulator>();
  const allTracks = new Map<string, MusicTrack>();
  const identities = resolveTrackIdentities(data.annualLists);

  for (const list of data.annualLists) {
    const uniqueTracks = uniqueListTracks(list, identities);
    for (const track of uniqueTracks) {
      const identity = identities.get(track) ?? track.id;
      allTracks.set(identity, track);
      addAppearance(songs, identity, track.title, track.artist, list);

      const artistKey = normalized(track.artist);
      if (artistKey) {
        addArtistAppearance(artists, artistKey, track.artist, list);
      }
    }

    const albumTitlesInList = new Map<string, string>();
    for (const track of list.tracks) {
      const albumKey = normalized(track.album);
      if (albumKey && !albumTitlesInList.has(albumKey)) {
        albumTitlesInList.set(albumKey, track.album);
      }
    }
    for (const [albumKey, albumTitle] of albumTitlesInList) {
      addAppearance(albums, albumKey, albumTitle, undefined, list);
    }
  }

  return {
    uniqueTracks: allTracks.size,
    uniqueAlbums: countUniqueAlbums(data.annualLists.flatMap((list) => list.tracks)),
    totalLists: data.annualLists.length,
    recurringSongs: sortedRankings(songs).slice(0, 10),
    recurringAlbums: sortedRankings(albums).slice(0, 10),
    topArtists: sortedRankings(artists).slice(0, 10),
    yearlySummaries: buildYearlySummaries(data.annualLists, identities),
  };
}
