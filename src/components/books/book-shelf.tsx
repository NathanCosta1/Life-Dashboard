"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { BookRecord, MainBookShelf } from "@/lib/books/types";

export function BookShelf({
  shelf,
  books,
}: {
  shelf: MainBookShelf;
  books: BookRecord[];
}) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("title");
  const normalizedSearch = search.trim().toLocaleLowerCase();

  const filtered = useMemo(() => {
    const result = books.filter((book) =>
      !normalizedSearch || `${book.title} ${book.author}`.toLocaleLowerCase().includes(normalizedSearch),
    );
    return [...result].sort((a, b) => {
      if (sort === "author") return a.author.localeCompare(b.author) || a.title.localeCompare(b.title);
      if (sort === "rating") {
        if (a.rating === null && b.rating !== null) return 1;
        if (b.rating === null && a.rating !== null) return -1;
        return (b.rating ?? 0) - (a.rating ?? 0) || a.title.localeCompare(b.title);
      }
      if (sort === "year-read") {
        return (b.dateRead ?? "").localeCompare(a.dateRead ?? "") || a.title.localeCompare(b.title);
      }
      if (sort === "pages") {
        if (a.pageCount === null && b.pageCount !== null) return 1;
        if (b.pageCount === null && a.pageCount !== null) return -1;
        return (b.pageCount ?? 0) - (a.pageCount ?? 0) || a.title.localeCompare(b.title);
      }
      return a.title.localeCompare(b.title);
    });
  }, [books, normalizedSearch, sort]);

  const title = shelf === "read" ? "Read Archive" : "Waiting Library";
  const eyebrow = shelf === "read" ? "Completed books" : "Reserve collection";
  const authorCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const book of books) {
      counts.set(book.author, (counts.get(book.author) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([author, count]) => ({ author, count }))
      .sort((a, b) => b.count - a.count || a.author.localeCompare(b.author))
      .slice(0, 8);
  }, [books]);

  return (
    <div className={`books-catalog books-shelf-page books-shelf-page-${shelf}`}>
      <Link href="/books" className="books-back-link" aria-label="Back to Books library">
        <span aria-hidden="true">←</span> The Library
      </Link>
      <header className="books-shelf-header">
        <div>
          <p className="books-kicker"><Link href="/books">The Library</Link> / {eyebrow}</p>
          <h1>{title}</h1>
          <p className="books-shelf-count">{books.length} source records</p>
        </div>
        <label className="books-search">
          <span>Search this shelf</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Title or author" />
        </label>
      </header>

      <div className="books-shelf-toolbar">
        <label>
          <span>Sort</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="title">Title</option>
            <option value="author">Author</option>
            <option value="pages">Page count</option>
            {shelf === "read" && <option value="rating">Rating</option>}
            {shelf === "read" && <option value="year-read">Date read</option>}
          </select>
        </label>
        <p>{filtered.length} shown</p>
      </div>

      <div className="books-catalog-ledger">
        <table>
          <thead>
            <tr>
              <th>Accession</th>
              <th>Title</th>
              <th>Author</th>
              {shelf === "read" && <th>Rating</th>}
              <th>{shelf === "read" ? "Date read" : "Pages"}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((book, index) => (
              <tr key={book.id}>
                <td>{String(index + 1).padStart(3, "0")}</td>
                <td><strong>{book.title}</strong></td>
                <td>{book.author}</td>
                {shelf === "read" && <td>{book.rating === null ? "Unrated" : `${book.rating} ★`}</td>}
                <td>{shelf === "read" ? (book.dateRead ?? "Not provided") : (book.pageCount ?? "Not provided")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <p className="books-empty">No books match this search.</p>}
      <aside className="books-shelf-authors" aria-label={`Author frequency on ${title}`}>
        <div className="books-panel-heading">
          <p>Authors on this shelf</p>
          <span>Exact source author strings</span>
        </div>
        <ol className="books-author-list">
          {authorCounts.map((item, index) => (
            <li key={item.author}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.author}</strong>
              <em>{item.count}</em>
            </li>
          ))}
          {authorCounts.length === 0 && <li><strong>No matching authors</strong></li>}
        </ol>
      </aside>
    </div>
  );
}
