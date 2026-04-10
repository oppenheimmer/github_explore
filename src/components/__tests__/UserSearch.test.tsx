import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserSearch from "../UserSearch";

describe("UserSearch", () => {
  it("renders search input and Explore button", () => {
    render(<UserSearch onSearch={vi.fn()} loading={false} />);
    expect(screen.getByPlaceholderText(/enter github username/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /explore/i })).toBeInTheDocument();
  });

  it("Explore button is disabled when input is empty", () => {
    render(<UserSearch onSearch={vi.fn()} loading={false} />);
    expect(screen.getByRole("button", { name: /explore/i })).toBeDisabled();
  });

  it("Explore button is disabled when loading", async () => {
    const user = userEvent.setup();
    render(<UserSearch onSearch={vi.fn()} loading={true} />);
    const input = screen.getByPlaceholderText(/enter github username/i);
    await user.type(input, "octocat");
    // button shows spinner when loading — no "Explore" text
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toBeDisabled();
  });

  it("calls onSearch with trimmed username on submit", async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<UserSearch onSearch={onSearch} loading={false} />);

    const input = screen.getByPlaceholderText(/enter github username/i);
    await user.type(input, "  octocat  ");
    await user.click(screen.getByRole("button", { name: /explore/i }));

    expect(onSearch).toHaveBeenCalledWith("octocat");
  });

  it("submits on Enter key", async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<UserSearch onSearch={onSearch} loading={false} />);

    const input = screen.getByPlaceholderText(/enter github username/i);
    await user.type(input, "octocat{Enter}");

    expect(onSearch).toHaveBeenCalledWith("octocat");
  });

  it("does not call onSearch when input is whitespace-only", async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<UserSearch onSearch={onSearch} loading={false} />);

    const input = screen.getByPlaceholderText(/enter github username/i);
    await user.type(input, "   {Enter}");

    expect(onSearch).not.toHaveBeenCalled();
  });
});
