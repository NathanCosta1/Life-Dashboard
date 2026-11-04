import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./jobs.css";

export const metadata: Metadata = {
  title: "Jobs | Life Dashboard",
  description: "Career roles, dates, compensation, and notes.",
};

export default function JobsLayout({ children }: { children: ReactNode }) {
  return <div className="jobs-theme min-h-screen">{children}</div>;
}
