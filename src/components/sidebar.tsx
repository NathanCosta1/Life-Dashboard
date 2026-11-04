"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const navigation = [
  { label: "Dashboard", href: "/" },
  { label: "Finance", href: "/finance" },
  { label: "Music", href: "/music" },
  { label: "Games", href: "/games" },
  { label: "Books", href: "/books" },
  { label: "Jobs", href: "/jobs" },
  { label: "Fitness", href: "/fitness" },
  { label: "Recipes", href: "/recipes" },
  { label: "Hikes", href: "/hikes" },
  { label: "Meditation", href: "/meditation" },
  { label: "MISC", href: "/misc" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navigationRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const firstLink = navigationRef.current?.querySelector<HTMLAnchorElement>("a");
    firstLink?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !navigationRef.current) return;
      const focusable = Array.from(
        navigationRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <div className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-6 backdrop-blur lg:hidden">
        <Link href="/" className="min-w-0 font-semibold tracking-tight" onClick={() => setIsOpen(false)}>
          Life Dashboard
        </Link>
        <button
          ref={menuButtonRef}
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
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-x-0 bottom-0 top-16 z-[29] bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside
        id="mobile-navigation"
        className={`${isOpen ? "block" : "hidden"} fixed inset-x-0 top-16 z-30 max-h-[calc(100vh-4rem)] overflow-y-auto border-b bg-background px-6 py-4 lg:fixed lg:inset-y-0 lg:left-0 lg:top-0 lg:block lg:w-64 lg:border-r lg:border-b-0 lg:px-4 lg:py-6`}
      >
        <div className="hidden px-3 lg:block">
          <Link href="/" className="font-semibold tracking-tight">
            Life Dashboard
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">Personal operating system</p>
        </div>
        <nav ref={navigationRef} className="mt-2 flex flex-col gap-1 lg:mt-8" aria-label="Main navigation">
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
      </aside>
    </>
  );
}
