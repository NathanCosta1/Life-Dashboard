import { notFound } from "next/navigation";
import { BookShelf } from "@/components/books/book-shelf";
import { loadBooksLibrary } from "@/lib/books/data";
import type { MainBookShelf } from "@/lib/books/types";

export default async function BooksShelfPage({
  params,
}: {
  params: Promise<{ shelf: string }>;
}) {
  const { shelf } = await params;
  if (shelf !== "read" && shelf !== "to-read") notFound();

  const data = await loadBooksLibrary();
  const books = shelf === "read" ? data.read : data.toRead;
  return <BookShelf shelf={shelf as MainBookShelf} books={books} />;
}
