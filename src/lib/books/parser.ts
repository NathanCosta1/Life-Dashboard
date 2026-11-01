import { booksSource } from "./sources";
import type { BookIssue, BookLibrary, BookRecord, SourceBookShelf } from "./types";

function normalizeHeader(value: string): string {
  return value.trim().normalize("NFKD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
}

function isBlankRow(row: readonly string[]): boolean {
  return row.every((cell) => !String(cell ?? "").trim());
}

function parseInteger(value: string): number | null {
  const trimmed = value.trim();
  return /^-?\d+$/.test(trimmed) ? Number(trimmed) : null;
}

function parseRating(value: string): number | null {
  const rating = Number(value.trim());
  if (!Number.isFinite(rating) || rating === 0 || rating < 1 || rating > 5 || !Number.isInteger(rating * 2)) {
    return null;
  }
  return rating;
}

function parseDate(value: string): string | null {
  const match = value.trim().match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day)
    ? `${year}/${month}/${day}`
    : null;
}

function splitSourceList(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function normalizeIdentity(value: string): string {
  return value.normalize("NFKD").replace(/\p{Diacritic}/gu, "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function parseBooksLibrary(rows: readonly (readonly string[])[]): BookLibrary {
  const issues: BookIssue[] = [];
  const headerIndex = rows.slice(0, 20).findIndex((row) => {
    const headers = row.map(normalizeHeader);
    return ["title", "author", "exclusiveshelf"].every((name) =>
      headers.includes(normalizeHeader(name)),
    );
  });

  if (headerIndex === -1) {
    return {
      books: [],
      read: [],
      toRead: [],
      ratingBands: [],
      readByYear: {},
      authorCounts: [],
      issues: [{
        source: "books",
        tab: booksSource.tab,
        rowNumber: 1,
        field: "headers",
        message: "Expected Title, Author, and Exclusive Shelf headers were not found.",
      }],
    };
  }

  const headers = rows[headerIndex].map(normalizeHeader);
  const column = (name: string) => headers.indexOf(normalizeHeader(name));
  const columns = {
    id: column("Book Id"),
    title: column("Title"),
    author: column("Author"),
    additionalAuthors: column("Additional Authors"),
    isbn: column("ISBN"),
    isbn13: column("ISBN13"),
    rating: column("My Rating"),
    publisher: column("Publisher"),
    binding: column("Binding"),
    pages: column("Number of Pages"),
    publicationYear: column("Year Published"),
    originalPublicationYear: column("Original Publication Year"),
    dateRead: column("Date Read"),
    dateAdded: column("Date Added"),
    bookshelves: column("Bookshelves"),
    bookshelfPositions: column("Bookshelves with positions"),
    exclusiveShelf: column("Exclusive Shelf"),
    review: column("My Review"),
    readCount: column("Read Count"),
  };
  const seen = new Set<string>();
  const books: BookRecord[] = [];

  for (let index = headerIndex + 1; index < rows.length; index += 1) {
    const row = rows[index];
    if (isBlankRow(row)) continue;
    const title = String(row[columns.title] ?? "").trim();
    const author = String(row[columns.author] ?? "").trim();
    const exclusiveRaw = String(row[columns.exclusiveShelf] ?? "").trim().toLocaleLowerCase();
    if (!title || !author || !["read", "to-read", "currently-reading", "did-not-finish"].includes(exclusiveRaw)) {
      issues.push({
        source: "books",
        tab: booksSource.tab,
        rowNumber: index + 1,
        field: !title ? "Title" : !author ? "Author" : "Exclusive Shelf",
        message: !title || !author
          ? "Book row is missing its title or author."
          : "Book row has an unsupported exclusive shelf value.",
      });
      continue;
    }

    const sourceBookId = String(row[columns.id] ?? "").trim();
    const identity = normalizeIdentity(`${title}\u0000${author}\u0000${sourceBookId}`);
    if (seen.has(identity)) continue;
    seen.add(identity);

    const ratingValue = String(row[columns.rating] ?? "").trim();
    const rating = ratingValue ? parseRating(ratingValue) : null;
    if (ratingValue && rating === null && ratingValue !== "0") {
      issues.push({
        source: "books",
        tab: booksSource.tab,
        rowNumber: index + 1,
        field: "My Rating",
        message: "Rating is outside the supported Goodreads range or format.",
      });
    }

    books.push({
      id: sourceBookId ? `book-${sourceBookId}` : `book-${normalizeIdentity(title)}-${normalizeIdentity(author)}`,
      sourceBookId,
      title,
      author,
      additionalAuthors: splitSourceList(String(row[columns.additionalAuthors] ?? "")),
      isbn: String(row[columns.isbn] ?? "").trim() || null,
      isbn13: String(row[columns.isbn13] ?? "").trim() || null,
      rating,
      publisher: String(row[columns.publisher] ?? "").trim() || null,
      binding: String(row[columns.binding] ?? "").trim() || null,
      pageCount: parseInteger(String(row[columns.pages] ?? "")),
      publicationYear: parseInteger(String(row[columns.publicationYear] ?? "")),
      originalPublicationYear: parseInteger(String(row[columns.originalPublicationYear] ?? "")),
      dateRead: parseDate(String(row[columns.dateRead] ?? "")),
      dateAdded: parseDate(String(row[columns.dateAdded] ?? "")),
      bookshelves: splitSourceList(String(row[columns.bookshelves] ?? "")),
      bookshelfPositions: splitSourceList(String(row[columns.bookshelfPositions] ?? "")),
      exclusiveShelf: exclusiveRaw as SourceBookShelf,
      review: String(row[columns.review] ?? "").trim() || null,
      readCount: parseInteger(String(row[columns.readCount] ?? "")) ?? 0,
      sourceRow: index + 1,
    });
  }

  const read = books.filter((book) => book.exclusiveShelf === "read");
  const toRead = books.filter((book) => book.exclusiveShelf === "to-read");
  const ratingDistribution = new Map<string, number>();
  for (const book of books) {
    const label = book.rating === null ? "unrated" : String(book.rating);
    ratingDistribution.set(label, (ratingDistribution.get(label) ?? 0) + 1);
  }
  const ratingBands = [
    { rating: "5", count: ratingDistribution.get("5") ?? 0 },
    { rating: "4.5", count: ratingDistribution.get("4.5") ?? 0 },
    { rating: "4", count: ratingDistribution.get("4") ?? 0 },
    { rating: "3", count: ratingDistribution.get("3") ?? 0 },
    { rating: "2", count: ratingDistribution.get("2") ?? 0 },
    { rating: "1", count: ratingDistribution.get("1") ?? 0 },
    { rating: "Unrated", count: ratingDistribution.get("unrated") ?? 0 },
  ];
  const readByYear: Record<string, number> = {};
  for (const book of read) {
    if (!book.dateRead) continue;
    const year = book.dateRead.slice(0, 4);
    readByYear[year] = (readByYear[year] ?? 0) + 1;
  }
  const authorCounts = new Map<string, number>();
  for (const book of books) {
    authorCounts.set(book.author, (authorCounts.get(book.author) ?? 0) + 1);
  }

  return {
    books,
    read,
    toRead,
    ratingBands,
    readByYear,
    authorCounts: [...authorCounts.entries()]
      .map(([author, count]) => ({ author, count }))
      .sort((a, b) => b.count - a.count || a.author.localeCompare(b.author))
      .slice(0, 20),
    issues,
  };
}
