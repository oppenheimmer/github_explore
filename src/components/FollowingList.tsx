"use client";

import { useState, useMemo } from "react";
import { FollowingUser } from "@/types/github";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Search } from "lucide-react";
import ExportButtons from "./ExportButtons";

interface FollowingListProps {
  users: FollowingUser[];
  loading: boolean;
  username: string;
  progress: number;
}

export default function FollowingList({
  users,
  loading,
  username,
  progress,
}: FollowingListProps) {
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.login.toLowerCase().includes(q) ||
        u.type.toLowerCase().includes(q)
    );
  }, [users, filter]);

  const exportData = filtered.map((u) => ({
    username: u.login,
    profile_url: u.html_url,
    type: u.type,
    avatar_url: u.avatar_url,
  }));

  if (loading) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Loading following… {progress > 0 && `(${progress} loaded)`}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Users className="h-10 w-10 mb-3 opacity-30" />
        <p>Not following anyone.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter following…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {filtered.length} of {users.length} accounts
          </span>
          <ExportButtons
            data={exportData as unknown as Record<string, unknown>[]}
            filenamePrefix={`${username}-following`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.map((user) => (
          <a
            key={user.id}
            href={user.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <Card className="transition-colors group-hover:border-primary/40">
              <CardContent className="flex flex-col items-center gap-2 py-4 px-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar_url} alt={user.login} />
                  <AvatarFallback>
                    {user.login.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium truncate w-full text-center group-hover:underline">
                  {user.login}
                </span>
                <Badge
                  variant={user.type === "Organization" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {user.type}
                </Badge>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
