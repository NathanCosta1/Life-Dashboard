import Link from "next/link";

const financeAreas = [
  {
    title: "Budget",
    description: "Model Nathan's Planned budget, savings rate, and free cash flow.",
    href: "/finance/budget",
    status: "Available",
  },
  {
    title: "Investing",
    description: "Explore monthly contributions, account allocation, and contribution pace.",
    href: "/finance/investing",
    status: "Available",
  },
  {
    title: "Net worth",
    description: "Track the verified net-worth history and balance-sheet metrics.",
    href: "/finance/net-worth",
    status: "Available",
  },
  {
    title: "Income & expenses",
    description: "Compare annual income, expenses, and savings rate.",
    href: "/finance/cash-flow",
    status: "Available",
  },
  {
    title: "Vacations",
    description: "Review trip spending from the semi-structured travel workbooks.",
    href: "/finance/vacations",
    status: "Available",
  },
  {
    title: "Housing",
    description: "Explore move-in costs, furnishing, and recurring apartment expenses.",
    href: "/finance/housing",
    status: "Available",
  },
  {
    title: "FIRE calculator",
    description: "Explore Coast FI, full FI, and long-term portfolio scenarios.",
    href: "/finance/fire",
    status: "Available",
  },
];

export default function FinancePage() {
  return (
    <div className="min-h-screen px-6 py-8 sm:px-10 lg:px-12">
      <p className="text-sm font-medium text-muted-foreground">Module home</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Finance</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        A financial command center for exploring each connected data area.
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Finance areas">
        {financeAreas.map((area) => {
          const content = (
            <>
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-medium group-hover:text-foreground">{area.title}</h2>
              <span className="rounded-full border px-2 py-1 text-[11px] text-muted-foreground">
                {area.status}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{area.description}</p>
            {area.status === "Available" && (
              <span className="mt-5 inline-block text-sm font-medium text-foreground">
                Open area <span aria-hidden="true">→</span>
              </span>
            )}
            </>
          );

          return area.status === "Available" ? (
            <Link key={area.title} href={area.href} className="group rounded-xl border bg-card p-5 transition-colors hover:border-foreground/40 hover:bg-accent/40">
              {content}
            </Link>
          ) : (
            <article key={area.title} className="rounded-xl border bg-card/60 p-5 opacity-80">
              {content}
            </article>
          );
        })}
      </section>
    </div>
  );
}
