import Link from "next/link";

export default function NotFound() {
  return (
    <section className="min-h-screen px-6 py-16 sm:px-10 lg:px-12" aria-labelledby="not-found-title">
      <p className="text-sm font-medium tracking-[0.18em] text-muted-foreground uppercase">404</p>
      <h1 id="not-found-title" className="mt-3 text-4xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-4 max-w-lg text-muted-foreground">
        That page does not exist in Life Dashboard.
      </p>
      <Link href="/" className="mt-8 inline-flex rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
        Return to the dashboard
      </Link>
    </section>
  );
}
