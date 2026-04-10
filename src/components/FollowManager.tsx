"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserPlus,
} from "lucide-react";
import FileImport from "./FileImport";
import { checkFollowingUser, followUser, unfollowUser } from "@/lib/github";
import { parseUserLines } from "@/lib/parsers";
import type { MigrateUserItem } from "@/types/github";

interface FollowManagerProps {
  token: string;
}

export default function FollowManager({ token }: FollowManagerProps) {
  const [users, setUsers] = useState<MigrateUserItem[]>([]);
  const [filter, setFilter] = useState("");
  const [checking, setChecking] = useState(false);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleImport = useCallback((lines: string[]) => {
    const parsed = parseUserLines(lines);
    const unique = [...new Set(parsed)];
    setUsers(
      unique.map((username) => ({
        username,
        following: false,
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
    setProgress({ current: 0, total: users.length });

    const updated = [...users];
    for (let i = 0; i < updated.length; i++) {
      try {
        const isFollowing = await checkFollowingUser(updated[i].username, token);
        updated[i] = { ...updated[i], following: isFollowing, error: false };
      } catch {
        updated[i] = { ...updated[i], error: true };
      }
      setProgress({ current: i + 1, total: updated.length });
      // Small delay to avoid rate-limiting
      if (i % 20 === 19) await new Promise((r) => setTimeout(r, 200));
    }
    setUsers(updated);
    setChecking(false);
  }, [token, users]);

  const toggleFollow = useCallback(
    async (index: number) => {
      if (!token) {
        alert("Please enter a GitHub Personal Access Token in the header.");
        return;
      }
      setUsers((prev) =>
        prev.map((u, i) => (i === index ? { ...u, loading: true, error: false } : u))
      );
      const user = users[index];
      try {
        const ok = user.following
          ? await unfollowUser(user.username, token)
          : await followUser(user.username, token);
        setUsers((prev) =>
          prev.map((u, i) =>
            i === index
              ? { ...u, loading: false, following: ok ? !user.following : user.following, error: !ok }
              : u
          )
        );
      } catch {
        setUsers((prev) =>
          prev.map((u, i) => (i === index ? { ...u, loading: false, error: true } : u))
        );
      }
    },
    [token, users]
  );

  const followAllRemaining = useCallback(async () => {
    if (!token) {
      alert("Please enter a GitHub Personal Access Token in the header.");
      return;
    }
    const remaining = users
      .map((u, i) => ({ ...u, index: i }))
      .filter((u) => !u.following);
    if (remaining.length === 0) {
      alert("Already following everyone on the list!");
      return;
    }
    if (!confirm(`Follow ${remaining.length} remaining users?`)) return;

    setBulkRunning(true);
    setProgress({ current: 0, total: remaining.length });

    for (let i = 0; i < remaining.length; i++) {
      const { index, username } = remaining[i];
      setUsers((prev) =>
        prev.map((u, j) => (j === index ? { ...u, loading: true, error: false } : u))
      );
      try {
        const ok = await followUser(username, token);
        setUsers((prev) =>
          prev.map((u, j) =>
            j === index ? { ...u, loading: false, following: ok, error: !ok } : u
          )
        );
        if (!ok) {
          alert("Rate limited by GitHub. Try again in a minute.");
          break;
        }
      } catch {
        setUsers((prev) =>
          prev.map((u, j) => (j === index ? { ...u, loading: false, error: true } : u))
        );
        break;
      }
      setProgress({ current: i + 1, total: remaining.length });
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    setBulkRunning(false);
  }, [token, users]);

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    return users
      .map((u, i) => ({ ...u, index: i }))
      .filter((u) => (!q ? true : u.username.toLowerCase().includes(q)));
  }, [users, filter]);

  const followingCount = users.filter((u) => u.following).length;

  if (users.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Paste GitHub usernames (one per line) or upload a CSV file with a{" "}
          <code>username</code> column.
        </p>
        <FileImport
          onImport={handleImport}
          placeholder={"username1\nusername2\nor upload following.csv…"}
          accept=".txt,.csv"
          label="Import Users"
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
            placeholder="Filter users…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {followingCount} / {users.length} following
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
            onClick={followAllRemaining}
            disabled={checking || bulkRunning}
          >
            {bulkRunning ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <UserPlus className="h-3.5 w-3.5 mr-1" />
            )}
            Follow All Remaining
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setUsers([]);
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
        {filtered.map((user) => (
          <div
            key={user.username}
            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50"
          >
            <span className="text-muted-foreground text-xs min-w-[2rem] text-right">
              {user.index + 1}
            </span>
            <a
              href={`https://github.com/${user.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-primary hover:underline truncate"
            >
              @{user.username}
            </a>
            <Button
              size="sm"
              variant={user.following ? "secondary" : "outline"}
              className={`min-w-[110px] text-xs ${user.error ? "border-destructive text-destructive" : ""}`}
              disabled={user.loading || bulkRunning}
              onClick={() => toggleFollow(user.index)}
            >
              {user.loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : user.error ? (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Error
                </>
              ) : user.following ? (
                <>
                  <Users className="h-3 w-3 mr-1" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="h-3 w-3 mr-1" />
                  Follow
                </>
              )}
            </Button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && users.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          No users match the filter.
        </p>
      )}
    </div>
  );
}
