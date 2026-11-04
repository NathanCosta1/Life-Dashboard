"use client";

import { useEffect, useRef, useState } from "react";
import { chooseRandomAlbum } from "@/lib/music/parser";
import type { AlbumCandidate } from "@/lib/music/types";

export function AlbumCover({ album }: { album: AlbumCandidate }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [artworkUrl, setArtworkUrl] = useState(album.artworkUrl);
  const [lookedUp, setLookedUp] = useState(false);
  const isLookingUp = !artworkUrl && !lookedUp;

  useEffect(() => {
    let cancelled = false;
    if (album.artworkUrl || !album.title.trim()) return;

    void fetch(`/api/music/artwork?album=${encodeURIComponent(album.title)}&artist=${encodeURIComponent(album.artist)}`, {
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const body = await response.json() as { artworkUrl?: string | null };
        return body.artworkUrl ?? null;
      })
      .then((url) => {
        if (!cancelled) setArtworkUrl(url);
      })
      .finally(() => {
        if (!cancelled) setLookedUp(true);
      });

    return () => {
      cancelled = true;
    };
  }, [album.title, album.artist, album.artworkUrl]);

  if (isLookingUp) {
    return (
      <div
        data-testid="album-cover-loading"
        className="mt-4 grid aspect-square w-full max-w-72 animate-pulse place-items-center rounded-md border border-white/10 bg-white/[0.05]"
        aria-label={`Looking for ${album.title} album cover`}
      >
        <span className="text-xs uppercase tracking-[0.2em] text-white/35">Finding cover</span>
      </div>
    );
  }

  if (!artworkUrl || failedUrl === artworkUrl) {
    return (
      <div
        data-testid="album-cover-fallback"
        className="mt-4 grid aspect-square w-full max-w-72 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-center shadow-[0_16px_50px_rgba(0,0,0,.45)]"
        aria-label={`No album cover found for ${album.title}`}
      >
        <span className="text-4xl font-semibold text-white/40">
          {album.title.slice(0, 1).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div className="relative mt-4 w-full max-w-72">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        data-testid="album-cover"
        src={artworkUrl}
        alt={`${album.title} album cover`}
        width={600}
        height={600}
        className="aspect-square w-full rounded-md object-cover shadow-[0_16px_50px_rgba(0,0,0,.45)]"
        referrerPolicy="no-referrer"
        onError={() => setFailedUrl(artworkUrl)}
      />
    </div>
  );
}

export function AlbumCoverImage({ album }: { album: AlbumCandidate }) {
  if (!album.artworkUrl) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      data-testid="album-cover"
      src={album.artworkUrl}
      alt={`${album.title} album cover`}
      width={600}
      height={600}
      className="aspect-square w-full rounded-md object-cover shadow-[0_16px_50px_rgba(0,0,0,.45)]"
      referrerPolicy="no-referrer"
    />
  );
}

export function AlbumPicker({ albums }: { albums: readonly AlbumCandidate[] }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumCandidate | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const timer = useRef<number | null>(null);
  const wheelRef = useRef<HTMLDivElement | null>(null);
  const wheelRotation = useRef(0);
  const wheelColors = [
    "#ef4444",
    "#f97316",
    "#facc15",
    "#22c55e",
    "#14b8a6",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#f472b6",
    "#a3e635",
    "#06b6d4",
    "#c084fc",
  ];
  const wheelBackground = albums.length > 0
    ? `conic-gradient(${wheelColors.map((color, index) => {
        const start = index / wheelColors.length * 100;
        const end = (index + 1) / wheelColors.length * 100;
        return `${color} ${start}% ${end}%`;
      }).join(", ")})`
    : "conic-gradient(#27272a 0 100%)";

  useEffect(
    () => () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }
    },
    [],
  );

  function spin() {
    if (isSpinning || albums.length === 0) {
      return;
    }

    const album = chooseRandomAlbum(albums);
    if (!album) {
      return;
    }

    setSelectedAlbum(null);
    setIsSpinning(true);
    setAnnouncement("Choosing an album.");

    const finishSpin = () => {
      setSelectedAlbum(album);
      setIsSpinning(false);
      setAnnouncement(`Your next album is ${album.title} by ${album.artist}.`);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finishSpin();
      return;
    }

    if (wheelRef.current?.animate) {
      const angle = 1440 + Math.floor(Math.random() * 360);
      const startRotation = wheelRotation.current;
      wheelRotation.current += angle;
      const animation = wheelRef.current.animate(
        [
          { transform: `rotate(${startRotation}deg)` },
          { transform: `rotate(${wheelRotation.current}deg)` },
        ],
        {
          duration: 1_650,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "forwards",
        },
      );
      animation.onfinish = finishSpin;
      return;
    }

    timer.current = window.setTimeout(finishSpin, 1_650);
  }

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,0.8fr)]">
      <section className="rounded-2xl border bg-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">The album wheel</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              One ticket per unique album in your playlist.
            </p>
          </div>
          <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
            {albums.length} albums
          </span>
        </div>

        <div className="mx-auto mt-10 flex min-h-64 max-w-sm flex-col items-center justify-center">
          <div
            ref={wheelRef}
            className="music-wheel relative grid size-72 place-items-center rounded-full border border-white/15 bg-[radial-gradient(circle_at_center,#202027_0_11%,#09090b_12%_20%,#27272a_21%_23%,#111113_24%_68%,#27272a_69%_72%,#101013_73%)] shadow-[0_20px_70px_rgba(0,0,0,0.55)] sm:size-80 lg:size-96"
            style={{ background: wheelBackground }}
            aria-hidden="true"
          >
            <span className="absolute -top-3 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[10px] border-b-[20px] border-x-transparent border-b-amber-200" />
            <span className="absolute text-xs font-medium uppercase tracking-[0.35em] text-white/70">
              {isSpinning ? "Selecting" : "Your next"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={spin}
          disabled={isSpinning || albums.length === 0}
          className="mt-8 w-full rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSpinning ? "Spinning..." : "Choose a random album"}
        </button>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>
      </section>

      <section
        aria-live="polite"
        aria-atomic="true"
        className="flex min-h-72 flex-col justify-center rounded-2xl border bg-card p-6 sm:p-8"
      >
        {selectedAlbum ? (
          <>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-amber-200">
              Your next album
            </p>
            <AlbumCover key={selectedAlbum.id} album={selectedAlbum} />
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              {selectedAlbum.title}
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
              {selectedAlbum.artist}
            </p>
            {selectedAlbum.trackCount > 1 && (
              <p className="mt-4 text-sm text-muted-foreground">
                {selectedAlbum.trackCount} playlist tracks point to this album;
                it was counted once in the draw.
              </p>
            )}
          </>
        ) : albums.length > 0 ? (
          <>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Ready when you are
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">
              Let the wheel pick tonight&apos;s listen.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Every distinct album has an equal chance. Spin history is not
              saved, and albums stay in your playlist.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">No albums to choose from yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              The Albums to Listen list has no usable entries. Add albums
              to the list and refresh the page.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
