import type { GitHubUser, StarredRepo, FollowingUser } from "@/types/github";

const GITHUB_API = "https://api.github.com";
const PER_PAGE = 100;

// ── internal helpers ────────────────────────────────────────────────

function headers(token?: string): HeadersInit {
  const h: HeadersInit = { Accept: "application/vnd.github.v3+json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function parseNextLink(link: string | null): string | null {
  if (!link) return null;
  const m = link.match(/<([^>]+)>;\s*rel="next"/);
  return m ? m[1] : null;
}

function repoUrl(repo: string): string {
  const [owner, name] = repo.split("/");
  return `${GITHUB_API}/user/starred/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}

function userUrl(username: string): string {
  return `${GITHUB_API}/user/following/${encodeURIComponent(username)}`;
}

/**
 * Generic paginated GET that accumulates items from every page.
 * If `throwOnError` is false the loop silently stops on a non-OK response
 * (used by fetchAllStarredRepoNames where partial results are acceptable).
 */
async function paginatedFetch<T>(
  startUrl: string,
  token: string | undefined,
  onProgress: ((loaded: number) => void) | undefined,
  errorLabel: string,
  throwOnError = true,
): Promise<T[]> {
  const all: T[] = [];
  let url: string | null = startUrl;

  while (url) {
    const res = await fetch(url, { headers: headers(token) });
    if (!res.ok) {
      if (throwOnError) throw new Error(`${errorLabel}: ${res.status} ${res.statusText}`);
      break;
    }
    const data: T[] = await res.json();
    if (data.length === 0) break;
    all.push(...data);
    onProgress?.(all.length);
    url = parseNextLink(res.headers.get("Link"));
  }

  return all;
}

// ── explorer: read-only fetchers ────────────────────────────────────

export async function fetchUser(username: string, token?: string): Promise<GitHubUser> {
  const res = await fetch(`${GITHUB_API}/users/${encodeURIComponent(username)}`, {
    headers: headers(token),
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error(`User "${username}" not found.`);
    if (res.status === 401) throw new Error("Invalid GitHub token.");
    if (res.status === 403) throw new Error("Rate limit exceeded. Please provide a valid token.");
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export function fetchStarredRepos(
  username: string,
  token?: string,
  onProgress?: (loaded: number) => void,
): Promise<StarredRepo[]> {
  return paginatedFetch<StarredRepo>(
    `${GITHUB_API}/users/${encodeURIComponent(username)}/starred?per_page=${PER_PAGE}`,
    token,
    onProgress,
    "Failed to fetch starred repos",
  );
}

export function fetchFollowing(
  username: string,
  token?: string,
  onProgress?: (loaded: number) => void,
): Promise<FollowingUser[]> {
  return paginatedFetch<FollowingUser>(
    `${GITHUB_API}/users/${encodeURIComponent(username)}/following?per_page=${PER_PAGE}`,
    token,
    onProgress,
    "Failed to fetch following",
  );
}

// ── migrate: write helpers ──────────────────────────────────────────

export async function fetchAllStarredRepoNames(
  token: string,
  onProgress?: (loaded: number) => void,
): Promise<Set<string>> {
  const items = await paginatedFetch<{ full_name: string }>(
    `${GITHUB_API}/user/starred?per_page=${PER_PAGE}`,
    token,
    onProgress,
    "",
    false,
  );
  return new Set(items.map((r) => r.full_name));
}

export async function starRepo(repo: string, token: string): Promise<boolean> {
  const res = await fetch(repoUrl(repo), {
    method: "PUT",
    headers: { ...headers(token), "Content-Length": "0" },
  });
  return res.status === 204;
}

export async function unstarRepo(repo: string, token: string): Promise<boolean> {
  const res = await fetch(repoUrl(repo), { method: "DELETE", headers: headers(token) });
  return res.status === 204;
}

export async function checkFollowingUser(username: string, token: string): Promise<boolean> {
  const res = await fetch(userUrl(username), { headers: headers(token) });
  return res.status === 204;
}

export async function followUser(username: string, token: string): Promise<boolean> {
  const res = await fetch(userUrl(username), {
    method: "PUT",
    headers: { ...headers(token), "Content-Length": "0" },
  });
  return res.status === 204;
}

export async function unfollowUser(username: string, token: string): Promise<boolean> {
  const res = await fetch(userUrl(username), { method: "DELETE", headers: headers(token) });
  return res.status === 204;
}
