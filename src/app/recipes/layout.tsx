import type { ReactNode } from "react";
import "../themes.css";

export default function RecipesLayout({ children }: { children: ReactNode }) {
  return <div className="recipes-theme">{children}</div>;
}
