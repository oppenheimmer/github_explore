import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MigrateTab from "../MigrateTab";

describe("MigrateTab", () => {
  it("renders description text", () => {
    render(<MigrateTab token="" />);
    expect(screen.getByText(/import your starred repos/i)).toBeInTheDocument();
  });

  it("renders Star Repos and Follow Users sub-tabs", () => {
    render(<MigrateTab token="" />);
    expect(screen.getByRole("tab", { name: /star repos/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /follow users/i })).toBeInTheDocument();
  });

  it("shows Star Repos content by default", () => {
    render(<MigrateTab token="" />);
    // StarManager's placeholder text
    expect(screen.getByText(/paste github repo urls/i)).toBeInTheDocument();
  });

  it("switches to Follow Users sub-tab", async () => {
    const user = userEvent.setup();
    render(<MigrateTab token="test-token" />);

    await user.click(screen.getByRole("tab", { name: /follow users/i }));
    // FollowManager's placeholder text
    expect(screen.getByText(/paste github usernames/i)).toBeInTheDocument();
  });
});
