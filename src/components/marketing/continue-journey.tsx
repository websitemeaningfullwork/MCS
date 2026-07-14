"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookMarked, PlayCircle, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";
import { Reveal } from "@/components/marketing/reveal";

type ContinueItem = {
  programId: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  progress: number;
};

/**
 * Auth-aware "Continue Your Journey" island. The homepage is statically
 * rendered, so this reads the signed-in user's enrollments client-side (RLS
 * scopes rows to the user). With no purchased/enrolled course it renders a
 * friendly empty state; otherwise it shows live progress cards.
 */
export function ContinueJourney() {
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [items, setItems] = useState<ContinueItem[]>([]);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;

      if (!user) {
        setAuthed(false);
        setStatus("ready");
        return;
      }
      setAuthed(true);

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("program_id, progress, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      const programIds = (enrollments ?? [])
        .map((e) => e.program_id)
        .filter((id): id is string => Boolean(id));

      if (programIds.length === 0) {
        if (active) setStatus("ready");
        return;
      }

      const { data: programs } = await supabase
        .from("programs")
        .select("id, title, slug, cover_url")
        .in("id", programIds);

      if (!active) return;

      const byId = new Map((programs ?? []).map((p) => [p.id, p]));
      const resolved: ContinueItem[] = (enrollments ?? [])
        .map((e) => {
          const program = e.program_id ? byId.get(e.program_id) : undefined;
          if (!program) return null;
          return {
            programId: program.id,
            title: program.title,
            slug: program.slug,
            coverUrl: program.cover_url,
            progress: Math.max(0, Math.min(100, Number(e.progress ?? 0))),
          };
        })
        .filter((x): x is ContinueItem => x !== null);

      setItems(resolved);
      setStatus("ready");
    }

    load();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      setStatus("loading");
      load();
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Avoid layout shift while we resolve auth: reserve nothing until ready.
  if (status === "loading") {
    return (
      <div className="mt-8 h-40 animate-pulse rounded-3xl border border-border bg-card/60" />
    );
  }

  // Signed-out or no active course → premium empty state.
  if (!authed || items.length === 0) {
    return (
      <Reveal>
        <div className="mt-8 flex flex-col items-center gap-5 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-blue-500/10 via-card to-sky-400/10 p-10 text-center shadow-card">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
            <Sparkles className="size-7" />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Your journey starts here
            </h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              You don&apos;t have an active course yet. Enroll in a program and
              your progress will show up here so you can pick up right where you
              left off.
            </p>
          </div>
          <Button asChild size="lg" className="rounded-full">
            <Link href="/programs">
              Explore Programs
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </Reveal>
    );
  }

  return (
    <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <Reveal key={item.programId} delay={i * 0.05}>
          <div className="card-hover flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card">
            <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-blue-500/15 via-secondary to-sky-400/15">
              {item.coverUrl ? (
                <Image
                  src={item.coverUrl}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <BookMarked className="size-8 text-blue-600/40" />
                </div>
              )}
              <span className="absolute left-3 top-3 rounded-full bg-success px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                {Math.round(item.progress)}% complete
              </span>
            </div>

            <div className="flex flex-1 flex-col p-5">
              <p className="text-xs font-medium text-muted-foreground">
                Continue learning
              </p>
              <h3 className="mt-1 line-clamp-2 font-semibold text-foreground">
                {item.title}
              </h3>

              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-success transition-[width] duration-500"
                  style={{ width: `${Math.max(item.progress, 4)}%` }}
                />
              </div>

              <Button
                asChild
                className="mt-5 w-full rounded-full"
                size="lg"
              >
                <Link href={`/dashboard/learn/${item.slug}`}>
                  <PlayCircle className="size-4" />
                  Continue Lesson
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
