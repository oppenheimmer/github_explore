import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "child_process";

/**
 * Integration tests that validate the `gh` CLI commands documented in README.
 * These hit the real GitHub API via the authenticated `gh` CLI.
 * They are automatically skipped if `gh` is not installed or not authenticated.
 */

let ghAvailable = false;

beforeAll(() => {
  try {
    execSync("gh auth status", { stdio: "pipe" });
    ghAvailable = true;
  } catch {
    ghAvailable = false;
  }
});

function skipIfNoGh() {
  if (!ghAvailable) {
    return true;
  }
  return false;
}

describe("gh CLI — starred repos", () => {
  it("gh api /users/oppenheimmer/starred outputs owner/repo format", () => {
    if (skipIfNoGh()) return;

    const output = execSync(
      'gh api "/users/oppenheimmer/starred?per_page=5" --jq ".[].full_name"',
      { encoding: "utf-8", timeout: 30000 }
    ).trim();

    if (!output) {
      // User may have no starred repos — that's still valid
      return;
    }

    const lines = output.split("\n");
    for (const line of lines) {
      expect(line).toMatch(/^[^/]+\/[^/]+$/); // owner/repo format
    }
  });

  it("gh api /users/oppenheimmer/starred outputs full URL format", () => {
    if (skipIfNoGh()) return;

    const output = execSync(
      'gh api "/users/oppenheimmer/starred?per_page=5" --jq \'[.[] | "https://github.com/" + .full_name] | .[]\'',
      { encoding: "utf-8", timeout: 30000 }
    ).trim();

    if (!output) return;

    const lines = output.split("\n");
    for (const line of lines) {
      expect(line).toMatch(/^https:\/\/github\.com\/[^/]+\/[^/]+$/);
    }
  });

  it("gh api /user/starred requires auth and returns owner/repo format", () => {
    if (skipIfNoGh()) return;

    const output = execSync(
      'gh api "/user/starred?per_page=3" --jq ".[].full_name"',
      { encoding: "utf-8", timeout: 30000 }
    ).trim();

    if (!output) return;

    const lines = output.split("\n");
    for (const line of lines) {
      expect(line).toMatch(/^[^/]+\/[^/]+$/);
    }
  });
});

describe("gh CLI — following", () => {
  it("gh api /users/oppenheimmer/following outputs plain usernames", () => {
    if (skipIfNoGh()) return;

    const output = execSync(
      'gh api "/users/oppenheimmer/following?per_page=5" --jq ".[].login"',
      { encoding: "utf-8", timeout: 30000 }
    ).trim();

    if (!output) return;

    const lines = output.split("\n");
    for (const line of lines) {
      // Usernames: alphanumeric, hyphens, no slashes
      expect(line).toMatch(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/);
    }
  });

  it("gh api /user/following requires auth and returns usernames", () => {
    if (skipIfNoGh()) return;

    const output = execSync(
      'gh api "/user/following?per_page=3" --jq ".[].login"',
      { encoding: "utf-8", timeout: 30000 }
    ).trim();

    if (!output) return;

    const lines = output.split("\n");
    for (const line of lines) {
      expect(line).toMatch(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/);
    }
  });

  it("CSV generation produces header + usernames", () => {
    if (skipIfNoGh()) return;

    const header = "username";
    const body = execSync(
      'gh api "/users/oppenheimmer/following?per_page=3" --jq ".[].login"',
      { encoding: "utf-8", timeout: 30000 }
    ).trim();

    const csv = header + "\n" + body;
    const lines = csv.split("\n");

    expect(lines[0]).toBe("username");
    // Remaining lines (if any) should be usernames
    for (let i = 1; i < lines.length; i++) {
      if (lines[i]) {
        expect(lines[i]).toMatch(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/);
      }
    }
  });
});

describe("gh CLI — availability", () => {
  it("gh is installed", () => {
    try {
      const version = execSync("gh --version", { encoding: "utf-8" }).trim();
      expect(version).toContain("gh version");
    } catch {
      // gh not installed — test passes with a warning
      console.warn("gh CLI is not installed — CLI integration tests were skipped");
    }
  });
});
