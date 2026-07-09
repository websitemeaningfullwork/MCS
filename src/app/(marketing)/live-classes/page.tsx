import type { Metadata } from "next";
import { CalendarDays, Radio, Video } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/marketing/empty-state";
import type { Tables } from "@/types/database.types";

export const metadata: Metadata = {
  title: "Live Classes",
  description: "Join live mentor-led sessions or watch recorded classes.",
};

function ClassCard({
  lc,
  recorded,
}: {
  lc: Tables<"live_classes">;
  recorded: boolean;
}) {
  const url = recorded ? lc.replay_url : lc.meeting_url;
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="inline-flex items-center gap-2 text-sm text-primary">
        {recorded ? <Video className="size-4" /> : <CalendarDays className="size-4" />}
        {new Date(lc.starts_at).toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
      </div>
      <h3 className="mt-3 font-semibold text-foreground">{lc.title}</h3>
      {lc.description ? (
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {lc.description}
        </p>
      ) : null}
      <div className="mt-auto pt-4">
        {url ? (
          <Button asChild size="sm" className="rounded-full">
            <a href={url} target="_blank" rel="noopener noreferrer">
              {recorded ? "Watch replay" : "Join class"}
            </a>
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">Link coming soon</span>
        )}
      </div>
    </div>
  );
}

export default async function LiveClassesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("live_classes")
    .select("*")
    .eq("is_public", true)
    .order("starts_at", { ascending: false });

  const all = data ?? [];
  const now = Date.now();
  const upcoming = all
    .filter((lc) => new Date(lc.starts_at).getTime() >= now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const recorded = all.filter((lc) => Boolean(lc.replay_url));

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <header className="max-w-2xl">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
          <Radio className="size-4" />
          Live sessions
        </span>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Live classes
        </h1>
        <p className="mt-3 text-muted-foreground">
          Learn in real time with your mentors, then catch up on replays.
        </p>
      </header>

      <Tabs defaultValue="upcoming" className="mt-8">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="recorded">Recorded</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {upcoming.length === 0 ? (
            <EmptyState
              title="No upcoming classes"
              description="New live sessions will be scheduled soon."
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((lc) => (
                <ClassCard key={lc.id} lc={lc} recorded={false} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recorded" className="mt-6">
          {recorded.length === 0 ? (
            <EmptyState
              title="No recordings yet"
              description="Replays of past classes will appear here."
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recorded.map((lc) => (
                <ClassCard key={lc.id} lc={lc} recorded />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
