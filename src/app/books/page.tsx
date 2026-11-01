import { BooksDashboard } from "@/components/books/books-dashboard";
import { loadBooksLibrary } from "@/lib/books/data";

export default async function BooksPage() {
  const data = await loadBooksLibrary();
  return <BooksDashboard data={data} />;
}
