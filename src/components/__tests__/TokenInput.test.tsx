import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TokenInput from "../TokenInput";

describe("TokenInput", () => {
  it("renders a password input with placeholder", () => {
    render(<TokenInput token="" onTokenChange={vi.fn()} />);
    const input = screen.getByPlaceholderText("GitHub Personal Access Token");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "password");
  });

  it("displays the token value", () => {
    render(<TokenInput token="ghp_abc123" onTokenChange={vi.fn()} />);
    const input = screen.getByPlaceholderText("GitHub Personal Access Token");
    expect(input).toHaveValue("ghp_abc123");
  });

  it("toggles visibility between password and text", async () => {
    const user = userEvent.setup();
    render(<TokenInput token="secret" onTokenChange={vi.fn()} />);
    const input = screen.getByPlaceholderText("GitHub Personal Access Token");

    expect(input).toHaveAttribute("type", "password");

    // Click the visibility toggle (the button with Eye icon)
    const toggleBtn = input.parentElement!.querySelector("button")!;
    await user.click(toggleBtn);
    expect(input).toHaveAttribute("type", "text");

    await user.click(toggleBtn);
    expect(input).toHaveAttribute("type", "password");
  });

  it("calls onTokenChange when typing", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TokenInput token="" onTokenChange={onChange} />);
    const input = screen.getByPlaceholderText("GitHub Personal Access Token");

    await user.type(input, "abc");
    expect(onChange).toHaveBeenCalled();
  });

  it("persists token to localStorage on change", async () => {
    const user = userEvent.setup();
    render(<TokenInput token="" onTokenChange={vi.fn()} />);
    const input = screen.getByPlaceholderText("GitHub Personal Access Token");

    await user.type(input, "t");
    expect(localStorage.setItem).toHaveBeenCalledWith("gh_token", "t");
  });

  it("shows Clear button when token is present", () => {
    render(<TokenInput token="abc" onTokenChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
  });

  it("does not show Clear button when token is empty", () => {
    render(<TokenInput token="" onTokenChange={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /clear/i })).not.toBeInTheDocument();
  });

  it("clears token and localStorage on Clear click", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TokenInput token="abc" onTokenChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /clear/i }));
    expect(onChange).toHaveBeenCalledWith("");
    expect(localStorage.removeItem).toHaveBeenCalledWith("gh_token");
  });
});
