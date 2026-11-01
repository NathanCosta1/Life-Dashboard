import type { ReactNode } from "react";
import "../themes.css";

export default function MusicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="music-theme">
      <div className="music-listening-room min-h-screen px-6 py-8 sm:px-10 lg:px-12">
        {children}
      </div>
    </div>
  );
}
