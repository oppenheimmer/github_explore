"use client";

import { useState, useMemo } from "react";
import { StarredRepo } from "@/types/github";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, GitFork, Search, ArrowUpDown } from "lucide-react";
import ExportButtons from "./ExportButtons";

interface StarredReposTableProps {
  repos: StarredRepo[];
  loading: boolean;
  username: string;
  progress: number;
}

type SortKey = "name" | "stargazers_count" | "forks_count" | "language" | "updated_at";
type SortDir = "asc" | "desc";

export default function StarredReposTable({
  repos,
  loading,
  username,
  progress,
}: StarredReposTableProps) {
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("stargazers_count");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    let items = repos;
    if (q) {
      items = repos.filter(
        (r) =>
          r.full_name.toLowerCase().includes(q) ||
          (r.description?.toLowerCase().includes(q) ?? false) ||
          (r.language?.toLowerCase().includes(q) ?? false) ||
          r.topics.some((t) => t.toLowerCase().includes(q))
      );
    }
    return [...items].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const cmp = typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [repos, filter, sortKey, sortDir]);

  const exportData = filtered.map((r) => ({
    name: r.full_name,
    url: r.html_url,
    description: r.description ?? "",
    language: r.language ?? "",
    stars: r.stargazers_count,
    forks: r.forks_count,
    topics: r.topics,
    updated: r.updated_at,
  }));

  if (loading) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Loading starred repos… {progress > 0 && `(${progress} loaded)`}
        </p>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Star className="h-10 w-10 mb-3 opacity-30" />
        <p>No starred repositories found.</p>
      </div>
    );
  }

  const SortHeader = ({ label, col }: { label: string; col: SortKey }) => (
    <button
      className="flex items-center gap-1 hover:text-foreground transition-colors"
      onClick={() => toggleSort(col)}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <div className="space-y-3">
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
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {filtered.length} of {repos.length} repos
          </span>
          <ExportButtons
            data={exportData as unknown as Record<string, unknown>[]}
            filenamePrefix={`${username}-starred-repos`}
          />
        </div>
      </div>

      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">
                <SortHeader label="Repository" col="name" />
              </TableHead>
              <TableHead className="hidden md:table-cell min-w-[200px]">Description</TableHead>
              <TableHead>
                <SortHeader label="Language" col="language" />
              </TableHead>
              <TableHead className="text-right">
                <SortHeader label="Stars" col="stargazers_count" />
              </TableHead>
              <TableHead className="text-right hidden sm:table-cell">
                <SortHeader label="Forks" col="forks_count" />
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                <SortHeader label="Updated" col="updated_at" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((repo) => (
              <TableRow key={repo.id}>
                <TableCell>
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {repo.full_name}
                  </a>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-xs truncate">
                  {repo.description || "—"}
                </TableCell>
                <TableCell>
                  {repo.language ? (
                    <Badge variant="secondary" className="text-xs">
                      {repo.language}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <span className="flex items-center justify-end gap-1">
                    <Star className="h-3.5 w-3.5" />
                    {repo.stargazers_count.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="text-right hidden sm:table-cell">
                  <span className="flex items-center justify-end gap-1">
                    <GitFork className="h-3.5 w-3.5" />
                    {repo.forks_count.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  {new Date(repo.updated_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
