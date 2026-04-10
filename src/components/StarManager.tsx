"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import FileImport from "./FileImport";
import { fetchAllStarredRepoNames, starRepo, unstarRepo } from "@/lib/github";
import type { MigrateRepoItem } from "@/types/github";

interface StarManagerProps {
  token: string;
}

function parseRepoLines(lines: string[]): string[] {
  return lines.map((line) => {
    let repo = line.replace(/^https?:\/\/github\.com\//, "");
    repo = repo.replace(/\/+$/, "");
    return repo;
  }).filter((r) => r.includes("/"));
}

export default function StarManager({ token }: StarManagerProps) {
  const [repos, setRepos] = useState<MigrateRepoItem[]>([]);
  const [filter, setFilter] = useState("");
  const [checking, setChecking] = useState(false);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleImport = useCallback((lines: string[]) => {
    const parsed = parseRepoLines(lines);
    const unique = [...new Set(parsed)];
    setRepos(
      unique.map((fullName) => ({
        fullName,
        starred: false,
        loading: false,
        error: false,
      }))
    );
  }, []);

  const checkStatus = useCallback(async () => {
    if (!token) {
      alert("Please enter a GitHub Personal Access Token in the header.");
      return;
    }
    setChecking(true);
    try {
      const starredSet = await fetchAllStarredRepoNames(token, (n) =>
        setProgress({ current: n, total: 0 })
      );
      setRepos((prev) =>
        prev.map((r) => ({ ...r, starred: starredSet.has(r.fullName), error: false }))
      );
    } catch {
      // silently ignore — partial results are still useful
    }
    setChecking(false);
  }, [token]);

  const toggleStar = useCallback(
    async (index: number) => {
      if (!token) {
        alert("Please enter a GitHub Personal Access Token in the header.");
        return;
      }
      setRepos((prev) =>
        prev.map((r, i) => (i === index ? { ...r, loading: true, error: false } : r))
      );
      const repo = repos[index];
      try {
        const ok = repo.starred
          ? await unstarRepo(repo.fullName, token)
          : await starRepo(repo.fullName, token);
        setRepos((prev) =>
          prev.map((r, i) =>
            i === index
              ? { ...r, loading: false, starred: ok ? !repo.starred : repo.starred, error: !ok }
              : r
          )
        );
      } catch {
        setRepos((prev) =>
          prev.map((r, i) => (i === index ? { ...r, loading: false, error: true } : r))
        );
      }
    },
    [token, repos]
  );

  const starAllRemaining = useCallback(async () => {
    if (!token) {
      alert("Please enter a GitHub Personal Access Token in the header.");
      return;
    }
    const remaining = repos
      .map((r, i) => ({ ...r, index: i }))
      .filter((r) => !r.starred);
    if (remaining.length === 0) {
      alert("All repos are already starred!");
      return;
    }
    if (!confirm(`Star ${remaining.length} remaining repos?`)) return;

    setBulkRunning(true);
    setProgress({ current: 0, total: remaining.length });

    for (let i = 0; i < remaining.length; i++) {
      const { index, fullName } = remaining[i];
      setRepos((prev) =>
        prev.map((r, j) => (j === index ? { ...r, loading: true, error: false } : r))
      );
      try {
        const ok = await starRepo(fullName, token);
        setRepos((prev) =>
          prev.map((r, j) =>
            j === index ? { ...r, loading: false, starred: ok, error: !ok } : r
          )
        );
        if (!ok) {
          // likely rate-limited
          alert("Rate limited by GitHub. Try again in a minute.");
          break;
        }
      } catch {
        setRepos((prev) =>
          prev.map((r, j) => (j === index ? { ...r, loading: false, error: true } : r))
        );
        break;
      }
      setProgress({ current: i + 1, total: remaining.length });
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    setBulkRunning(false);
  }, [token, repos]);

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    return repos.map((r, i) => ({ ...r, index: i })).filter((r) =>
      !q ? true : r.fullName.toLowerCase().includes(q)
    );
  }, [repos, filter]);

  const starredCount = repos.filter((r) => r.starred).length;

  if (repos.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Paste GitHub repo URLs or <code>owner/repo</code> lines, or upload a
          text file.
        </p>
        <FileImport
          onImport={handleImport}
          placeholder={"https://github.com/owner/repo\nowner/repo\n…"}
          accept=".txt"
          label="Import Repos"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter repos…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {starredCount} / {repos.length} starred
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={checkStatus}
            disabled={checking || bulkRunning}
          >
            {checking ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            )}
            Check Status
          </Button>
          <Button
            size="sm"
            onClick={starAllRemaining}
            disabled={checking || bulkRunning}
          >
            {bulkRunning ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Star className="h-3.5 w-3.5 mr-1" />
            )}
            Star All Remaining
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setRepos([]);
              setFilter("");
            }}
          >
            Clear
          </Button>
        </div>
      </div>

      {(checking || bulkRunning) && progress.total > 0 && (
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{
              width: `${(progress.current / progress.total) * 100}%`,
            }}
          />
        </div>
      )}

      {checking && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}

      <div className="rounded-md border divide-y max-h-[60vh] overflow-y-auto">
        {filtered.map((repo) => (
          <div
            key={repo.fullName}
            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50"
          >
            <span className="text-muted-foreground text-xs min-w-[2rem] text-right">
              {repo.index + 1}
            </span>
            <a
              href={`https://github.com/${repo.fullName}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-primary hover:underline truncate font-mono text-xs"
            >
              <span className="text-muted-foreground">
                {repo.fullName.split("/")[0]}/
              </span>
              {repo.fullName.split("/")[1]}
            </a>
            <Button
              size="sm"
              variant={repo.starred ? "secondary" : "outline"}
              className={`min-w-[100px] text-xs ${repo.error ? "border-destructive text-destructive" : ""}`}
              disabled={repo.loading || bulkRunning}
              onClick={() => toggleStar(repo.index)}
            >
              {repo.loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : repo.error ? (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Error
                </>
              ) : repo.starred ? (
                <>
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Starred
                </>
              ) : (
                <>
                  <Star className="h-3 w-3 mr-1" />
                  Star
                </>
              )}
            </Button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && repos.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          No repos match the filter.
        </p>
      )}
    </div>
  );
}
