export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string;
  location: string | null;
  bio: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  type: "User" | "Organization";
  created_at: string;
}

export interface StarredRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  created_at: string;
  updated_at: string;
}

export interface FollowingUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  type: "User" | "Organization";
}

export interface MigrateRepoItem {
  fullName: string; // "owner/repo"
  starred: boolean;
  loading: boolean;
  error: boolean;
}

export interface MigrateUserItem {
  username: string;
  following: boolean;
  loading: boolean;
  error: boolean;
}
