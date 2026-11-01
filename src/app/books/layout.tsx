import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./books.css";

export const metadata: Metadata = {
  title: "Books | Life Dashboard",
  description: "Personal book catalog and reading archive.",
};

export default function BooksLayout({ children }: { children: ReactNode }) {
  return <div className="books-theme min-h-screen">{children}</div>;
}
