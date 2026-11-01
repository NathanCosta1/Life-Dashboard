import { describe, expect, it } from "vitest";
import {
  chooseRandomHike,
  extractState,
  filterAndSortHikes,
  parseHikeDate,
  parseHikingDocument,
  type HikeBlock,
} from "./parser";

const blocks: HikeBlock[] = [
  { style: "NORMAL_TEXT", text: "39) Spruce Knob via Huckleberry Trail" },
  { style: "NORMAL_TEXT", text: "Date: 8/6/2026" },
  { style: "NORMAL_TEXT", text: "Where: Pendleton County, WV" },
  { style: "NORMAL_TEXT", text: "Length: 12 mi" },
  { style: "NORMAL_TEXT", text: "Height: 4863’" },
  { style: "NORMAL_TEXT", text: "Elevation gain: 1299’" },
  { style: "NORMAL_TEXT", text: "Time: 4:32 (2:17 up, 2:15 down)" },
  { style: "NORMAL_TEXT", text: "Calories: 1308 (926 active)" },
  { style: "NORMAL_TEXT", text: "Tallest mountain in West Virginia!" },
  { style: "NORMAL_TEXT", text: "https://photos.app.goo.gl/example" },
  { style: "NORMAL_TEXT", text: "9)Green Mountain (High Watch Trail)" },
  { style: "NORMAL_TEXT", text: "Date: 8/18/22" },
  { style: "NORMAL_TEXT", text: "Where: Waterford, ME" },
  { style: "NORMAL_TEXT", text: "Length: 1.4 miles" },
  { style: "NORMAL_TEXT", text: "Elevation Gain: 577’" },
  { style: "NORMAL_TEXT", text: "1)Noyes Mountain" },
  { style: "NORMAL_TEXT", text: "Date: 8/16/22" },
  { style: "NORMAL_TEXT", text: "Where: Greenwood, ME" },
  { style: "NORMAL_TEXT", text: "Length: sparse entry" },
];

describe("parseHikingDocument", () => {
  it("parses numbered titles with or without a space", () => {
    const library = parseHikingDocument("Hikes", blocks);
    expect(library.hikes).toHaveLength(3);
    expect(library.hikes.find((hike) => hike.number === 39)?.title).toBe("Spruce Knob via Huckleberry Trail");
    expect(library.hikes.find((hike) => hike.number === 9)?.title).toBe("Green Mountain (High Watch Trail)");
    expect(library.hikes.find((hike) => hike.number === 1)?.title).toBe("Noyes Mountain");
  });

  it("normalizes measurement and date fields without inventing values", () => {
    const hike = parseHikingDocument("Hikes", blocks).hikes.find((item) => item.number === 39)!;
    expect(hike).toMatchObject({
      year: 2026,
      lengthMiles: 12,
      heightFeet: 4863,
      elevationGainFeet: 1299,
      elapsedMinutes: 272,
      calories: 1308,
      activeCalories: 926,
      photoUrl: "https://photos.app.goo.gl/example",
    });
    expect(hike.notes).toContain("Tallest mountain in West Virginia!");
    expect(parseHikeDate("8/18/22")).toEqual({ date: "8/18/22", year: 2022 });
  });

  it("accepts elevation gain capitalization and preserves sparse entries", () => {
    const library = parseHikingDocument("Hikes", blocks);
    expect(library.hikes.find((hike) => hike.number === 9)?.elevationGainFeet).toBe(577);
    const sparse = library.hikes.find((hike) => hike.number === 1)!;
    expect(sparse.lengthMiles).toBeNull();
    expect(sparse.location).toBe("Greenwood, ME");
  });

  it("extracts states and handles duplicate or empty input safely", () => {
    expect(extractState("Pendleton County, WV")).toBe("West Virginia");
    expect(extractState("Livermore, NH")).toBe("New Hampshire");
    expect(parseHikingDocument("Hikes", []).issues.length).toBeGreaterThan(0);
    const library = parseHikingDocument("Hikes", [...blocks, ...blocks]);
    expect(library.hikes).toHaveLength(3);
  });
});

describe("hike filtering and selection", () => {
  it("filters by year, state, notes, photos, and search", () => {
    const library = parseHikingDocument("Hikes", blocks);
    expect(filterAndSortHikes(library.hikes, { year: "2026" }).map((hike) => hike.number)).toEqual([39]);
    expect(filterAndSortHikes(library.hikes, { state: "West Virginia" }).map((hike) => hike.number)).toEqual([39]);
    expect(filterAndSortHikes(library.hikes, { withPhoto: true }).map((hike) => hike.number)).toEqual([39]);
    expect(filterAndSortHikes(library.hikes, { withNotes: true }).map((hike) => hike.number)).toEqual([39]);
    expect(filterAndSortHikes(library.hikes, { search: "Green Mountain" }).map((hike) => hike.number)).toEqual([9]);
  });

  it("sorts and selects hikes with fixed random values", () => {
    const library = parseHikingDocument("Hikes", blocks);
    expect(filterAndSortHikes(library.hikes, { sort: "longest" })[0].number).toBe(39);
    expect(filterAndSortHikes(library.hikes, { sort: "oldest" })[0].number).toBe(1);
    expect(chooseRandomHike(["a", "b"], 0)).toBe("a");
    expect(chooseRandomHike(["a", "b"], .999)).toBe("b");
    expect(chooseRandomHike([], 0)).toBeNull();
    expect(() => chooseRandomHike(["a"], 1)).toThrow(RangeError);
  });
});
