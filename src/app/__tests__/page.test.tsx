import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "../page";

// Mock the github module
vi.mock("@/lib/github", () => ({
  fetchUser: vi.fn(),
  fetchStarredRepos: vi.fn(),
  fetchFollowing: vi.fn(),
}));

vi.mock("@/lib/export", () => ({
  exportToCSV: vi.fn(),
  exportToJSON: vi.fn(),
}));

import { fetchUser, fetchStarredRepos, fetchFollowing } from "@/lib/github";

const mockUser = {
  login: "octocat",
  id: 1,
  avatar_url: "https://avatars.githubusercontent.com/u/1",
  html_url: "https://github.com/octocat",
  name: "The Octocat",
  company: "@github",
  blog: "https://github.blog",
  location: "San Francisco",
  bio: "A test bio",
  public_repos: 10,
  followers: 100,
  following: 20,
  type: "User" as const,
  created_at: "2008-01-14T04:33:35Z",
};

describe("Home page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders the header with title", () => {
    render(<Home />);
    expect(screen.getByText("GitHub Explorer")).toBeInTheDocument();
  });

  it("renders the token input", () => {
    render(<Home />);
    expect(screen.getByPlaceholderText("GitHub Personal Access Token")).toBeInTheDocument();
  });

  it("renders Explorer and Migrate tabs", () => {
    render(<Home />);
    expect(screen.getByRole("tab", { name: /explorer/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /migrate/i })).toBeInTheDocument();
  });

  it("shows empty state by default", () => {
    render(<Home />);
    expect(screen.getByText(/enter a github username to explore/i)).toBeInTheDocument();
  });

  it("renders the search input", () => {
    render(<Home />);
    expect(screen.getByPlaceholderText(/enter github username/i)).toBeInTheDocument();
  });

  it("searches and displays user profile", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchUser).mockResolvedValueOnce(mockUser);
    vi.mocked(fetchStarredRepos).mockResolvedValueOnce([]);
    vi.mocked(fetchFollowing).mockResolvedValueOnce([]);

    render(<Home />);

    const input = screen.getByPlaceholderText(/enter github username/i);
    await user.type(input, "octocat");
    await user.click(screen.getByRole("button", { name: /explore/i }));

    await waitFor(() => {
      expect(fetchUser).toHaveBeenCalledWith("octocat", undefined);
    });

    await waitFor(() => {
      expect(screen.getByText("The Octocat")).toBeInTheDocument();
      expect(screen.getByText("@octocat")).toBeInTheDocument();
    });
  });

  it("displays error message on fetch failure", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchUser).mockRejectedValueOnce(new Error("User \"bad\" not found."));

    render(<Home />);

    const input = screen.getByPlaceholderText(/enter github username/i);
    await user.type(input, "bad");
    await user.click(screen.getByRole("button", { name: /explore/i }));

    await waitFor(() => {
      expect(screen.getByText(/user "bad" not found/i)).toBeInTheDocument();
    });
  });

  it("switches to Migrate tab", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("tab", { name: /migrate/i }));

    await waitFor(() => {
      expect(screen.getByText(/import your starred repos/i)).toBeInTheDocument();
    });
  });

  it("shows Starred Repos and Following sub-tabs after search", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchUser).mockResolvedValueOnce(mockUser);
    vi.mocked(fetchStarredRepos).mockResolvedValueOnce([]);
    vi.mocked(fetchFollowing).mockResolvedValueOnce([]);

    render(<Home />);

    const input = screen.getByPlaceholderText(/enter github username/i);
    await user.type(input, "octocat");
    await user.click(screen.getByRole("button", { name: /explore/i }));

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /starred repos/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /following/i })).toBeInTheDocument();
    });
  });

  it("loads token from localStorage on mount", () => {
    localStorage.setItem("gh_token", "saved-token");
    render(<Home />);
    const input = screen.getByPlaceholderText("GitHub Personal Access Token");
    expect(input).toHaveValue("saved-token");
  });
});
