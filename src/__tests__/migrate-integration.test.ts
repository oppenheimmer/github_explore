import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { parseRepoLines, parseUserLines } from "@/lib/parsers";
import {
  fetchAllStarredRepoNames,
  starRepo,
  unstarRepo,
  checkFollowingUser,
  followUser,
  unfollowUser,
} from "@/lib/github";

/**
 * End-to-end integration test for the Migrate workflow.
 *
 * Reads the real `starred_repos.txt` and `following.txt` from the project
 * root, parses them through the same functions the UI uses, then exercises
 * every GitHub-API helper with **dummy (mocked) responses** so that no
 * online state is modified.
 */

const PROJECT_ROOT = resolve(__dirname, "../..");

// ── helpers ──

function loadLines(filename: string): string[] {
  const raw = readFileSync(resolve(PROJECT_ROOT, filename), "utf-8");
  return raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

// ── mock fetch globally ──

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function ok204() {
  return { ok: true, status: 204, headers: new Headers() };
}

function okJson(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
    headers: new Headers(),
  };
}

// ── starred repos migration ──

describe("Migrate — Star Repos (starred_repos.txt)", () => {
  const rawLines = loadLines("starred_repos.txt");
  const repos = parseRepoLines(rawLines);

  it("parses all lines into owner/repo format", () => {
    expect(repos.length).toBeGreaterThan(0);
    for (const r of repos) {
      expect(r).toMatch(/^[^/]+\/[^/]+$/);
    }
  });

  it("deduplicates repos", () => {
    const unique = [...new Set(repos)];
    expect(unique.length).toBe(repos.length);
  });

  it("fetchAllStarredRepoNames returns a Set from dummy data", async () => {
    // Simulate one page of starred repos returned by the API
    const page = repos.slice(0, 5).map((r) => ({ full_name: r }));
    mockFetch.mockResolvedValueOnce(okJson(page));
    // second call returns empty array → pagination stops
    mockFetch.mockResolvedValueOnce(okJson([]));

    const set = await fetchAllStarredRepoNames("dummy-token");
    expect(set).toBeInstanceOf(Set);
    expect(set.size).toBe(page.length);
    for (const r of page) {
      expect(set.has(r.full_name)).toBe(true);
    }
  });

  it("starRepo succeeds with dummy 204", async () => {
    for (const repo of repos.slice(0, 3)) {
      mockFetch.mockResolvedValueOnce(ok204());
      const ok = await starRepo(repo, "dummy-token");
      expect(ok).toBe(true);
    }
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("unstarRepo succeeds with dummy 204", async () => {
    for (const repo of repos.slice(0, 3)) {
      mockFetch.mockResolvedValueOnce(ok204());
      const ok = await unstarRepo(repo, "dummy-token");
      expect(ok).toBe(true);
    }
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("starRepo returns false on non-204 (e.g. rate limit)", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403, headers: new Headers() });
    const ok = await starRepo(repos[0], "dummy-token");
    expect(ok).toBe(false);
  });

  it("walks through every repo from the file (dummy star-all)", async () => {
    for (const repo of repos) {
      mockFetch.mockResolvedValueOnce(ok204());
    }

    const results: boolean[] = [];
    for (const repo of repos) {
      results.push(await starRepo(repo, "dummy-token"));
    }

    expect(results.every(Boolean)).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(repos.length);
  });
});

// ── following migration ──

describe("Migrate — Follow Users (following.txt)", () => {
  const rawLines = loadLines("following.txt");
  const users = parseUserLines(rawLines);

  it("parses all lines into plain usernames", () => {
    expect(users.length).toBeGreaterThan(0);
    for (const u of users) {
      expect(u).toMatch(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/);
    }
  });

  it("deduplicates users", () => {
    const unique = [...new Set(users)];
    expect(unique.length).toBe(users.length);
  });

  it("checkFollowingUser returns true/false from dummy responses", async () => {
    mockFetch.mockResolvedValueOnce(ok204()); // following
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, headers: new Headers() }); // not following

    expect(await checkFollowingUser(users[0], "dummy-token")).toBe(true);
    expect(await checkFollowingUser(users[1], "dummy-token")).toBe(false);
  });

  it("followUser succeeds with dummy 204", async () => {
    for (const u of users.slice(0, 3)) {
      mockFetch.mockResolvedValueOnce(ok204());
      expect(await followUser(u, "dummy-token")).toBe(true);
    }
  });

  it("unfollowUser succeeds with dummy 204", async () => {
    for (const u of users.slice(0, 3)) {
      mockFetch.mockResolvedValueOnce(ok204());
      expect(await unfollowUser(u, "dummy-token")).toBe(true);
    }
  });

  it("followUser returns false on non-204", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403, headers: new Headers() });
    expect(await followUser(users[0], "dummy-token")).toBe(false);
  });

  it("walks through every user from the file (dummy follow-all)", async () => {
    for (const u of users) {
      mockFetch.mockResolvedValueOnce(ok204());
    }

    const results: boolean[] = [];
    for (const u of users) {
      results.push(await followUser(u, "dummy-token"));
    }

    expect(results.every(Boolean)).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(users.length);
  });
});
