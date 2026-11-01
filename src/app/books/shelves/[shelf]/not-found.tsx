import Link from "next/link";

export default function BooksShelfNotFound() {
  return (
    <section className="books-source-error">
      <p className="books-kicker">Unknown shelf</p>
      <h1>No such library shelf</h1>
      <p>The available shelf routes are Read and To Read.</p>
      <Link href="/books" className="books-back-link">← Return to the library</Link>
    </section>
  );
}
