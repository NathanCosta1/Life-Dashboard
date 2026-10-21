import Link from "next/link";

const musicAreas = [
  {
    title: "Albums to listen",
    description: "Spin the wheel and let your saved album playlist pick your next listen.",
    href: "/music/albums",
  },
  {
    title: "Year in review",
    description: "Explore recurring songs, albums, and artists across your annual playlists.",
    href: "/music/years",
  },
];

export default function MusicPage() {
  return (
    <div className="min-h-screen px-6 py-8 sm:px-10 lg:px-12">
      <p className="text-sm font-medium text-muted-foreground">Module home</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Music</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Pick your next album or look back at the music you saved each year.
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Music areas">
        {musicAreas.map((area) => (
          <Link
            key={area.href}
            href={area.href}
            className="group rounded-xl border bg-card p-5 transition-colors hover:border-foreground/40 hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-medium group-hover:text-foreground">{area.title}</h2>
              <span className="rounded-full border px-2 py-1 text-[11px] text-muted-foreground">
                Available
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{area.description}</p>
            <span className="mt-5 inline-block text-sm font-medium text-foreground">
              Open area <span aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
