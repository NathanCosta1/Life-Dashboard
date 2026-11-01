import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./misc.css";

export const metadata: Metadata = {
  title: "MISC | Life Dashboard",
  description: "One-off collections and miscellaneous personal pages.",
};

export default function MiscLayout({ children }: { children: ReactNode }) {
  return <div className="misc-theme min-h-screen">{children}</div>;
}
