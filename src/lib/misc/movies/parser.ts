import type {
  MovieIssue,
  MovieReview,
  MovieWatchlistItem,
  MovieYearSummary,
  MoviesLibrary,
  NamedCount,
} from "./types";

const REVIEW_HEADERS = ["Movie", "Watched Date", "Rating", "With Who?", "Where?", "Notes / Review"];
const WATCH_HEADERS = ["Title", "Did Maddy say she is interested?", "Description"];

function normalizeHeader(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function validateHeaders(rows: readonly (readonly string[])[], expected: readonly string[], tab: MovieIssue["tab"], issues: MovieIssue[]) {
  const actual = (rows[0] ?? []).map(normalizeHeader);
  for (const header of expected) {
    if (!actual.includes(normalizeHeader(header))) {
      issues.push({ source: "movies", tab, rowNumber: 1, field: header, message: `Missing expected header "${header}".` });
    }
  }
}

function getColumn(rows: readonly (readonly string[])[], header: string) {
  return (rows[0] ?? []).findIndex((value) => normalizeHeader(String(value)) === normalizeHeader(header));
}

function parseDate(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (iso) {
    const [, year, month, day] = iso;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    return date.getUTCFullYear() === Number(year) && date.getUTCMonth() === Number(month) - 1 && date.getUTCDate() === Number(day) ? value : null;
  }
  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(value);
  if (!slash) return null;
  const [, monthRaw, dayRaw, yearRaw] = slash;
  let year = Number(yearRaw);
  if (yearRaw.length === 2) year += year >= 70 ? 1900 : 2000;
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseRating(raw: string): number | null {
  const match = /^(\d+(?:\.\d+)?)\s*\/\s*10$/.exec(raw.trim());
  if (!match) return null;
  const rating = Number(match[1]);
  return rating >= 0 && rating <= 10 ? rating : null;
}

function sortedNamedCounts(values: string[]): NamedCount[] {
  const counts = new Map<string, { name: string; count: number }>();
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLocaleLowerCase();
    const existing = counts.get(key);
    counts.set(key, { name: existing?.name ?? trimmed, count: (existing?.count ?? 0) + 1 });
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function parseInterest(raw: string): boolean | null {
  const value = raw.trim().toLowerCase();
  if (!value) return null;
  if (/^(y|yes|true|interested)$/.test(value)) return true;
  if (/^(n|no|false|not interested)$/.test(value)) return false;
  return null;
}

export function parseMoviesLibrary(
  reviewRows: readonly (readonly string[])[],
  watchlistRows: readonly (readonly string[])[],
): MoviesLibrary {
  const issues: MovieIssue[] = [];
  validateHeaders(reviewRows, REVIEW_HEADERS, "Reviews / Notes", issues);
  validateHeaders(watchlistRows, WATCH_HEADERS, "To Watch", issues);

  const reviewTitle = getColumn(reviewRows, "Movie");
  const reviewDate = getColumn(reviewRows, "Watched Date");
  const reviewRating = getColumn(reviewRows, "Rating");
  const reviewCompanions = getColumn(reviewRows, "With Who?");
  const reviewLocation = getColumn(reviewRows, "Where?");
  const reviewNotes = getColumn(reviewRows, "Notes / Review");
  const reviews: MovieReview[] = [];

  for (let index = 1; index < reviewRows.length; index += 1) {
    const row = reviewRows[index] ?? [];
    if (row.every((cell) => !String(cell ?? "").trim())) continue;
    const rowNumber = index + 1;
    const title = String(row[reviewTitle] ?? "").trim();
    if (!title) {
      issues.push({ source: "movies", tab: "Reviews / Notes", rowNumber, field: "Movie", message: "Blank movie title skipped." });
      continue;
    }
    const dateLabel = String(row[reviewDate] ?? "").trim() || null;
    const date = dateLabel ? parseDate(dateLabel) : null;
    if (dateLabel && !date) {
      issues.push({ source: "movies", tab: "Reviews / Notes", rowNumber, field: "Watched Date", message: `Date "${dateLabel}" could not be parsed unambiguously.` });
    }
    const rawRating = String(row[reviewRating] ?? "").trim();
    const rating = rawRating ? parseRating(rawRating) : null;
    if (rawRating && rating === null) {
      issues.push({ source: "movies", tab: "Reviews / Notes", rowNumber, field: "Rating", message: `Rating "${rawRating}" was not a valid n/10 value.` });
    }
    const companionText = String(row[reviewCompanions] ?? "").trim() || null;
    const companions = companionText ? companionText.split(/[,&]/).map((name) => name.trim()).filter(Boolean) : [];
    const location = String(row[reviewLocation] ?? "").trim() || null;
    const notes = String(row[reviewNotes] ?? "").replace(/\r\n/g, "\n").trim() || null;
    reviews.push({ id: `${rowNumber}-${title}`, title, watchedDate: date, watchedDateLabel: dateLabel, rating, ratingScale: 10, companions, companionText, location, notes, sourceRowNumber: rowNumber });
  }

  const seenReviews = new Map<string, number>();
  for (const review of reviews) {
    const key = `${review.title.toLocaleLowerCase()}|${review.watchedDate ?? ""}`;
    const first = seenReviews.get(key);
    if (first !== undefined) {
      issues.push({ source: "movies", tab: "Reviews / Notes", rowNumber: review.sourceRowNumber, field: "Movie", message: `Duplicate movie/title and date combination; first appeared on source row ${first}.` });
    } else {
      seenReviews.set(key, review.sourceRowNumber);
    }
  }

  const watchTitle = getColumn(watchlistRows, "Title");
  const watchInterest = getColumn(watchlistRows, "Did Maddy say she is interested?");
  const watchDescription = getColumn(watchlistRows, "Description");
  const watchlist: MovieWatchlistItem[] = [];
  for (let index = 1; index < watchlistRows.length; index += 1) {
    const row = watchlistRows[index] ?? [];
    if (row.every((cell) => !String(cell ?? "").trim())) continue;
    const rowNumber = index + 1;
    const title = String(row[watchTitle] ?? "").trim();
    if (!title) {
      issues.push({ source: "movies", tab: "To Watch", rowNumber, field: "Title", message: "Blank watchlist title skipped." });
      continue;
    }
    const interestRaw = String(row[watchInterest] ?? "").trim();
    const interestedByMaddy = parseInterest(interestRaw);
    if (interestRaw && interestedByMaddy === null) {
      issues.push({ source: "movies", tab: "To Watch", rowNumber, field: "Did Maddy say she is interested?", message: `Interest value "${interestRaw}" was not recognized.` });
    }
    const description = String(row[watchDescription] ?? "").replace(/\r\n/g, "\n").trim() || null;
    watchlist.push({ id: `${rowNumber}-${title}`, title, interestedByMaddy, description, sourceRowNumber: rowNumber });
  }

  const ratedReviews = reviews.filter((review) => review.rating !== null);
  const ratings = ratedReviews.map((review) => review.rating as number).sort((a, b) => a - b);
  const averageRating = ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : null;
  const medianRating = ratings.length ? (ratings.length % 2 ? ratings[Math.floor(ratings.length / 2)] : (ratings[ratings.length / 2 - 1] + ratings[ratings.length / 2]) / 2) : null;
  const highestRatedReview = ratedReviews.reduce<MovieReview | null>((best, review) => !best || (review.rating as number) > (best.rating as number) ? review : best, null);
  const lowestRatedReview = ratedReviews.reduce<MovieReview | null>((best, review) => !best || (review.rating as number) < (best.rating as number) ? review : best, null);
  const datedReviews = reviews.filter((review) => review.watchedDate !== null).sort((a, b) => (a.watchedDate as string).localeCompare(b.watchedDate as string));

  const yearMap = new Map<number, MovieReview[]>();
  for (const review of datedReviews) {
    const year = Number((review.watchedDate as string).slice(0, 4));
    yearMap.set(year, [...(yearMap.get(year) ?? []), review]);
  }
  const yearlySummaries: MovieYearSummary[] = [...yearMap.entries()].sort(([a], [b]) => a - b).map(([year, yearReviews]) => {
    const yearRatings = yearReviews.map((review) => review.rating).filter((rating): rating is number => rating !== null);
    return {
      year,
      reviewCount: yearReviews.length,
      ratedCount: yearRatings.length,
      averageRating: yearRatings.length ? yearRatings.reduce((sum, rating) => sum + rating, 0) / yearRatings.length : null,
    };
  });

  return {
    title: "Movies",
    reviews,
    watchlist,
    issues,
    summary: {
      reviewCount: reviews.length,
      watchlistCount: watchlist.length,
      ratedCount: ratedReviews.length,
      averageRating,
      medianRating,
      highestRatedReview,
      lowestRatedReview,
      firstWatch: datedReviews[0] ?? null,
      latestWatch: datedReviews.at(-1) ?? null,
      companionCounts: sortedNamedCounts(reviews.flatMap((review) => review.companions)),
      locationCounts: sortedNamedCounts(reviews.map((review) => review.location ?? "")),
      yearlySummaries,
      notesCount: reviews.filter((review) => review.notes !== null).length,
      markedInterestedWatchlistCount: watchlist.filter((item) => item.interestedByMaddy === true).length,
    },
  };
}
