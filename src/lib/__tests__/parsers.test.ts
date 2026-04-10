import { describe, it, expect } from "vitest";
import { parseRepoLines, parseUserLines } from "../parsers";

describe("parseRepoLines", () => {
  it("passes through owner/repo format", () => {
    expect(parseRepoLines(["facebook/react", "vercel/next.js"])).toEqual([
      "facebook/react",
      "vercel/next.js",
    ]);
  });

  it("strips https://github.com/ prefix", () => {
    expect(
      parseRepoLines(["https://github.com/owner/repo"])
    ).toEqual(["owner/repo"]);
  });

  it("strips http:// prefix", () => {
    expect(
      parseRepoLines(["http://github.com/owner/repo"])
    ).toEqual(["owner/repo"]);
  });

  it("strips trailing slashes", () => {
    expect(parseRepoLines(["owner/repo/"])).toEqual(["owner/repo"]);
  });

  it("filters out lines without a slash", () => {
    expect(parseRepoLines(["noslash", "owner/repo"])).toEqual(["owner/repo"]);
  });

  it("filters out empty lines", () => {
    expect(parseRepoLines(["", "  ", "owner/repo"])).toEqual(["owner/repo"]);
  });

  it("handles mixed formats", () => {
    const input = [
      "facebook/react",
      "https://github.com/vercel/next.js",
      "invalid",
      "",
      "owner/repo/",
    ];
    expect(parseRepoLines(input)).toEqual([
      "facebook/react",
      "vercel/next.js",
      "owner/repo",
    ]);
  });
});

describe("parseUserLines", () => {
  it("passes through plain usernames", () => {
    expect(parseUserLines(["alice", "bob"])).toEqual(["alice", "bob"]);
  });

  it("strips https://github.com/ prefix", () => {
    expect(parseUserLines(["https://github.com/alice"])).toEqual(["alice"]);
  });

  it("strips trailing slashes", () => {
    expect(parseUserLines(["alice/"])).toEqual(["alice"]);
  });

  it("skips the CSV header 'username'", () => {
    expect(parseUserLines(["username", "alice", "bob"])).toEqual(["alice", "bob"]);
  });

  it("parses CSV rows (first column)", () => {
    expect(
      parseUserLines([
        "username,profile_url,type",
        "alice,https://github.com/alice,User",
        "bob,https://github.com/bob,User",
      ])
    ).toEqual(["alice", "bob"]);
  });

  it("filters out lines that still contain a slash (repo-style)", () => {
    expect(parseUserLines(["alice", "owner/repo"])).toEqual(["alice"]);
  });

  it("filters out empty lines", () => {
    expect(parseUserLines(["", "  ", "alice"])).toEqual(["alice"]);
  });

  it("handles quoted CSV values", () => {
    expect(parseUserLines(['"alice",foo,bar'])).toEqual(["alice"]);
  });
});
