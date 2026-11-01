export type MovieReview = {
  id: string;
  title: string;
  watchedDate: string | null;
  watchedDateLabel: string | null;
  rating: number | null;
  ratingScale: 10;
  companions: string[];
  companionText: string | null;
  location: string | null;
  notes: string | null;
  sourceRowNumber: number;
};

export type MovieWatchlistItem = {
  id: string;
  title: string;
  interestedByMaddy: boolean | null;
  description: string | null;
  sourceRowNumber: number;
};

export type MovieIssue = {
  source: "movies";
  tab: "Reviews / Notes" | "To Watch";
  rowNumber: number;
  field: string;
  message: string;
};

export type NamedCount = {
  name: string;
  count: number;
};

export type MovieYearSummary = {
  year: number;
  reviewCount: number;
  ratedCount: number;
  averageRating: number | null;
};

export type MovieSummary = {
  reviewCount: number;
  watchlistCount: number;
  ratedCount: number;
  averageRating: number | null;
  medianRating: number | null;
  highestRatedReview: MovieReview | null;
  lowestRatedReview: MovieReview | null;
  firstWatch: MovieReview | null;
  latestWatch: MovieReview | null;
  companionCounts: NamedCount[];
  locationCounts: NamedCount[];
  yearlySummaries: MovieYearSummary[];
  notesCount: number;
  markedInterestedWatchlistCount: number;
};

export type MoviesLibrary = {
  title: string;
  reviews: MovieReview[];
  watchlist: MovieWatchlistItem[];
  summary: MovieSummary;
  issues: MovieIssue[];
};
