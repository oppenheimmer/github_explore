import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StarManager from "../StarManager";

// Mock the github module
vi.mock("@/lib/github", () => ({
  fetchAllStarredRepoNames: vi.fn(),
  starRepo: vi.fn(),
  unstarRepo: vi.fn(),
}));

import { fetchAllStarredRepoNames, starRepo, unstarRepo } from "@/lib/github";

describe("StarManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders import prompt when no repos loaded", () => {
    render(<StarManager token="test-token" />);
    expect(screen.getByText(/paste github repo urls/i)).toBeInTheDocument();
  });

  it("renders textarea and import button", () => {
    render(<StarManager token="test-token" />);
    expect(screen.getByPlaceholderText(/https:\/\/github\.com\/owner\/repo/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /import repos/i })).toBeInTheDocument();
  });

  it("imports owner/repo lines and shows repo list", async () => {
    const user = userEvent.setup();
    render(<StarManager token="test-token" />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "facebook/react\nvercel/next.js");
    await user.click(screen.getByRole("button", { name: /import repos/i }));

    // Repo names are split across spans; check the link hrefs instead
    expect(screen.getByRole("link", { name: /react/ })).toHaveAttribute("href", "https://github.com/facebook/react");
    expect(screen.getByRole("link", { name: /next\.js/ })).toHaveAttribute("href", "https://github.com/vercel/next.js");
  });

  it("imports GitHub URL lines and strips domain", async () => {
    const user = userEvent.setup();
    render(<StarManager token="test-token" />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "https://github.com/owner/repo");
    await user.click(screen.getByRole("button", { name: /import repos/i }));

    expect(screen.getByRole("link", { name: /repo/ })).toHaveAttribute("href", "https://github.com/owner/repo");
  });

  it("filters out lines without a slash", async () => {
    const user = userEvent.setup();
    render(<StarManager token="test-token" />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "invalidline\nowner/repo");
    await user.click(screen.getByRole("button", { name: /import repos/i }));

    expect(screen.getByRole("link", { name: /repo/ })).toHaveAttribute("href", "https://github.com/owner/repo");
    // Only 1 repo should be listed
    expect(screen.getByText(/0 \/ 1 starred/)).toBeInTheDocument();
  });

  it("deduplicates repos", async () => {
    const user = userEvent.setup();
    render(<StarManager token="test-token" />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "owner/repo\nowner/repo");
    await user.click(screen.getByRole("button", { name: /import repos/i }));

    expect(screen.getByText(/0 \/ 1 starred/)).toBeInTheDocument();
  });

  it("check status fetches starred repos and updates state", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchAllStarredRepoNames).mockResolvedValueOnce(new Set(["owner/repo"]));

    render(<StarManager token="test-token" />);

    // Import a repo
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "owner/repo\nother/lib");
    await user.click(screen.getByRole("button", { name: /import repos/i }));

    // Click Check Status
    await user.click(screen.getByRole("button", { name: /check status/i }));

    await waitFor(() => {
      expect(fetchAllStarredRepoNames).toHaveBeenCalledWith("test-token", expect.any(Function));
    });
  });

  it("star button calls starRepo API", async () => {
    const user = userEvent.setup();
    vi.mocked(starRepo).mockResolvedValueOnce(true);

    render(<StarManager token="test-token" />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "owner/repo");
    await user.click(screen.getByRole("button", { name: /import repos/i }));

    // Click the Star button for the repo
    const starBtn = screen.getByRole("button", { name: /^star$/i });
    await user.click(starBtn);

    await waitFor(() => {
      expect(starRepo).toHaveBeenCalledWith("owner/repo", "test-token");
    });
  });

  it("filter input narrows repo list", async () => {
    const user = userEvent.setup();
    render(<StarManager token="test-token" />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "owner/alpha\nowner/beta");
    await user.click(screen.getByRole("button", { name: /import repos/i }));

    const filterInput = screen.getByPlaceholderText(/filter repos/i);
    await user.type(filterInput, "alpha");

    expect(screen.getByRole("link", { name: /alpha/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /beta/ })).not.toBeInTheDocument();
  });

  it("clear button resets the list", async () => {
    const user = userEvent.setup();
    render(<StarManager token="test-token" />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "owner/repo");
    await user.click(screen.getByRole("button", { name: /import repos/i }));

    expect(screen.getByRole("link", { name: /repo/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear/i }));

    // Back to import prompt
    expect(screen.getByText(/paste github repo urls/i)).toBeInTheDocument();
  });
});
