import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchUser,
  fetchStarredRepos,
  fetchFollowing,
  fetchAllStarredRepoNames,
  starRepo,
  unstarRepo,
  checkFollowingUser,
  followUser,
  unfollowUser,
} from "../github";

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockClear();
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── helpers ──

function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: () => Promise.resolve(data),
    headers: new Headers(headers),
  };
}

function emptyResponse(status: number) {
  return { ok: status >= 200 && status < 300, status, statusText: "", headers: new Headers() };
}

// ── fetchUser ──

describe("fetchUser", () => {
  it("returns user data on success", async () => {
    const userData = { login: "octocat", id: 1 };
    mockFetch.mockResolvedValueOnce(jsonResponse(userData));

    const result = await fetchUser("octocat");
    expect(result).toEqual(userData);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.github.com/users/octocat",
      expect.objectContaining({ headers: expect.any(Object) })
    );
  });

  it("sends Bearer token when provided", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ login: "octocat" }));

    await fetchUser("octocat", "my-token");
    const call = mockFetch.mock.calls[0];
    expect(call[1].headers.Authorization).toBe("Bearer my-token");
  });

  it("throws on 404", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(null, 404));
    await expect(fetchUser("nonexistent")).rejects.toThrow('User "nonexistent" not found');
  });

  it("throws on 401", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(null, 401));
    await expect(fetchUser("x")).rejects.toThrow("Invalid GitHub token");
  });

  it("throws on 403", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(null, 403));
    await expect(fetchUser("x")).rejects.toThrow("Rate limit exceeded");
  });

  it("throws on other errors", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(null, 500));
    await expect(fetchUser("x")).rejects.toThrow("GitHub API error: 500");
  });
});

// ── fetchStarredRepos ──

describe("fetchStarredRepos", () => {
  it("fetches single page of starred repos", async () => {
    const repos = [{ full_name: "owner/repo1" }];
    mockFetch.mockResolvedValueOnce(jsonResponse(repos));

    const result = await fetchStarredRepos("octocat");
    expect(result).toEqual(repos);
  });

  it("paginates via Link header", async () => {
    const page1 = [{ full_name: "a/1" }];
    const page2 = [{ full_name: "b/2" }];
    mockFetch
      .mockResolvedValueOnce(
        jsonResponse(page1, 200, {
          Link: '<https://api.github.com/users/octocat/starred?per_page=100&page=2>; rel="next"',
        })
      )
      .mockResolvedValueOnce(jsonResponse(page2));

    const result = await fetchStarredRepos("octocat");
    expect(result).toHaveLength(2);
    expect(result[0].full_name).toBe("a/1");
    expect(result[1].full_name).toBe("b/2");
  });

  it("calls onProgress callback", async () => {
    const repos = [{ full_name: "a/1" }, { full_name: "a/2" }];
    mockFetch.mockResolvedValueOnce(jsonResponse(repos));
    const onProgress = vi.fn();

    await fetchStarredRepos("octocat", undefined, onProgress);
    expect(onProgress).toHaveBeenCalledWith(2);
  });

  it("throws on fetch failure", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(null, 500));
    await expect(fetchStarredRepos("x")).rejects.toThrow("Failed to fetch starred repos");
  });
});

// ── fetchFollowing ──

describe("fetchFollowing", () => {
  it("fetches single page of following", async () => {
    const users = [{ login: "user1" }];
    mockFetch.mockResolvedValueOnce(jsonResponse(users));

    const result = await fetchFollowing("octocat");
    expect(result).toEqual(users);
  });

  it("paginates via Link header", async () => {
    const page1 = [{ login: "u1" }];
    const page2 = [{ login: "u2" }];
    mockFetch
      .mockResolvedValueOnce(
        jsonResponse(page1, 200, {
          Link: '<https://api.github.com/users/octocat/following?per_page=100&page=2>; rel="next"',
        })
      )
      .mockResolvedValueOnce(jsonResponse(page2));

    const result = await fetchFollowing("octocat");
    expect(result).toHaveLength(2);
  });

  it("calls onProgress callback", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse([{ login: "u1" }]));
    const onProgress = vi.fn();

    await fetchFollowing("octocat", undefined, onProgress);
    expect(onProgress).toHaveBeenCalledWith(1);
  });

  it("throws on fetch failure", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(null, 500));
    await expect(fetchFollowing("x")).rejects.toThrow("Failed to fetch following");
  });
});

// ── fetchAllStarredRepoNames ──

describe("fetchAllStarredRepoNames", () => {
  it("returns set of full_name strings", async () => {
    const data = [{ full_name: "a/1" }, { full_name: "b/2" }];
    mockFetch.mockResolvedValueOnce(jsonResponse(data));

    const result = await fetchAllStarredRepoNames("token123");
    expect(result).toBeInstanceOf(Set);
    expect(result.has("a/1")).toBe(true);
    expect(result.has("b/2")).toBe(true);
  });

  it("stops on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(null, 401));
    const result = await fetchAllStarredRepoNames("bad-token");
    expect(result.size).toBe(0);
  });

  it("stops on empty array response", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse([]));
    const result = await fetchAllStarredRepoNames("token");
    expect(result.size).toBe(0);
  });
});

// ── starRepo / unstarRepo ──

describe("starRepo", () => {
  it("returns true on 204", async () => {
    mockFetch.mockResolvedValueOnce(emptyResponse(204));
    const ok = await starRepo("owner/repo", "token");
    expect(ok).toBe(true);
    expect(mockFetch.mock.calls[0][1].method).toBe("PUT");
  });

  it("returns false on non-204", async () => {
    mockFetch.mockResolvedValueOnce(emptyResponse(403));
    const ok = await starRepo("owner/repo", "token");
    expect(ok).toBe(false);
  });
});

describe("unstarRepo", () => {
  it("returns true on 204", async () => {
    mockFetch.mockResolvedValueOnce(emptyResponse(204));
    const ok = await unstarRepo("owner/repo", "token");
    expect(ok).toBe(true);
    expect(mockFetch.mock.calls[0][1].method).toBe("DELETE");
  });

  it("returns false on non-204", async () => {
    mockFetch.mockResolvedValueOnce(emptyResponse(403));
    const ok = await unstarRepo("owner/repo", "token");
    expect(ok).toBe(false);
  });
});

// ── checkFollowingUser ──

describe("checkFollowingUser", () => {
  it("returns true on 204 (following)", async () => {
    mockFetch.mockResolvedValueOnce(emptyResponse(204));
    expect(await checkFollowingUser("user1", "token")).toBe(true);
  });

  it("returns false on 404 (not following)", async () => {
    mockFetch.mockResolvedValueOnce(emptyResponse(404));
    expect(await checkFollowingUser("user1", "token")).toBe(false);
  });
});

// ── followUser / unfollowUser ──

describe("followUser", () => {
  it("returns true on 204", async () => {
    mockFetch.mockResolvedValueOnce(emptyResponse(204));
    expect(await followUser("user1", "token")).toBe(true);
    expect(mockFetch.mock.calls[0][1].method).toBe("PUT");
  });

  it("returns false on non-204", async () => {
    mockFetch.mockResolvedValueOnce(emptyResponse(403));
    expect(await followUser("user1", "token")).toBe(false);
  });
});

describe("unfollowUser", () => {
  it("returns true on 204", async () => {
    mockFetch.mockResolvedValueOnce(emptyResponse(204));
    expect(await unfollowUser("user1", "token")).toBe(true);
    expect(mockFetch.mock.calls[0][1].method).toBe("DELETE");
  });

  it("returns false on non-204", async () => {
    mockFetch.mockResolvedValueOnce(emptyResponse(403));
    expect(await unfollowUser("user1", "token")).toBe(false);
  });
});
