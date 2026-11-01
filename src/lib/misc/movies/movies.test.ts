import { describe, expect, it } from "vitest";
import { parseMoviesLibrary } from "./parser";

const reviewHeaders = [["Movie", "Watched Date", "Rating", "With Who?", "Where?", "Notes / Review"]];
const watchHeaders = [["Title", "Did Maddy say she is interested?", "Description"]];

describe("parseMoviesLibrary", () => {
  it("preserves titles, notes, companions, locations, and valid ratings", () => {
    const result = parseMoviesLibrary(
      [
        ...reviewHeaders,
        ["Nightcrawler", "10/26/2026", "7/10", "Maddy, Sam", "Home Theater", "Tense. Slow burn.\nGreat final act."],
      ],
      watchHeaders,
    );
    expect(result.reviews).toHaveLength(1);
    expect(result.reviews[0].watchedDate).toBe("2026-10-26");
    expect(result.reviews[0].rating).toBe(7);
    expect(result.reviews[0].companions).toEqual(["Maddy", "Sam"]);
    expect(result.reviews[0].notes).toBe("Tense. Slow burn.\nGreat final act.");
    expect(result.summary.averageRating).toBe(7);
  });

  it("uses null and diagnostics for malformed ratings and dates instead of inventing values", () => {
    const result = parseMoviesLibrary(
      [
        ...reviewHeaders,
        ["Bad Date", "13/40/2026", "11/10", "Maddy", "Home"],
      ],
      watchHeaders,
    );
    expect(result.reviews[0].watchedDate).toBeNull();
    expect(result.reviews[0].rating).toBeNull();
    expect(result.summary.averageRating).toBeNull();
    expect(result.issues.some((issue) => issue.field === "Watched Date")).toBe(true);
    expect(result.issues.some((issue) => issue.field === "Rating")).toBe(true);
  });

  it("derives yearly attendance, median rating, rankings, and named counts", () => {
    const result = parseMoviesLibrary(
      [
        ...reviewHeaders,
        ["The Housemaid", "12/23/2025", "3/10", "Maddy", "Dartmouth AMC"],
        ["American Psycho", "10/18/2026", "6/10", "Maddy", "Home"],
        ["Nightcrawler", "10/26/2026", "7/10", "Maddy", "Home"],
      ],
      watchHeaders,
    );
    expect(result.summary.reviewCount).toBe(3);
    expect(result.summary.medianRating).toBe(6);
    expect(result.summary.highestRatedReview?.title).toBe("Nightcrawler");
    expect(result.summary.lowestRatedReview?.title).toBe("The Housemaid");
    expect(result.summary.yearlySummaries.map((year) => [year.year, year.reviewCount])).toEqual([[2025, 1], [2026, 2]]);
    expect(result.summary.companionCounts[0]).toEqual({ name: "Maddy", count: 3 });
    expect(result.summary.locationCounts.find((count) => count.name === "Home")?.count).toBe(2);
  });

  it("preserves the watchlist and normalizes only explicit interest markers", () => {
    const result = parseMoviesLibrary(
      reviewHeaders,
      [
        ...watchHeaders,
        ["The Matrix", "Yes", "A hacker learns..."],
        ["Scarface", "", "Crime drama"],
        ["Pulp Fiction", "Maybe", "Could be interesting"],
      ],
    );
    expect(result.watchlist).toHaveLength(3);
    expect(result.watchlist[0].interestedByMaddy).toBe(true);
    expect(result.watchlist[1].interestedByMaddy).toBeNull();
    expect(result.watchlist[2].interestedByMaddy).toBeNull();
    expect(result.summary.markedInterestedWatchlistCount).toBe(1);
  });

  it("reports duplicate title and date combinations without removing either row", () => {
    const result = parseMoviesLibrary(
      [
        ...reviewHeaders,
        ["Matrix", "1/1/2026", "8/10", "", "Home"],
        ["Matrix", "1/1/2026", "9/10", "", "Theater"],
      ],
      watchHeaders,
    );
    expect(result.reviews).toHaveLength(2);
    expect(result.issues.some((issue) => issue.message.includes("Duplicate"))).toBe(true);
  });
});
