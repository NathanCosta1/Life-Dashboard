import type { ReactNode } from "react";

export default function MusicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen px-6 py-8 sm:px-10 lg:px-12">
      {children}
    </div>
  );
}
