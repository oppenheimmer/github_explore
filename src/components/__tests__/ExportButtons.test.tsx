import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExportButtons from "../ExportButtons";

// Mock the export module
vi.mock("@/lib/export", () => ({
  exportToCSV: vi.fn(),
  exportToJSON: vi.fn(),
}));

import { exportToCSV, exportToJSON } from "@/lib/export";

describe("ExportButtons", () => {
  const sampleData = [
    { name: "repo1", stars: 10 },
    { name: "repo2", stars: 20 },
  ];

  it("renders CSV and JSON buttons", () => {
    render(<ExportButtons data={sampleData} filenamePrefix="test" />);
    expect(screen.getByRole("button", { name: /csv/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /json/i })).toBeInTheDocument();
  });

  it("buttons are disabled when data is empty", () => {
    render(<ExportButtons data={[]} filenamePrefix="test" />);
    expect(screen.getByRole("button", { name: /csv/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /json/i })).toBeDisabled();
  });

  it("buttons are disabled when disabled prop is true", () => {
    render(<ExportButtons data={sampleData} filenamePrefix="test" disabled />);
    expect(screen.getByRole("button", { name: /csv/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /json/i })).toBeDisabled();
  });

  it("calls exportToCSV on CSV button click", async () => {
    const user = userEvent.setup();
    render(<ExportButtons data={sampleData} filenamePrefix="my-export" />);
    await user.click(screen.getByRole("button", { name: /csv/i }));
    expect(exportToCSV).toHaveBeenCalledWith(sampleData, "my-export.csv");
  });

  it("calls exportToJSON on JSON button click", async () => {
    const user = userEvent.setup();
    render(<ExportButtons data={sampleData} filenamePrefix="my-export" />);
    await user.click(screen.getByRole("button", { name: /json/i }));
    expect(exportToJSON).toHaveBeenCalledWith(sampleData, "my-export.json");
  });
});
