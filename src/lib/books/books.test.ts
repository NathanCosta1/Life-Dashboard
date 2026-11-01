import { describe, expect, it } from "vitest";
import { parseBooksLibrary } from "./parser";

const headers = [
  "Book Id",
  "Title",
  "Author",
  "Additional Authors",
  "ISBN",
  "ISBN13",
  "My Rating",
  "Publisher",
  "Binding",
  "Number of Pages",
  "Year Published",
  "Original Publication Year",
  "Date Read",
  "Date Added",
  "Bookshelves",
  "Bookshelves with positions",
  "Exclusive Shelf",
  "My Review",
  "Spoiler",
  "Private Notes",
  "Read Count",
  "Owned Copies",
];

function row(values: Partial<Record<string, string>>): string[] {
  return headers.map((header) => values[header] ?? "");
}

describe("parseBooksLibrary", () => {
  it("normalizes read and to-read records without treating zero rating as a star rating", () => {
    const result = parseBooksLibrary([
      headers,
      row({
        "Book Id": "1",
        Title: "First Book",
        Author: "First Author",
        "My Rating": "0",
        "Number of Pages": "240",
        "Date Read": "2024/03/01",
        "Date Added": "2024/01/01",
        "Exclusive Shelf": "read",
        "Read Count": "1",
      }),
      row({
        "Book Id": "2",
        Title: "Waiting Book",
        Author: "Second Author",
        "My Rating": "4.5",
        "Number of Pages": "301",
        "Exclusive Shelf": "to-read",
      }),
    ]);

    expect(result.books).toHaveLength(2);
    expect(result.read).toHaveLength(1);
    expect(result.toRead).toHaveLength(1);
    expect(result.books[0].rating).toBeNull();
    expect(result.books[1].rating).toBe(4.5);
    expect(result.readByYear).toEqual({ "2024": 1 });
    expect(result.ratingBands.find((band) => band.rating === "Unrated")?.count).toBe(1);
  });

  it("returns a structural diagnostic when required headers drift", () => {
    const result = parseBooksLibrary([["Unexpected", "columns"], ["one", "two"]]);
    expect(result.books).toEqual([]);
    expect(result.issues[0]).toMatchObject({
      field: "headers",
      tab: "goodreads_library_export",
    });
  });

  it("preserves transient source shelves but excludes them from primary archive groups", () => {
    const result = parseBooksLibrary([
      headers,
      row({ "Book Id": "3", Title: "Current", Author: "Author", "Exclusive Shelf": "currently-reading" }),
      row({ "Book Id": "4", Title: "Stopped", Author: "Author", "Exclusive Shelf": "did-not-finish" }),
    ]);

    expect(result.books.map((book) => book.exclusiveShelf)).toEqual(["currently-reading", "did-not-finish"]);
    expect(result.read).toEqual([]);
    expect(result.toRead).toEqual([]);
  });

  it("rejects invalid dates and unsupported exclusive shelves without crashing", () => {
    const result = parseBooksLibrary([
      headers,
      row({
        "Book Id": "5",
        Title: "Invalid",
        Author: "Author",
        "Date Read": "2024/02/30",
        "Exclusive Shelf": "unknown",
      }),
    ]);
    expect(result.books).toEqual([]);
    expect(result.issues[0].field).toBe("Exclusive Shelf");
  });
});
