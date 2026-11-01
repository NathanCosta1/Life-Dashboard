export type ITunesFetch = typeof fetch;

const artworkCache = new Map<string, Promise<string | null>>();

type ITunesAlbumResult = {
  collectionName?: string;
  artistName?: string;
  artworkUrl100?: string;
};

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLocaleLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ");
}

export function getHighResolutionArtworkUrl(artworkUrl100: string | null | undefined): string | null {
  if (!artworkUrl100) return null;
  return artworkUrl100
    .replace(/100x100bb\.(jpg|png)/i, "600x600bb.$1")
    .replace(/100x100bb/i, "600x600bb")
    .replace(/100x100/i, "600x600");
}

export async function fetchAlbumArtwork(
  album: string,
  artist: string,
  fetcher: ITunesFetch = fetch,
): Promise<string | null> {
  if (!album.trim() || !artist.trim()) return null;
  const cacheKey = `${normalize(album)}\u0000${normalize(artist)}`;
  const usesProductionFetch = fetcher === fetch;
  if (usesProductionFetch) {
    const cached = artworkCache.get(cacheKey);
    if (cached) return cached;
  }

  const lookup = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    try {
    const normalizedAlbum = normalize(album);
    const normalizedArtist = normalize(artist);
    const queries = [`${album} ${artist}`, album];

    for (const term of queries) {
      const query = new URLSearchParams({
        term,
        media: "music",
        entity: "album",
        limit: "25",
        country: "us",
      });
      const response = await fetcher(`https://itunes.apple.com/search?${query.toString()}`, {
        signal: controller.signal,
        headers: { Accept: "application/json", "User-Agent": "Life-Dashboard/1.0" },
      });
      if (!response.ok) continue;
      const payload = await response.json() as { results?: ITunesAlbumResult[] };
      const results = payload.results ?? [];
      const exact = results.find((result) =>
        normalize(result.collectionName ?? "") === normalizedAlbum &&
        normalize(result.artistName ?? "") === normalizedArtist,
      );
      const albumMatch = exact ?? results.find((result) =>
        normalize(result.collectionName ?? "") === normalizedAlbum,
      );
      const closeAlbumMatch = albumMatch ?? results.find((result) => {
        const resultAlbum = normalize(result.collectionName ?? "");
        return resultAlbum.includes(normalizedAlbum) || normalizedAlbum.includes(resultAlbum);
      });
      if (closeAlbumMatch?.artworkUrl100) {
        return getHighResolutionArtworkUrl(closeAlbumMatch.artworkUrl100);
      }
    }
    if (usesProductionFetch) {
      const musicBrainzQuery = new URLSearchParams({
        query: `release:"${album}" AND artist:"${artist}"`,
        fmt: "json",
        limit: "5",
      });
      const response = await fetcher(
        `https://musicbrainz.org/ws/2/release/?${musicBrainzQuery.toString()}`,
        {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "User-Agent": "Life-Dashboard/1.0 (personal dashboard)",
          },
        },
      );
      if (response.ok) {
        const payload = await response.json() as {
          releases?: Array<{ id?: string }>;
        };
        const releaseId = payload.releases?.find((release) => release.id)?.id;
        if (releaseId) {
          return `https://coverartarchive.org/release/${releaseId}/front-500`;
        }
      }
    }
    return null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  })();
  if (usesProductionFetch) {
    artworkCache.set(cacheKey, lookup);
  }
  return lookup;
}
