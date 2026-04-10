"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Star, Users } from "lucide-react";
import StarManager from "./StarManager";
import FollowManager from "./FollowManager";

interface MigrateTabProps {
  token: string;
}

export default function MigrateTab({ token }: MigrateTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">
          Import your starred repos and following list from another account, then
          star and follow them on your current account.
        </p>
      </div>

      <Tabs defaultValue="stars" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stars" className="gap-1.5">
            <Star className="h-4 w-4" />
            Star Repos
          </TabsTrigger>
          <TabsTrigger value="follow" className="gap-1.5">
            <Users className="h-4 w-4" />
            Follow Users
          </TabsTrigger>
        </TabsList>

        <Separator />

        <TabsContent value="stars">
          <StarManager token={token} />
        </TabsContent>

        <TabsContent value="follow">
          <FollowManager token={token} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
