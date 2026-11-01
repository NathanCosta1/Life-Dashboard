export type SourceBookShelf =
  | "read"
  | "to-read"
  | "currently-reading"
  | "did-not-finish";

export type MainBookShelf = "read" | "to-read";

export type BookRecord = {
  id: string;
  sourceBookId: string;
  title: string;
  author: string;
  additionalAuthors: string[];
  isbn: string | null;
  isbn13: string | null;
  rating: number | null;
  publisher: string | null;
  binding: string | null;
  pageCount: number | null;
  publicationYear: number | null;
  originalPublicationYear: number | null;
  dateRead: string | null;
  dateAdded: string | null;
  bookshelves: string[];
  bookshelfPositions: string[];
  exclusiveShelf: SourceBookShelf;
  review: string | null;
  readCount: number;
  sourceRow: number;
};

export type BookIssue = {
  source: "books";
  tab: string;
  rowNumber: number;
  field: string;
  message: string;
};

export type RatingBand = {
  rating: string;
  count: number;
};

export type BookLibrary = {
  books: BookRecord[];
  read: BookRecord[];
  toRead: BookRecord[];
  ratingBands: RatingBand[];
  readByYear: Record<string, number>;
  authorCounts: Array<{ author: string; count: number }>;
  issues: BookIssue[];
};
