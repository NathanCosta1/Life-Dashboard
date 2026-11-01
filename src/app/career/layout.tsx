import type { ReactNode } from "react";
import "../themes.css";

export default function CareerLayout({ children }: { children: ReactNode }) {
  return <div className="career-theme">{children}</div>;
}
