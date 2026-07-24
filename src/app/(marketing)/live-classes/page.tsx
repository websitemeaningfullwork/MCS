import type { Metadata } from "next";
import { CalendarDays, Radio, Video } from "lucide-react";

import { createPublicClient } from "@/lib/supabase/public";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/marketing/empty-state";
import { T } from "@/components/shared/t";
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
              {recorded ? (
                <T en="Watch replay" bn="রিপ্লে দেখুন" />
              ) : (
                <T en="Join class" bn="ক্লাসে যোগ দিন" />
              )}
            </a>
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">
            <T en="Link coming soon" bn="লিংক শিগগিরই আসছে" />
          </span>
        )}
      </div>
    </div>
  );
}

/** Split classes into upcoming/recorded. Kept out of the component so the
 *  `Date.now()` read is not treated as an impure call during render. */
function partitionClasses(all: Tables<"live_classes">[]) {
  const now = Date.now();
  const upcoming = all
    .filter((lc) => new Date(lc.starts_at).getTime() >= now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const recorded = all.filter((lc) => Boolean(lc.replay_url));
  return { upcoming, recorded };
}

// Public schedule — identical for every visitor, so it reads through the
// cookieless public client and is prerendered + revalidated rather than
// server-rendered on every request. The upcoming/recorded split is computed
// from `Date.now()` at render time, so with a 5-minute window a class can
// linger in "Upcoming" for at most that long after it starts — an acceptable
// trade for CDN-served page loads.
export const revalidate = 300;

export default async function LiveClassesPage() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("live_classes")
    .select("*")
    .eq("is_public", true)
    .order("starts_at", { ascending: false });

  const { upcoming, recorded } = partitionClasses(data ?? []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <header className="max-w-2xl">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
          <Radio className="size-4" />
          <T en="Live sessions" bn="লাইভ সেশন" />
        </span>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          <T en="Live classes" bn="লাইভ ক্লাস" />
        </h1>
        <p className="mt-3 text-muted-foreground">
          <T
            en="Learn in real time with your mentors, then catch up on replays."
            bn="মেন্টরদের সাথে রিয়েল-টাইমে শিখুন, মিস হলে রিপ্লে দেখে নিন।"
          />
        </p>
      </header>

      <Tabs defaultValue="upcoming" className="mt-8">
        <TabsList>
          <TabsTrigger value="upcoming">
            <T en="Upcoming" bn="আসন্ন" />
          </TabsTrigger>
          <TabsTrigger value="recorded">
            <T en="Recorded" bn="রেকর্ডেড" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {upcoming.length === 0 ? (
            <EmptyState
              title={<T en="No upcoming classes" bn="কোনো আসন্ন ক্লাস নেই" />}
              description={
                <T
                  en="New live sessions will be scheduled soon."
                  bn="নতুন লাইভ সেশন শিগগিরই শিডিউল করা হবে।"
                />
              }
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
              title={<T en="No recordings yet" bn="এখনও কোনো রেকর্ডিং নেই" />}
              description={
                <T
                  en="Replays of past classes will appear here."
                  bn="আগের ক্লাসগুলোর রিপ্লে এখানে পাওয়া যাবে।"
                />
              }
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
