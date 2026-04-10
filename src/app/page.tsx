"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Code2, AlertCircle, Star, Users, Search, ArrowRightLeft } from "lucide-react";
import TokenInput from "@/components/TokenInput";
import UserSearch from "@/components/UserSearch";
import ProfileCard from "@/components/ProfileCard";
import StarredReposTable from "@/components/StarredReposTable";
import FollowingList from "@/components/FollowingList";
import MigrateTab from "@/components/MigrateTab";
import { fetchUser, fetchStarredRepos, fetchFollowing } from "@/lib/github";
import type { GitHubUser, StarredRepo, FollowingUser } from "@/types/github";

export default function Home() {
  const [token, setToken] = useState("");
  const [activeTab, setActiveTab] = useState("explorer");
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [starredRepos, setStarredRepos] = useState<StarredRepo[]>([]);
  const [following, setFollowing] = useState<FollowingUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [starredLoading, setStarredLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [starredProgress, setStarredProgress] = useState(0);
  const [followingProgress, setFollowingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [searchedUsername, setSearchedUsername] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("gh_token");
    if (stored) setToken(stored);
  }, []);

  const handleSearch = useCallback(
    async (username: string) => {
      setError(null);
      setUser(null);
      setStarredRepos([]);
      setFollowing([]);
      setStarredProgress(0);
      setFollowingProgress(0);
      setLoading(true);
      setSearchedUsername(username);

      try {
        console.log("[GH Explorer] Fetching user:", username, "token present:", !!token);
        const userData = await fetchUser(username, token || undefined);
        console.log("[GH Explorer] User fetched:", userData.login);
        setUser(userData);
        setLoading(false);

        setStarredLoading(true);
        setFollowingLoading(true);

        const [starred, followingData] = await Promise.all([
          fetchStarredRepos(username, token || undefined, setStarredProgress),
          fetchFollowing(username, token || undefined, setFollowingProgress),
        ]);

        console.log("[GH Explorer] Starred:", starred.length, "Following:", followingData.length);
        setStarredRepos(starred);
        setFollowing(followingData);
      } catch (err) {
        console.error("[GH Explorer] Error:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      } finally {
        setLoading(false);
        setStarredLoading(false);
        setFollowingLoading(false);
      }
    },
    [token]
  );

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Code2 className="h-6 w-6" />
            <h1 className="text-lg font-semibold tracking-tight">GitHub Explorer</h1>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <TokenInput token={token} onTokenChange={setToken} />
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="explorer" className="gap-1.5">
              <Search className="h-4 w-4" />
              Explorer
            </TabsTrigger>
            <TabsTrigger value="migrate" className="gap-1.5">
              <ArrowRightLeft className="h-4 w-4" />
              Migrate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="explorer" className="space-y-6">
            <UserSearch onSearch={handleSearch} loading={loading} />

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {user && <ProfileCard user={user} />}

            {(user || starredLoading || followingLoading) && (
              <Tabs defaultValue="starred" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="starred" className="gap-1.5">
                    <Star className="h-4 w-4" />
                    Starred Repos
                    {starredRepos.length > 0 && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({starredRepos.length})
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="following" className="gap-1.5">
                    <Users className="h-4 w-4" />
                    Following
                    {following.length > 0 && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({following.length})
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                <Separator />

                <TabsContent value="starred">
                  <StarredReposTable
                    repos={starredRepos}
                    loading={starredLoading}
                    username={searchedUsername}
                    progress={starredProgress}
                  />
                </TabsContent>

                <TabsContent value="following">
                  <FollowingList
                    users={following}
                    loading={followingLoading}
                    username={searchedUsername}
                    progress={followingProgress}
                  />
                </TabsContent>
              </Tabs>
            )}

            {!user && !loading && !error && (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground space-y-3">
                <Code2 className="h-16 w-16 opacity-20" />
                <p className="text-lg">Enter a GitHub username to explore</p>
                <p className="text-sm">
                  View starred repos and following accounts, then export as CSV or JSON.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="migrate">
            <MigrateTab token={token} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
