import { describe, expect, it } from "vitest";
import { chooseRandomGame, parseGamesLibrary } from "./index";

function library() {
  return {
    digital: [
      ["Title", "Where 2 Play?", "Players", "Favorite?", "Date\n(Start or Purchase)", "Cost", "Goals / Notes"],
      ["Minecraft", "PC / Xbox", "1+", "Y", "", "", "M+N Favorite"],
      ["Stardew Valley", "PC", "1", "Y", "", "", ""],
      ["Chess", "Website / Mobile", "1-2", "", "", "", ""],
    ],
    watchlist: [
      ["Title", "Price", "Sale Notifications?", "Players", "", "", "Ideas"],
      ["KeyWe", "24", "Y", "2+", "", "", ""],
      ["Not yet released", "", "", "", "", "", ""],
      ["Palworld", "30", "Y", "1+", "", "", ""],
      ["Companies / Teams", "", "", "", "", "", ""],
      ["Robot Gentleman", "", "", "", "", "", ""],
    ],
    analog: [
      ["Board Games"],
      ["Battleship"],
      ["Talking Games"],
      ["Contact (3 people minimum)", "Everyone says contact at the count."],
      ["Card games"],
      ["Uno"],
      ["Darts", "Most hits wins"],
    ],
    completed: [
      ["Title", "Date Finished", "Hours", "Notes"],
      ["Pokemon Mystery Dungeon DX", "9/3/2026", "17:23", "Bulbasaur"],
      ["Bad Duration", "", "17 hours", ""],
    ],
    disliked: [
      ["Title", "Why?"],
      ["Moving Out", "Just felt boring"],
      ["Games we have tried but we don't like", ""],
    ],
  };
}

describe("parseGamesLibrary", () => {
  it("normalizes Digital favorites and owner markers", () => {
    const result = parseGamesLibrary(library());
    expect(result.digital).toHaveLength(3);
    expect(result.digital[0]).toMatchObject({
      title: "Minecraft",
      platforms: ["PC", "Xbox"],
      favorite: true,
      favoriteOwner: "both",
      players: "1+",
    });
    expect(result.digital[1].favoriteOwner).toBe("unknown");
    expect(result.digital[2].favorite).toBe(false);
  });

  it("preserves Analog sections and rules", () => {
    const result = parseGamesLibrary(library());
    expect(result.analog.find((game) => game.title === "Battleship")?.section).toBe("Board Games");
    expect(result.analog.find((game) => game.title === "Contact (3 people minimum)")?.rules).toContain("contact");
  });

  it("tracks released status and excludes company entries from Watchlist", () => {
    const result = parseGamesLibrary(library());
    expect(result.watchlist.map((game) => game.title)).toEqual(["KeyWe", "Palworld"]);
    expect(result.watchlist[1].releaseStatus).toBe("not-yet-released");
    expect(result.watchlist[0].price).toBe(24);
    expect(result.watchlist[0].saleNotification).toBe(true);
  });

  it("parses only unambiguous completed durations and preserves disliked reasons", () => {
    const result = parseGamesLibrary(library());
    expect(result.completed[0]).toMatchObject({
      title: "Pokemon Mystery Dungeon DX",
      durationMinutes: 1043,
    });
    expect(result.completed[1].durationMinutes).toBeNull();
    expect(result.disliked).toEqual([
      expect.objectContaining({ title: "Moving Out", reason: "Just felt boring" }),
    ]);
  });

  it("uses the confirmed favorite highlight colors as owner metadata", () => {
    const highlighted = library();
    highlighted.digital = [
      ["Title", "Where 2 Play?", "Players", "Favorite?", "Date\n(Start or Purchase)", "Cost", "Goals / Notes"],
      ["Nathan Favorite", "PC", "1", "Y", "", "", ""],
      ["Both Favorite", "PC", "1", "Y", "", "", ""],
      ["Maddy Favorite", "PC", "1", "Y", "", "", ""],
    ];
    const result = parseGamesLibrary(highlighted, {
      2: "0.6431373,0.7607843,0.95686275",
      3: "0.7137255,0.84313726,0.65882355",
      4: "1,0.9490196,0.8000000",
    });
    expect(result.digital[0].favoriteOwner).toBe("nathan");
    expect(result.digital[1].favoriteOwner).toBe("both");
    expect(result.digital[2].favoriteOwner).toBe("maddy");
  });
});

describe("chooseRandomGame", () => {
  it("chooses candidates at half-open random intervals", () => {
    const candidates = ["a", "b", "c"];
    expect(chooseRandomGame(candidates, 0)).toBe("a");
    expect(chooseRandomGame(candidates, 1 / 3)).toBe("b");
    expect(chooseRandomGame(candidates, 2 / 3)).toBe("c");
    expect(chooseRandomGame(candidates, 0.999999)).toBe("c");
    expect(chooseRandomGame([], 0)).toBeNull();
    expect(() => chooseRandomGame(candidates, 1)).toThrow(RangeError);
  });
});
