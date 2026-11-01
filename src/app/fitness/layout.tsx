import type { ReactNode } from "react";
import "../themes.css";

export default function FitnessLayout({ children }: { children: ReactNode }) {
  return <div className="fitness-theme">{children}</div>;
}
