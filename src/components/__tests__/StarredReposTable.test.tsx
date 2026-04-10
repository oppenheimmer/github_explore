import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StarredReposTable from "../StarredReposTable";
import type { StarredRepo } from "@/types/github";

vi.mock("@/lib/export", () => ({
  exportToCSV: vi.fn(),
  exportToJSON: vi.fn(),
}));

const makeRepo = (overrides: Partial<StarredRepo> = {}): StarredRepo => ({
  id: 1,
  name: "repo",
  full_name: "owner/repo",
  owner: { login: "owner", avatar_url: "https://example.com/av.png", html_url: "https://github.com/owner" },
  html_url: "https://github.com/owner/repo",
  description: "A test repo",
  language: "TypeScript",
  stargazers_count: 100,
  forks_count: 20,
  topics: ["react", "nextjs"],
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

describe("StarredReposTable", () => {
  it("shows loading skeleton with progress", () => {
    render(
      <StarredReposTable repos={[]} loading={true} username="octocat" progress={42} />
    );
    expect(screen.getByText(/loading starred repos/i)).toBeInTheDocument();
    expect(screen.getByText(/42 loaded/i)).toBeInTheDocument();
  });

  it("shows empty state when no repos", () => {
    render(
      <StarredReposTable repos={[]} loading={false} username="octocat" progress={0} />
    );
    expect(screen.getByText(/no starred repositories found/i)).toBeInTheDocument();
  });

  it("renders table with repo data", () => {
    const repos = [makeRepo(), makeRepo({ id: 2, full_name: "other/lib", name: "lib", language: "Rust", stargazers_count: 50 })];
    render(
      <StarredReposTable repos={repos} loading={false} username="octocat" progress={0} />
    );
    expect(screen.getByText("owner/repo")).toBeInTheDocument();
    expect(screen.getByText("other/lib")).toBeInTheDocument();
  });

  it("renders repo description", () => {
    render(
      <StarredReposTable repos={[makeRepo()]} loading={false} username="octocat" progress={0} />
    );
    expect(screen.getByText("A test repo")).toBeInTheDocument();
  });

  it("renders language badge", () => {
    render(
      <StarredReposTable repos={[makeRepo()]} loading={false} username="octocat" progress={0} />
    );
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("shows dash for null language", () => {
    render(
      <StarredReposTable repos={[makeRepo({ language: null })]} loading={false} username="octocat" progress={0} />
    );
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });

  it("renders star and fork counts", () => {
    render(
      <StarredReposTable repos={[makeRepo()]} loading={false} username="octocat" progress={0} />
    );
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("filters repos by keyword", async () => {
    const user = userEvent.setup();
    const repos = [
      makeRepo({ id: 1, full_name: "owner/alpha", name: "alpha" }),
      makeRepo({ id: 2, full_name: "owner/beta", name: "beta" }),
    ];
    render(
      <StarredReposTable repos={repos} loading={false} username="octocat" progress={0} />
    );

    const filterInput = screen.getByPlaceholderText(/filter repos/i);
    await user.type(filterInput, "alpha");

    expect(screen.getByText("owner/alpha")).toBeInTheDocument();
    expect(screen.queryByText("owner/beta")).not.toBeInTheDocument();
  });

  it("shows count of filtered vs total repos", () => {
    const repos = [makeRepo({ id: 1 }), makeRepo({ id: 2, full_name: "x/y", name: "y" })];
    render(
      <StarredReposTable repos={repos} loading={false} username="octocat" progress={0} />
    );
    expect(screen.getByText(/2 of 2 repos/)).toBeInTheDocument();
  });

  it("renders CSV and JSON export buttons", () => {
    render(
      <StarredReposTable repos={[makeRepo()]} loading={false} username="octocat" progress={0} />
    );
    expect(screen.getByRole("button", { name: /csv/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /json/i })).toBeInTheDocument();
  });

  it("sorts by star count on column header click", async () => {
    const user = userEvent.setup();
    const repos = [
      makeRepo({ id: 1, full_name: "low/stars", name: "low", stargazers_count: 5 }),
      makeRepo({ id: 2, full_name: "high/stars", name: "high", stargazers_count: 500 }),
    ];
    render(
      <StarredReposTable repos={repos} loading={false} username="octocat" progress={0} />
    );

    // Default sort is stargazers_count desc — high/stars should be first
    const rows = screen.getAllByRole("row");
    // row[0] is header, row[1] is first data row
    expect(rows[1]).toHaveTextContent("high/stars");

    // Click Stars header to toggle to asc
    const starsHeader = screen.getByRole("button", { name: /stars/i });
    await user.click(starsHeader);

    const rowsAfter = screen.getAllByRole("row");
    expect(rowsAfter[1]).toHaveTextContent("low/stars");
  });
});
