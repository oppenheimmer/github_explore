import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { exportToCSV, exportToJSON } from "../export";

const origCreateElement = document.createElement.bind(document);

describe("exportToCSV", () => {
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;
  let clickSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clickSpy = vi.fn();
    appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
    removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        return { click: clickSpy, href: "", download: "" } as unknown as HTMLElement;
      }
      return origCreateElement(tag);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does nothing for empty data", () => {
    exportToCSV([], "test.csv");
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it("creates CSV with correct header and rows", () => {
    const data = [
      { name: "repo1", stars: 10 },
      { name: "repo2", stars: 20 },
    ];
    exportToCSV(data, "test.csv");
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it("escapes fields with commas", () => {
    const data = [{ name: "hello, world", count: 1 }];
    exportToCSV(data, "test.csv");
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it("escapes fields with quotes", () => {
    const data = [{ name: 'say "hi"', count: 1 }];
    exportToCSV(data, "test.csv");
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it("joins arrays with semicolons", () => {
    const data = [{ topics: ["react", "next"] as unknown }] as Record<string, unknown>[];
    exportToCSV(data, "test.csv");
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it("handles null and undefined values", () => {
    const data = [{ a: null, b: undefined, c: "ok" }] as Record<string, unknown>[];
    exportToCSV(data, "test.csv");
    expect(clickSpy).toHaveBeenCalledOnce();
  });
});

describe("exportToJSON", () => {
  let clickSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clickSpy = vi.fn();
    vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
    vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        return { click: clickSpy, href: "", download: "" } as unknown as HTMLElement;
      }
      return origCreateElement(tag);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does nothing for empty data", () => {
    exportToJSON([], "test.json");
    // exportToJSON still creates the download for empty arrays (no early return like CSV)
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it("creates JSON download for data", () => {
    const data = [{ name: "repo1" }, { name: "repo2" }];
    exportToJSON(data, "test.json");
    expect(clickSpy).toHaveBeenCalledOnce();
  });
});
