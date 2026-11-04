import Link from "next/link";

export default function BooksYearNotFound() {
  return (
    <section className="books-source-error">
      <p className="books-kicker">Reading year</p>
      <h1>No dated reading room</h1>
      <p>No books have a valid read date for this year.</p>
      <Link href="/books" className="books-back-link">← Return to the library</Link>
    </section>
  );
}
