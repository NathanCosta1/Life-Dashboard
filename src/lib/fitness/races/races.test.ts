import { describe, expect, it } from "vitest";
import { parseRaceLibrary } from "./parser";

const headers = [[
  "Name", "Location", "Date", "DOW", "Time Of Day", "Ran w/", "Training", "Goals",
  "Time", "Place", "Splits", "My Watch Stats", "Course Conditions", "Weather",
  "Weight", "Price", "Amenities", "Playlist", "Results Link", "Pictures Link", "MISC",
]];

describe("parseRaceLibrary", () => {
  it("uses a named owner result for a multiline 10K personal best", () => {
    const result = parseRaceLibrary([
      ...headers,
      ["Harbor 10K", "", "6/8/2024", "", "", "", "", "", "Me: 0:59:30\nMaddy: 1:10:00", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["City 10K", "", "6/8/2025", "", "", "", "", "", "Me: 58:45\nMaddy: 1:08:00", "", "", "", "", "", "", "", "", "", "", "", ""],
    ], new Date("2026-11-01T12:00:00"));
    const best = result.summary.personalBests.find((item) => item.distance === "10k");
    expect(best?.race.name).toBe("City 10K");
  });

  it("derives a 10K personal best from a scalar result with pace text", () => {
    const result = parseRaceLibrary([
      ...headers,
      ["Capital City Stampede 10K Road Race", "", "6/8/2024", "", "", "", "", "", "1:19:39 (12:49 pace)", "", "", "", "", "", "", "", "", "", "", "", ""],
    ], new Date("2026-11-01T12:00:00"));
    const best = result.summary.personalBests.find((item) => item.distance === "10k");
    expect(best?.race.primaryTimeSeconds).toBe(4779);
    expect(best?.race.primaryTimeLabel).toBe("1:19:39 (12:49 pace)");
  });

  it("recognizes Deep Run Park Run events as 5K and uses named owner results", () => {
    const result = parseRaceLibrary([
      ...headers,
      ["Deep Run Park Run (Event 330)", "", "4/19/2026", "", "", "", "", "", "Me: 20:41\nMaddy: 29:14", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["Deep Run Park Run (Event 302)", "", "8/2/2025", "", "", "", "", "", "19:52", "", "", "", "", "", "", "", "", "", "", "", ""],
    ], new Date("2026-11-01T12:00:00"));
    expect(result.races.every((race) => race.distance === "5k")).toBe(true);
    const best = result.summary.personalBests.find((item) => item.distance === "5k");
    expect(best?.race.name).toBe("Deep Run Park Run (Event 302)");
  });

  it("uses the owner's multiline result for personal-best comparisons", () => {
    const result = parseRaceLibrary([
      ...headers,
      ["Northfield 5K", "", "8/31/2024", "", "", "", "", "", "20:38", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["Cranky Crab 5k", "", "5/17/2026", "", "", "", "", "", "Me: 19:11\nKarpicz: 20:30\nMatthew: 20:31", "", "", "", "", "", "", "", "", "", "", "", ""],
    ], new Date("2026-11-01T12:00:00"));
    const best = result.summary.personalBests.find((item) => item.distance === "5k");
    expect(best?.race.name).toBe("Cranky Crab 5k");
    expect(best?.race.people[0].resultTimeSeconds).toBe(1151);
  });

  it("normalizes dates, 5K times, and derives personal bests within the 5K distance", () => {
    const result = parseRaceLibrary([
      ...headers,
      ["Northfield 5K", "Northfield, VT", "8/31/2024", "Saturday", "", "", "", "", "20:38", "16/143", "", "", "", "", "", "", "", "", "", "", ""],
      ["Westwood Day 5k", "Westwood, MA", "9/23/2023", "Saturday", "", "", "", "", "36:45:00", "167 & 168/184", "", "", "", "", "", "", "", "", "", "", ""],
    ], new Date("2026-11-01T12:00:00"));
    expect(result.races[0].date).toBe("2023-09-23");
    expect(result.races[0].primaryTimeSeconds).toBe(2205);
    expect(result.summary.personalBests.find((best) => best.distance === "5k")?.race.name).toBe("Northfield 5K");
  });

  it("keeps multiline multi-person results separate from the primary race result field", () => {
    const result = parseRaceLibrary([
      ...headers,
      ["CarMax Richmond Half Marathon", "Richmond, VA", "11/14/2026", "", "", "Maddy, Dad", "", "", "Me: 1:39:57\nMaddy: 2:23:08", "", "", "", "", "", "", "", "", "", "", "", ""],
    ], new Date("2026-11-01T12:00:00"));
    expect(result.races[0].distance).toBe("half-marathon");
    expect(result.races[0].primaryTimeSeconds).toBeNull();
    expect(result.races[0].people).toHaveLength(2);
    expect(result.races[0].people[0].name).toBe("Me");
    expect(result.races[0].people[0].resultTimeSeconds).toBe(5997);
    expect(result.races[0].status).toBe("upcoming");
  });

  it("marks future rows without a result as upcoming and preserves source notes", () => {
    const result = parseRaceLibrary([
      ...headers,
      ["Frosty Half Marathon", "", "12/7/2026", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "Future race note\nSecond line"],
    ], new Date("2026-11-01T12:00:00"));
    expect(result.races[0].status).toBe("upcoming");
    expect(result.races[0].notes).toBe("Future race note\nSecond line");
    expect(result.summary.upcomingCount).toBe(1);
  });

  it("does not infer distances and preserves missing values as null", () => {
    const result = parseRaceLibrary([
      ...headers,
      ["Local Road Race", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    ], new Date("2026-11-01T12:00:00"));
    expect(result.races[0].distance).toBeNull();
    expect(result.races[0].primaryTimeSeconds).toBeNull();
    expect(result.races[0].date).toBeNull();
    expect(result.races[0].status).toBe("unknown");
  });

  it("validates URL values and weight values without treating blanks as zero", () => {
    const result = parseRaceLibrary([
      ...headers,
      ["Deep Run 5K", "", "8/2/2025", "", "", "", "", "", "19:52", "", "", "", "", "", "154.8", "", "", "", "javascript:alert(1)", "https://example.com/photo.jpg", ""],
    ], new Date("2026-11-01T12:00:00"));
    expect(result.races[0].weight).toBe(154.8);
    expect(result.races[0].resultsUrl).toBeNull();
    expect(result.races[0].picturesUrl).toBe("https://example.com/photo.jpg");
  });
});
