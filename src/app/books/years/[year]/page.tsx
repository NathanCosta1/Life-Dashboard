import Link from "next/link";
import { notFound } from "next/navigation";
import { loadBooksLibrary } from "@/lib/books/data";

export default async function BooksYearPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  if (!/^20\d{2}$/.test(year)) notFound();
  const data = await loadBooksLibrary();
  const books = data.read
    .filter((book) => book.dateRead?.startsWith(`${year}/`))
    .sort((a, b) => (a.dateRead ?? "").localeCompare(b.dateRead ?? ""));
  if (books.length === 0) notFound();

  const ratings = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: books.filter((book) => book.rating === rating).length,
  }));

  return (
    <div className="books-catalog books-year-room">
      <Link href="/books" className="books-back-link" aria-label="Back to Books library">
        <span aria-hidden="true">←</span> The Library
      </Link>
      <header className="books-shelf-header">
        <div>
          <p className="books-kicker"><Link href="/books">The Library</Link> / Reading year</p>
          <h1>{year}</h1>
          <p className="books-shelf-count">{books.length} books dated completed</p>
        </div>
      </header>
      <div className="books-year-layout">
        <aside>
          <p>Rating ledger</p>
          {ratings.map((item) => <div key={item.rating}><span>{item.rating} ★</span><strong>{item.count}</strong></div>)}
          <div><span>Unrated</span><strong>{books.filter((book) => book.rating === null).length}</strong></div>
        </aside>
        <ol className="books-year-timeline">
          {books.map((book) => (
            <li key={book.id}>
              <time>{book.dateRead}</time>
              <div><h2>{book.title}</h2><p>{book.author}</p></div>
              <strong>{book.rating === null ? "Unrated" : `${book.rating} ★`}</strong>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
