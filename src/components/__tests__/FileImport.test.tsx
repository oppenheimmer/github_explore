import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FileImport from "../FileImport";

describe("FileImport", () => {
  it("renders textarea with default placeholder", () => {
    render(<FileImport onImport={vi.fn()} />);
    expect(screen.getByPlaceholderText(/paste lines here/i)).toBeInTheDocument();
  });

  it("renders textarea with custom placeholder", () => {
    render(<FileImport onImport={vi.fn()} placeholder="Custom placeholder" />);
    expect(screen.getByPlaceholderText("Custom placeholder")).toBeInTheDocument();
  });

  it("renders Import button with custom label", () => {
    render(<FileImport onImport={vi.fn()} label="Import Repos" />);
    expect(screen.getByRole("button", { name: /import repos/i })).toBeInTheDocument();
  });

  it("Import button is disabled when textarea is empty", () => {
    render(<FileImport onImport={vi.fn()} label="Import" />);
    expect(screen.getByRole("button", { name: /import/i })).toBeDisabled();
  });

  it("calls onImport with parsed lines on paste button click", async () => {
    const onImport = vi.fn();
    const user = userEvent.setup();
    render(<FileImport onImport={onImport} label="Import" />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "line1\nline2\nline3");
    await user.click(screen.getByRole("button", { name: /import/i }));

    expect(onImport).toHaveBeenCalledWith(["line1", "line2", "line3"]);
  });

  it("filters out empty lines", async () => {
    const onImport = vi.fn();
    const user = userEvent.setup();
    render(<FileImport onImport={onImport} label="Import" />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "line1\n\n\nline2");
    await user.click(screen.getByRole("button", { name: /import/i }));

    expect(onImport).toHaveBeenCalledWith(["line1", "line2"]);
  });

  it("renders Upload File button", () => {
    render(<FileImport onImport={vi.fn()} />);
    expect(screen.getByRole("button", { name: /upload file/i })).toBeInTheDocument();
  });

  it("calls onImport when a file is uploaded", async () => {
    const onImport = vi.fn();
    render(<FileImport onImport={onImport} accept=".txt" />);

    const fileContent = "owner/repo1\nowner/repo2";
    const file = new File([fileContent], "test.txt", { type: "text/plain" });

    // Find the hidden file input and trigger change via fireEvent
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, "files", { value: [file], writable: false });
    fireEvent.change(fileInput);

    // FileReader is async, so wait for the callback
    await waitFor(() => {
      expect(onImport).toHaveBeenCalledWith(["owner/repo1", "owner/repo2"]);
    });
  });
});
