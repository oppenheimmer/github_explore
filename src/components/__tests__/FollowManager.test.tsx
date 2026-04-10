import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FollowManager from "../FollowManager";

vi.mock("@/lib/github", () => ({
  checkFollowingUser: vi.fn(),
  followUser: vi.fn(),
  unfollowUser: vi.fn(),
}));

import { checkFollowingUser, followUser } from "@/lib/github";

describe("FollowManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders import prompt when no users loaded", () => {
    render(<FollowManager token="test-token" />);
    expect(screen.getByText(/paste github usernames/i)).toBeInTheDocument();
  });

  it("renders textarea and import button", () => {
    render(<FollowManager token="test-token" />);
    expect(screen.getByPlaceholderText(/username1/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /import users/i })).toBeInTheDocument();
  });

  it("imports plain username lines", async () => {
    const user = userEvent.setup();
    render(<FollowManager token="test-token" />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "alice\nbob");
    await user.click(screen.getByRole("button", { name: /import users/i }));

    expect(screen.getByText("@alice")).toBeInTheDocument();
    expect(screen.getByText("@bob")).toBeInTheDocument();
  });

  it("strips GitHub URL prefix from usernames", async () => {
    const user = userEvent.setup();
    render(<FollowManager token="test-token" />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "https://github.com/alice");
    await user.click(screen.getByRole("button", { name: /import users/i }));

    expect(screen.getByText("@alice")).toBeInTheDocument();
  });

  it("parses CSV lines (first column as username)", async () => {
    const user = userEvent.setup();
    render(<FollowManager token="test-token" />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "username,profile_url,type\nalice,https://github.com/alice,User");
    await user.click(screen.getByRole("button", { name: /import users/i }));

    expect(screen.getByText("@alice")).toBeInTheDocument();
  });

  it("skips CSV header row with 'username' value", async () => {
    const user = userEvent.setup();
    render(<FollowManager token="test-token" />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "username\nalice\nbob");
    await user.click(screen.getByRole("button", { name: /import users/i }));

    expect(screen.getByText(/0 \/ 2 following/)).toBeInTheDocument();
  });

  it("filters out lines containing slashes (repo-style lines)", async () => {
    const user = userEvent.setup();
    render(<FollowManager token="test-token" />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "alice\nowner/repo");
    await user.click(screen.getByRole("button", { name: /import users/i }));

    expect(screen.getByText("@alice")).toBeInTheDocument();
    expect(screen.getByText(/0 \/ 1 following/)).toBeInTheDocument();
  });

  it("deduplicates usernames", async () => {
    const user = userEvent.setup();
    render(<FollowManager token="test-token" />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "alice\nalice");
    await user.click(screen.getByRole("button", { name: /import users/i }));

    expect(screen.getByText(/0 \/ 1 following/)).toBeInTheDocument();
  });

  it("check status calls checkFollowingUser for each user", async () => {
    const user = userEvent.setup();
    vi.mocked(checkFollowingUser).mockResolvedValue(true);

    render(<FollowManager token="test-token" />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "alice\nbob");
    await user.click(screen.getByRole("button", { name: /import users/i }));

    await user.click(screen.getByRole("button", { name: /check status/i }));

    await waitFor(() => {
      expect(checkFollowingUser).toHaveBeenCalledWith("alice", "test-token");
      expect(checkFollowingUser).toHaveBeenCalledWith("bob", "test-token");
    });
  });

  it("follow button calls followUser API", async () => {
    const user = userEvent.setup();
    vi.mocked(followUser).mockResolvedValueOnce(true);

    render(<FollowManager token="test-token" />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "alice");
    await user.click(screen.getByRole("button", { name: /import users/i }));

    const followBtn = screen.getByRole("button", { name: /^follow$/i });
    await user.click(followBtn);

    await waitFor(() => {
      expect(followUser).toHaveBeenCalledWith("alice", "test-token");
    });
  });

  it("filter input narrows user list", async () => {
    const user = userEvent.setup();
    render(<FollowManager token="test-token" />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "alice\nbob");
    await user.click(screen.getByRole("button", { name: /import users/i }));

    const filterInput = screen.getByPlaceholderText(/filter users/i);
    await user.type(filterInput, "alice");

    expect(screen.getByText("@alice")).toBeInTheDocument();
    expect(screen.queryByText("@bob")).not.toBeInTheDocument();
  });

  it("clear button resets the list", async () => {
    const user = userEvent.setup();
    render(<FollowManager token="test-token" />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "alice");
    await user.click(screen.getByRole("button", { name: /import users/i }));

    expect(screen.getByText("@alice")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear/i }));

    expect(screen.getByText(/paste github usernames/i)).toBeInTheDocument();
  });
});
