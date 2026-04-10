"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, KeyRound } from "lucide-react";

interface TokenInputProps {
  token: string;
  onTokenChange: (token: string) => void;
}

export default function TokenInput({ token, onTokenChange }: TokenInputProps) {
  const [visible, setVisible] = useState(false);
  const [localToken, setLocalToken] = useState(token);

  useEffect(() => {
    setLocalToken(token);
  }, [token]);

  const persist = (value: string) => {
    const trimmed = value.trim();
    onTokenChange(trimmed);
    if (trimmed) {
      localStorage.setItem("gh_token", trimmed);
    } else {
      localStorage.removeItem("gh_token");
    }
  };

  const handleChange = (value: string) => {
    setLocalToken(value);
    persist(value);
  };

  const handleClear = () => {
    setLocalToken("");
    persist("");
  };

  return (
    <div className="flex items-center gap-2">
      <KeyRound className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="relative flex-1 max-w-md">
        <Input
          type={visible ? "text" : "password"}
          placeholder="GitHub Personal Access Token"
          value={localToken}
          onChange={(e) => handleChange(e.target.value)}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {token && (
        <Button size="sm" variant="outline" onClick={handleClear}>
          Clear
        </Button>
      )}
    </div>
  );
}
