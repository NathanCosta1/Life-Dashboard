"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import "../themes.css";

export default function FinanceLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pageTheme = pathname.includes("/net-worth")
    ? "finance-net-worth"
    : pathname.includes("/budget")
      ? "finance-budget"
      : pathname.includes("/investing")
        ? "finance-investing"
        : pathname.includes("/fire")
          ? "finance-fire"
          : pathname.includes("/vacations")
            ? "finance-vacations"
            : pathname.includes("/housing")
              ? "finance-housing"
              : "";

  return <div className={`finance-theme ${pageTheme}`}>{children}</div>;
}
