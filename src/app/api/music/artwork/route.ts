import { fetchAlbumArtwork } from "@/lib/music/itunes";

export const runtime = "nodejs";
export const revalidate = 86_400;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const album = searchParams.get("album")?.trim() ?? "";
  const artist = searchParams.get("artist")?.trim() ?? "";
  if (!album || !artist) {
    return Response.json({ artworkUrl: null }, { status: 400 });
  }

  const artworkUrl = await fetchAlbumArtwork(album, artist);
  return Response.json(
    { artworkUrl },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
