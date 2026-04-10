/**
 * Parse lines of text into `owner/repo` strings.
 *
 * Accepts `owner/repo` or `https://github.com/owner/repo` formats.
 * Lines that don't contain a `/` after normalisation are discarded.
 */
export function parseRepoLines(lines: string[]): string[] {
  return lines
    .map((line) => line.replace(/^https?:\/\/github\.com\//, "").replace(/\/+$/, ""))
    .filter((r) => r.includes("/"));
}

/**
 * Parse lines of text into GitHub usernames.
 *
 * Handles:
 *   - plain usernames (`alice`)
 *   - profile URLs (`https://github.com/alice`)
 *   - CSV rows where the first column is the username
 *   - skips a literal `username` header row
 *   - discards entries that still contain a `/` (likely repo lines)
 */
export function parseUserLines(lines: string[]): string[] {
  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.includes(",")) {
        const first = trimmed.split(",")[0];
        return first.replace(/^"|"$/g, "").trim();
      }
      return trimmed.replace(/^https?:\/\/github\.com\//, "").replace(/\/+$/, "");
    })
    .filter((u) => u && !u.includes("/") && u !== "username");
}
