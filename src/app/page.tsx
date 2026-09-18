export default function Home() {
  return (
    <div className="min-h-screen px-6 py-8 sm:px-10 lg:px-12">
      <header className="mb-10">
        <p className="mb-2 text-sm font-medium text-muted-foreground">Friday, September 18</p>
        <h1 className="text-3xl font-semibold tracking-tight">Good morning, Nathan.</h1>
        <p className="mt-2 text-muted-foreground">Here&apos;s your personal overview.</p>
      </header>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {["Net worth", "Monthly cash flow", "Savings rate", "Next milestone"].map((label, index) => (
          <div key={label} className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-3 text-2xl font-semibold tabular-nums">
              {index === 0 ? "$—" : index === 1 ? "$—" : index === 2 ? "—%" : "—"}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Connect your data to get started</p>
          </div>
        ))}
      </section>
      <section className="mt-6 rounded-xl border bg-card p-6">
        <p className="text-sm font-medium">Your dashboard is ready</p>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Choose a module from the sidebar to start building your personal operating system.
        </p>
      </section>
    </div>
  );
}
