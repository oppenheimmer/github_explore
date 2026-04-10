import { GitHubUser, StarredRepo, FollowingUser } from "@/types/github";

const GITHUB_API = "https://api.github.com";
const PER_PAGE = 100;

function headers(token?: string): HeadersInit {
  const h: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    h.Authorization = `Bearer ${token}`;
  }
  return h;
}

function parseNextLink(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
  return match ? match[1] : null;
}

export async function fetchUser(
  username: string,
  token?: string
): Promise<GitHubUser> {
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

export async function fetchStarredRepos(
  username: string,
  token?: string,
  onProgress?: (loaded: number) => void
): Promise<StarredRepo[]> {
  const all: StarredRepo[] = [];
  let url: string | null =
    `${GITHUB_API}/users/${encodeURIComponent(username)}/starred?per_page=${PER_PAGE}`;

  while (url) {
    const res = await fetch(url, { headers: headers(token) });
    if (!res.ok) {
      throw new Error(`Failed to fetch starred repos: ${res.status} ${res.statusText}`);
    }
    const data: StarredRepo[] = await res.json();
    all.push(...data);
    onProgress?.(all.length);
    url = parseNextLink(res.headers.get("Link"));
  }

  return all;
}

export async function fetchFollowing(
  username: string,
  token?: string,
  onProgress?: (loaded: number) => void
): Promise<FollowingUser[]> {
  const all: FollowingUser[] = [];
  let url: string | null =
    `${GITHUB_API}/users/${encodeURIComponent(username)}/following?per_page=${PER_PAGE}`;

  while (url) {
    const res = await fetch(url, { headers: headers(token) });
    if (!res.ok) {
      throw new Error(`Failed to fetch following: ${res.status} ${res.statusText}`);
    }
    const data: FollowingUser[] = await res.json();
    all.push(...data);
    onProgress?.(all.length);
    url = parseNextLink(res.headers.get("Link"));
  }

  return all;
}

// --- Migrate helpers ---

export async function fetchAllStarredRepoNames(
  token: string,
  onProgress?: (loaded: number) => void
): Promise<Set<string>> {
  const names = new Set<string>();
  let url: string | null = `${GITHUB_API}/user/starred?per_page=${PER_PAGE}`;

  while (url) {
    const res = await fetch(url, { headers: headers(token) });
    if (!res.ok) break;
    const data: { full_name: string }[] = await res.json();
    if (data.length === 0) break;
    data.forEach((r) => names.add(r.full_name));
    onProgress?.(names.size);
    url = parseNextLink(res.headers.get("Link"));
  }

  return names;
}

export async function starRepo(repo: string, token: string): Promise<boolean> {
  const res = await fetch(
    `${GITHUB_API}/user/starred/${encodeURIComponent(repo.split("/")[0])}/${encodeURIComponent(repo.split("/")[1])}`,
    { method: "PUT", headers: { ...headers(token), "Content-Length": "0" } }
  );
  return res.status === 204;
}

export async function unstarRepo(repo: string, token: string): Promise<boolean> {
  const res = await fetch(
    `${GITHUB_API}/user/starred/${encodeURIComponent(repo.split("/")[0])}/${encodeURIComponent(repo.split("/")[1])}`,
    { method: "DELETE", headers: headers(token) }
  );
  return res.status === 204;
}

export async function checkFollowingUser(
  username: string,
  token: string
): Promise<boolean> {
  const res = await fetch(
    `${GITHUB_API}/user/following/${encodeURIComponent(username)}`,
    { headers: headers(token) }
  );
  return res.status === 204;
}

export async function followUser(username: string, token: string): Promise<boolean> {
  const res = await fetch(
    `${GITHUB_API}/user/following/${encodeURIComponent(username)}`,
    { method: "PUT", headers: { ...headers(token), "Content-Length": "0" } }
  );
  return res.status === 204;
}

export async function unfollowUser(username: string, token: string): Promise<boolean> {
  const res = await fetch(
    `${GITHUB_API}/user/following/${encodeURIComponent(username)}`,
    { method: "DELETE", headers: headers(token) }
  );
  return res.status === 204;
}
