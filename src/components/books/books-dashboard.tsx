"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { BookLibrary, BookRecord } from "@/lib/books/types";

type Props = {
  data: BookLibrary;
};

function displayRating(rating: number | null): string {
  return rating === null ? "Unrated" : `${rating.toFixed(rating % 1 === 0 ? 0 : 1)} ★`;
}

function sortByTitle(a: BookRecord, b: BookRecord) {
  return a.title.localeCompare(b.title);
}

export function BooksDashboard({ data }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<BookRecord | null>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const closeDetails = () => {
    setSelected(null);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useEffect(() => {
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDetails();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selected]);
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const years = useMemo(
    () => Object.entries(data.readByYear).sort(([a], [b]) => a.localeCompare(b)),
    [data.readByYear],
  );
  const maxYearCount = Math.max(...years.map(([, count]) => count), 1);
  const ratedCount = data.books.filter((book) => book.rating !== null).length;
  const ratedBooks = data.books.filter((book) => book.rating !== null);
  const averageRating = ratedBooks.length > 0
    ? ratedBooks.reduce((total, book) => total + (book.rating ?? 0), 0) / ratedBooks.length
    : null;
  const reviewCount = data.books.filter((book) => book.review !== null).length;
  const searchResults = useMemo(
    () => normalizedSearch
      ? data.books.filter((book) =>
          `${book.title} ${book.author} ${book.additionalAuthors.join(" ")}`.toLocaleLowerCase().includes(normalizedSearch),
        ).slice(0, 12)
      : [],
    [data.books, normalizedSearch],
  );

  return (
    <div className="books-catalog">
      <Link href="/" className="books-back-link" aria-label="Back to Life Dashboard">
        <span aria-hidden="true">←</span> Life Dashboard
      </Link>
      <header className="books-masthead">
        <div>
          <p className="books-kicker">Personal catalog / {data.books.length} records</p>
          <h1>The Library</h1>
        </div>
        <label className="books-search">
          <span>Find in the collection</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Title or author"
          />
        </label>
      </header>

      {normalizedSearch && (
        <section className="books-search-results" aria-label="Search results">
          <p>{searchResults.length === 12 ? "First 12 matches" : `${searchResults.length} matches`}</p>
          <div>
            {searchResults.map((book) => (
              <button
                key={book.id}
                type="button"
                onClick={(event) => {
                  triggerRef.current = event.currentTarget;
                  setSelected(book);
                }}
              >
                <span>{book.title}</span>
                <small>{book.author}</small>
              </button>
            ))}
            {searchResults.length === 0 && <span>No books match this search.</span>}
          </div>
        </section>
      )}

      <section className="books-atlas" aria-label="Reading and rating overview">
        <article className="books-year-wall">
          <div className="books-panel-heading">
            <p>Reading years</p>
            <span>Books dated completed</span>
          </div>
          <div className="books-year-spines">
            {years.map(([year, count]) => (
              <Link key={year} href={`/books/years/${year}`} className="books-year-spine" aria-label={`${count} books read in ${year}`}>
                <strong style={{ height: `${Math.max(42, (count / maxYearCount) * 170)}px` }}>{count}</strong>
                <span>{year}</span>
              </Link>
            ))}
          </div>
        </article>

        <article className="books-rating-panel">
          <div className="books-panel-heading">
            <p>Rating distribution</p>
            <span>{ratedCount} rated / {data.books.length - ratedCount} unrated</span>
          </div>
          <div className="books-rating-distribution" aria-label="Book rating distribution">
            {data.ratingBands.filter((band) => band.rating !== "Unrated").map((band) => {
              const maxCount = Math.max(...data.ratingBands.filter((item) => item.rating !== "Unrated").map((item) => item.count), 1);
              return (
                <div className="books-rating-row" key={band.rating}>
                  <span>{band.rating} ★</span>
                  <div className="books-rating-track" aria-hidden="true">
                    <i style={{ width: `${Math.max(band.count ? 4 : 0, (band.count / maxCount) * 100)}%` }} />
                  </div>
                  <strong>{band.count}</strong>
                </div>
              );
            })}
            <div className="books-unrated-row">
              <span>Unrated</span>
              <strong>{data.ratingBands.find((band) => band.rating === "Unrated")?.count ?? 0}</strong>
            </div>
          </div>
          <div className="books-rating-summary">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = data.ratingBands.find((band) => band.rating === String(rating))?.count ?? 0;
              return (
                <span key={rating}>
                  <strong>{count}</strong>
                  <small>{rating}★</small>
                </span>
              );
            })}
          </div>
        </article>
      </section>

      <section className="books-shelf-navigation" aria-label="Library shelves">
        <Link href="/books/shelves/read" className="books-shelf-entrance books-shelf-read">
          <span className="books-shelf-index">01</span>
          <div>
            <p>Completed archive</p>
            <h2>Read</h2>
          </div>
          <strong>{data.read.length}</strong>
          <span className="books-shelf-arrow" aria-hidden="true">→</span>
        </Link>
        <Link href="/books/shelves/to-read" className="books-shelf-entrance books-shelf-waiting">
          <span className="books-shelf-index">02</span>
          <div>
            <p>Reserve collection</p>
            <h2>To Read</h2>
          </div>
          <strong>{data.toRead.length}</strong>
          <span className="books-shelf-arrow" aria-hidden="true">→</span>
        </Link>
      </section>

      <section className="books-ledger-grid">
        <article>
          <div className="books-panel-heading">
            <p>Catalog notes</p>
            <span>Catalog summary</span>
          </div>
          <dl className="books-catalog-notes">
            <div><dt>Reviews present</dt><dd>{reviewCount}</dd></div>
            <div><dt>Rating coverage</dt><dd>{ratedCount} / {data.books.length}</dd></div>
            <div><dt>Average rating</dt><dd>{averageRating === null ? "No ratings" : `${averageRating.toFixed(2)} ★`}</dd></div>
          </dl>
        </article>
      </section>

      {data.issues.length > 0 && (
        <details className="books-source-notes">
          <summary>{data.issues.length} entries need attention</summary>
          <ul>
            {data.issues.slice(0, 20).map((issue, index) => (
              <li key={`${issue.rowNumber}-${issue.field}-${index}`}>
                {issue.field}: {issue.message}
              </li>
            ))}
          </ul>
        </details>
      )}

      <section className="books-recent" aria-label="Recent additions">
        <div className="books-panel-heading">
          <p>Recent acquisitions to the catalog</p>
          <span>Date Added</span>
        </div>
        <div className="books-recent-list">
          {[...data.books]
            .filter((book) => book.dateAdded)
            .sort((a, b) => (b.dateAdded ?? "").localeCompare(a.dateAdded ?? "") || sortByTitle(a, b))
            .slice(0, 6)
            .map((book, index) => (
              <button key={book.id} type="button" onClick={() => setSelected(book)}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{book.title}</strong>
                <small>{book.author}</small>
                <time>{book.dateAdded}</time>
              </button>
            ))}
        </div>
      </section>

      {selected && (
        <div className="books-detail-backdrop" role="presentation" onMouseDown={closeDetails}>
          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${selected.title} details`}
            className="books-detail"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button ref={closeButtonRef} className="books-detail-close" type="button" onClick={closeDetails} aria-label="Close book details">×</button>
            <p className="books-kicker">{selected.exclusiveShelf}</p>
            <h2>{selected.title}</h2>
            <p className="books-detail-author">{selected.author}</p>
            <dl>
              <div><dt>Rating</dt><dd>{displayRating(selected.rating)}</dd></div>
              <div><dt>Pages</dt><dd>{selected.pageCount ?? "Not provided"}</dd></div>
              <div><dt>Published</dt><dd>{selected.publicationYear ?? "Not provided"}</dd></div>
              <div><dt>Date read</dt><dd>{selected.dateRead ?? "Not provided"}</dd></div>
              <div><dt>Added to Goodreads</dt><dd>{selected.dateAdded ?? "Not provided"}</dd></div>
              <div><dt>Read count</dt><dd>{selected.readCount}</dd></div>
            </dl>
          </section>
        </div>
      )}
    </div>
  );
}
