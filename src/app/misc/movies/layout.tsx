import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./movies.css";

export const metadata: Metadata = {
  title: "Movies | MISC | Life Dashboard",
  description: "A cinema-style record of watched movies, ratings, and the watchlist.",
};

export default function MoviesLayout({ children }: { children: ReactNode }) {
  return children;
}
