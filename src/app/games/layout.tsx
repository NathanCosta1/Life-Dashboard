import type { ReactNode } from "react";
import "./games.css";

export default function GamesLayout({ children }: { children: ReactNode }) {
  return <div className="games-theme min-h-screen px-5 py-7 sm:px-8 lg:px-10">{children}</div>;
}
