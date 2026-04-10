"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

interface UserSearchProps {
  onSearch: (username: string) => void;
  loading: boolean;
}

export default function UserSearch({ onSearch, loading }: UserSearchProps) {
  const [username, setUsername] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (trimmed) onSearch(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Enter GitHub username…"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="pl-9"
        />
      </div>
      <Button type="submit" disabled={!username.trim() || loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Explore"}
      </Button>
    </form>
  );
}
