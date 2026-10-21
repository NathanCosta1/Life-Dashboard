export type MusicSourceLocation = {
  source: "music";
  tab: string;
  rowNumber: number;
};

export type MusicTrack = {
  id: string;
  title: string;
  artist: string;
  album: string;
  isrc: string | null;
  playlistName: string;
  source: MusicSourceLocation;
};

export type MusicIssue = MusicSourceLocation & {
  field: string;
  message: string;
  playlistName?: string;
};

export type AnnualMusicList = {
  name: string;
  year: number;
  kind: "replay" | "everything";
  tracks: MusicTrack[];
};

export type MusicLibraryData = {
  albumTracks: MusicTrack[];
  annualLists: AnnualMusicList[];
  issues: MusicIssue[];
};

export type AlbumCandidate = {
  id: string;
  title: string;
  artist: string;
  representativeTrack: string;
  trackCount: number;
};

export type MusicRanking = {
  name: string;
  artist?: string;
  appearances: number;
  years: number;
  lists: string[];
};

export type AnnualMusicSummary = {
  year: number;
  listCount: number;
  trackCount: number;
  uniqueTracks: number;
  uniqueAlbums: number;
};

export type MusicInsights = {
  uniqueTracks: number;
  uniqueAlbums: number;
  totalLists: number;
  recurringSongs: MusicRanking[];
  recurringAlbums: MusicRanking[];
  topArtists: MusicRanking[];
  yearlySummaries: AnnualMusicSummary[];
};
