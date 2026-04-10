import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FollowingList from "../FollowingList";
import type { FollowingUser } from "@/types/github";

vi.mock("@/lib/export", () => ({
  exportToCSV: vi.fn(),
  exportToJSON: vi.fn(),
}));

const makeUser = (overrides: Partial<FollowingUser> = {}): FollowingUser => ({
  login: "octocat",
  id: 1,
  avatar_url: "https://avatars.githubusercontent.com/u/1",
  html_url: "https://github.com/octocat",
  type: "User",
  ...overrides,
});

describe("FollowingList", () => {
  it("shows loading skeleton with progress", () => {
    render(
      <FollowingList users={[]} loading={true} username="test" progress={15} />
    );
    expect(screen.getByText(/loading following/i)).toBeInTheDocument();
    expect(screen.getByText(/15 loaded/i)).toBeInTheDocument();
  });

  it("shows empty state when no users", () => {
    render(
      <FollowingList users={[]} loading={false} username="test" progress={0} />
    );
    expect(screen.getByText(/not following anyone/i)).toBeInTheDocument();
  });

  it("renders user cards", () => {
    const users = [
      makeUser({ login: "alice", id: 1 }),
      makeUser({ login: "bob", id: 2 }),
    ];
    render(
      <FollowingList users={users} loading={false} username="test" progress={0} />
    );
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByText("bob")).toBeInTheDocument();
  });

  it("renders user type badges", () => {
    const users = [
      makeUser({ login: "org1", id: 1, type: "Organization" }),
      makeUser({ login: "user1", id: 2, type: "User" }),
    ];
    render(
      <FollowingList users={users} loading={false} username="test" progress={0} />
    );
    expect(screen.getByText("Organization")).toBeInTheDocument();
    expect(screen.getByText("User")).toBeInTheDocument();
  });

  it("filters users by username", async () => {
    const user = userEvent.setup();
    const users = [
      makeUser({ login: "alice", id: 1 }),
      makeUser({ login: "bob", id: 2 }),
    ];
    render(
      <FollowingList users={users} loading={false} username="test" progress={0} />
    );

    const filterInput = screen.getByPlaceholderText(/filter following/i);
    await user.type(filterInput, "alice");

    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.queryByText("bob")).not.toBeInTheDocument();
  });

  it("shows filtered count", () => {
    const users = [makeUser({ login: "a", id: 1 }), makeUser({ login: "b", id: 2 })];
    render(
      <FollowingList users={users} loading={false} username="test" progress={0} />
    );
    expect(screen.getByText(/2 of 2 accounts/)).toBeInTheDocument();
  });

  it("renders CSV and JSON export buttons", () => {
    render(
      <FollowingList users={[makeUser()]} loading={false} username="test" progress={0} />
    );
    expect(screen.getByRole("button", { name: /csv/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /json/i })).toBeInTheDocument();
  });

  it("links user cards to GitHub profiles", () => {
    render(
      <FollowingList users={[makeUser({ login: "alice", html_url: "https://github.com/alice" })]} loading={false} username="test" progress={0} />
    );
    const link = screen.getByText("alice").closest("a");
    expect(link).toHaveAttribute("href", "https://github.com/alice");
    expect(link).toHaveAttribute("target", "_blank");
  });
});
