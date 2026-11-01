import Link from "next/link";
import type { CSSProperties } from "react";
import "./themes.css";

const modules = [
  { label: "Finance", href: "/finance", detail: "Capital & planning", color: "#ef735b" },
  { label: "Music", href: "/music", detail: "Library & playlists", color: "#7fb5d8" },
  { label: "Games", href: "/games", detail: "Library & favorites", color: "#a7d36c" },
  { label: "Meditation", href: "/meditation", detail: "Practice history", color: "#a995cd" },
  { label: "Hikes", href: "/hikes", detail: "Trail journal", color: "#79a17a" },
  { label: "Recipes", href: "/recipes", detail: "Recipes & kitchen", color: "#efad66" },
  { label: "Fitness", href: "/fitness", detail: "Training & progress", color: "#ffcf43" },
  { label: "Career", href: "/career", detail: "Skills & development", color: "#70c1ad" },
  { label: "Secret", href: "/secret", detail: "Private records", color: "#b9b3aa" },
];

export default function Home() {
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date());

  return (
    <div className="life-theme">
      <header className="life-dashboard-header">
        <div>
          <p className="life-dashboard-kicker">Personal operating system</p>
          <h1>Life / Index</h1>
        </div>
        <p className="life-dashboard-date">{dateLabel}</p>
      </header>

      <section className="dashboard-modules" aria-label="Life dashboard modules">
        {modules.map((module, index) => (
          <Link
            key={module.href}
            href={module.href}
            className={`module-poster module-poster-${module.label.toLowerCase().replace(/\s+/g, "-")}`}
            style={{ "--module-color": module.color } as CSSProperties}
          >
            <span className="module-poster-number">{String(index + 1).padStart(2, "0")}</span>
            <span className="module-poster-detail">{module.detail}</span>
            <strong>{module.label}</strong>
            <span className="module-poster-arrow" aria-hidden="true">↗</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
