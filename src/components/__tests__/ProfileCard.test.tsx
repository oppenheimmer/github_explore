import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProfileCard from "../ProfileCard";
import type { GitHubUser } from "@/types/github";

const baseUser: GitHubUser = {
  login: "octocat",
  id: 1,
  avatar_url: "https://avatars.githubusercontent.com/u/1",
  html_url: "https://github.com/octocat",
  name: "The Octocat",
  company: "@github",
  blog: "https://github.blog",
  location: "San Francisco",
  bio: "A test user bio",
  public_repos: 42,
  followers: 1000,
  following: 10,
  type: "User",
  created_at: "2008-01-14T04:33:35Z",
};

describe("ProfileCard", () => {
  it("renders the user name and login", () => {
    render(<ProfileCard user={baseUser} />);
    expect(screen.getByText("The Octocat")).toBeInTheDocument();
    expect(screen.getByText("@octocat")).toBeInTheDocument();
  });

  it("renders avatar element", () => {
    render(<ProfileCard user={baseUser} />);
    // The Avatar component renders a span fallback initially in jsdom;
    // verify the fallback text is present (first two chars uppercased)
    expect(screen.getByText("OC")).toBeInTheDocument();
  });

  it("renders bio", () => {
    render(<ProfileCard user={baseUser} />);
    expect(screen.getByText("A test user bio")).toBeInTheDocument();
  });

  it("renders company", () => {
    render(<ProfileCard user={baseUser} />);
    expect(screen.getByText("@github")).toBeInTheDocument();
  });

  it("renders location", () => {
    render(<ProfileCard user={baseUser} />);
    expect(screen.getByText("San Francisco")).toBeInTheDocument();
  });

  it("renders blog link", () => {
    render(<ProfileCard user={baseUser} />);
    const link = screen.getByText("https://github.blog");
    expect(link.closest("a")).toHaveAttribute("href", "https://github.blog");
  });

  it("renders repo, followers, and following counts", () => {
    render(<ProfileCard user={baseUser} />);
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("1000")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("renders user type badge", () => {
    render(<ProfileCard user={baseUser} />);
    expect(screen.getByText("User")).toBeInTheDocument();
  });

  it("shows login as name when name is null", () => {
    render(<ProfileCard user={{ ...baseUser, name: null }} />);
    // The link text should be the login
    const links = screen.getAllByText("octocat");
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it("hides bio when null", () => {
    render(<ProfileCard user={{ ...baseUser, bio: null }} />);
    expect(screen.queryByText("A test user bio")).not.toBeInTheDocument();
  });

  it("hides company when null", () => {
    render(<ProfileCard user={{ ...baseUser, company: null }} />);
    expect(screen.queryByText("@github")).not.toBeInTheDocument();
  });

  it("hides location when null", () => {
    render(<ProfileCard user={{ ...baseUser, location: null }} />);
    expect(screen.queryByText("San Francisco")).not.toBeInTheDocument();
  });

  it("hides blog when empty", () => {
    render(<ProfileCard user={{ ...baseUser, blog: "" }} />);
    expect(screen.queryByText("https://github.blog")).not.toBeInTheDocument();
  });

  it("prepends https:// to blog without scheme", () => {
    render(<ProfileCard user={{ ...baseUser, blog: "example.com" }} />);
    const link = screen.getByText("example.com");
    expect(link.closest("a")).toHaveAttribute("href", "https://example.com");
  });

  it("renders Organization badge for org type", () => {
    render(<ProfileCard user={{ ...baseUser, type: "Organization" }} />);
    expect(screen.getByText("Organization")).toBeInTheDocument();
  });
});
