import Link from "next/link";

export default function BooksYearNotFound() {
  return (
    <section className="books-source-error">
      <p className="books-kicker">Reading year</p>
      <h1>No dated reading room</h1>
      <p>This year has no books with a valid Date Read in the source export.</p>
      <Link href="/books" className="books-back-link">← Return to the library</Link>
    </section>
  );
}
