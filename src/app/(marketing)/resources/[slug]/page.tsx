import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Check, Download, FileText } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResourceCard, RESOURCE_KIND_LABELS } from "@/components/marketing/resource-card";
import { SectionHeading } from "@/components/marketing/section-heading";
import { formatBDT } from "@/lib/format";

async function getResource(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("resources")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getResource(slug);
  if (!resource) return { title: "Resource not found" };
  return {
    title: resource.title,
    description: resource.description ?? undefined,
  };
}

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const resource = await getResource(slug);
  if (!resource) notFound();

  const { data: related } = await supabase
    .from("resources")
    .select("*")
    .eq("kind", resource.kind)
    .neq("id", resource.id)
    .limit(4);

  const isFree = !resource.price_bdt || resource.price_bdt <= 0;
  const buyHref = `/checkout?type=resource&id=${resource.id}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.4fr]">
        {/* Cover */}
        <div>
          <div className="flex aspect-[3/4] items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-primary/15 via-secondary to-brand-hover/15 shadow-card">
            {resource.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resource.cover_url}
                alt={resource.title}
                className="size-full rounded-2xl object-cover"
              />
            ) : (
              <BookOpen className="size-12 text-primary/40" />
            )}
          </div>
        </div>

        {/* Details */}
        <div>
          <Badge variant="secondary">
            {RESOURCE_KIND_LABELS[resource.kind] ?? "Resource"}
          </Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            {resource.title}
          </h1>
          {resource.author ? (
            <p className="mt-2 text-muted-foreground">by {resource.author}</p>
          ) : null}

          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            {resource.pages ? (
              <span className="inline-flex items-center gap-1">
                <FileText className="size-4" />
                {resource.pages} pages
              </span>
            ) : null}
          </div>

          {resource.description ? (
            <p className="mt-5 whitespace-pre-line leading-relaxed text-muted-foreground">
              {resource.description}
            </p>
          ) : null}

          <div className="mt-8 flex items-center gap-4">
            <span className="text-3xl font-semibold text-foreground">
              {formatBDT(resource.price_bdt)}
            </span>
          </div>

          <div className="mt-5">
            {isFree ? (
              resource.external_url ? (
                <Button asChild size="lg" className="rounded-full">
                  <a
                    href={resource.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="size-4" />
                    Download for free
                  </a>
                </Button>
              ) : (
                <Button asChild size="lg" className="rounded-full">
                  <Link href={buyHref}>
                    <Download className="size-4" />
                    Get for free
                  </Link>
                </Button>
              )
            ) : (
              <Button asChild size="lg" className="rounded-full">
                <Link href={buyHref}>Buy now</Link>
              </Button>
            )}
          </div>

          <ul className="mt-8 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="size-4 text-success" />
              Instant access after purchase is approved
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-4 text-success" />
              Downloadable from your dashboard
            </li>
          </ul>
        </div>
      </div>

      {related && related.length > 0 ? (
        <section className="mt-16">
          <SectionHeading title="Related resources" />
          <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
