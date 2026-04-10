"use client";

import { GitHubUser } from "@/types/github";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Building2,
  Link as LinkIcon,
  Users,
  GitFork,
  Star,
} from "lucide-react";

interface ProfileCardProps {
  user: GitHubUser;
}

export default function ProfileCard({ user }: ProfileCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-6">
        <Avatar className="h-20 w-20 shrink-0">
          <AvatarImage src={user.avatar_url} alt={user.login} />
          <AvatarFallback>{user.login.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-2">
            <a
              href={user.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xl font-semibold hover:underline"
            >
              {user.name || user.login}
            </a>
            <span className="text-muted-foreground text-sm">@{user.login}</span>
            <Badge variant="secondary" className="text-xs">
              {user.type}
            </Badge>
          </div>

          {user.bio && (
            <p className="text-sm text-muted-foreground">{user.bio}</p>
          )}

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {user.company && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" /> {user.company}
              </span>
            )}
            {user.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {user.location}
              </span>
            )}
            {user.blog && (
              <a
                href={user.blog.startsWith("http") ? user.blog : `https://${user.blog}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline"
              >
                <LinkIcon className="h-3.5 w-3.5" /> {user.blog}
              </a>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm pt-1">
            <span className="flex items-center gap-1">
              <GitFork className="h-3.5 w-3.5" />
              <strong>{user.public_repos}</strong> repos
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <strong>{user.followers}</strong> followers
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5" />
              <strong>{user.following}</strong> following
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
