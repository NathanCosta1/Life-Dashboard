"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
  { label: "Dashboard", href: "/" },
  { label: "Finance", href: "/finance" },
  { label: "Recipes & Kitchen", href: "/recipes" },
  { label: "Fitness", href: "/fitness" },
  { label: "Career & Learning", href: "/career" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-6 backdrop-blur lg:hidden">
        <Link href="/" className="min-w-0 font-semibold tracking-tight" onClick={() => setIsOpen(false)}>
          Life Dashboard
        </Link>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
          className="flex-none whitespace-nowrap rounded-md border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? "Close" : "Menu"}
        </button>
      </div>
      <aside
        id="mobile-navigation"
        className={`${isOpen ? "block" : "hidden"} fixed inset-x-0 top-16 z-30 border-b bg-background px-6 py-4 lg:fixed lg:inset-y-0 lg:left-0 lg:top-0 lg:block lg:w-64 lg:border-r lg:border-b-0 lg:px-4 lg:py-6`}
      >
        <div className="hidden px-3 lg:block">
          <Link href="/" className="font-semibold tracking-tight">
            Life Dashboard
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">Personal operating system</p>
        </div>
        <nav className="mt-2 flex flex-col gap-1 lg:mt-8" aria-label="Main navigation">
          {navigation.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setIsOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-8 hidden border-t px-3 pt-5 lg:block">
          <p className="text-xs text-muted-foreground">Data source</p>
          <p className="mt-1 text-sm">Google Sheets</p>
          <p className="mt-1 text-xs text-emerald-400">Connected</p>
        </div>
      </aside>
    </>
  );
}
