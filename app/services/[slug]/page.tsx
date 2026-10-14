import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Check, Link2, MousePointerClick, Rocket } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PlatformIcon from "@/components/shared/PlatformIcon";
import ServiceOrderPanel from "@/components/service/ServiceOrderPanel";
import { getCatalogService, serviceTitle } from "@/lib/catalog";
import { centsToUsd } from "@/lib/pricing";
import { getActiveService, getActiveServices } from "@/lib/serviceQueries";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const copy = getCatalogService(slug);
  if (!copy) return { title: "Service | Surgeon" };
  const title = serviceTitle(copy.platformId, copy.category);
  return { title: `Buy ${title} | Surgeon`, description: copy.description };
}

const TICKS = ["No password required", "Fast, natural-paced delivery", "30-day refill guarantee", "24/7 support"];

export default async function ServicePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const qtyParam = (await searchParams).qty;
  const service = await getActiveService(slug);
  if (!service) notFound();

  const copy = getCatalogService(slug);
  const title = serviceTitle(service.platformId, service.category);
  const fromCents = Math.min(...service.tiers.map((t) => t.priceCents));
  const related = (await getActiveServices()).filter(
    (s) => s.platformId === service.platformId && s.slug !== service.slug
  );
  const initialQty = typeof qtyParam === "string" ? Number(qtyParam) || undefined : undefined;

  const steps = [
    { icon: MousePointerClick, title: "Pick a package", text: "Choose the quantity that fits your goal." },
    {
      icon: Link2,
      title: service.kind === "auto" ? "Add your profile" : "Paste your link",
      text: "Public link only. We never ask for your password.",
    },
    {
      icon: Rocket,
      title: "Watch it arrive",
      text:
        service.kind === "auto"
          ? "Every new post is picked up automatically for 30 days."
          : "Delivery starts within minutes of payment.",
    },
  ];

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="glow absolute inset-x-0 top-0 h-[480px] opacity-40" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-6 pb-16 pt-10 lg:grid-cols-[1fr_minmax(0,480px)] lg:pt-16">
            <div>
              <Link
                href={`/services#${service.platformId}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
              >
                <PlatformIcon platformId={service.platformId} className="h-3.5 w-3.5" />
                {service.platformLabel} services
              </Link>
              <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">
                Buy <span className="text-gradient">{title}</span>
              </h1>
              <p className="mt-4 max-w-xl text-lg text-muted-foreground">
                {copy?.description ?? `Grow your ${service.platformLabel} presence with ${service.category.toLowerCase()}.`}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                From <span className="font-semibold text-foreground">${centsToUsd(fromCents)}</span>
                {service.kind === "auto" && " for a 30-day plan"} &middot; pay by card, crypto, or wallet (5% off)
              </p>

              <ul className="mt-6 grid max-w-md gap-2.5 sm:grid-cols-2">
                {TICKS.map((t) => (
                  <li key={t} className="flex items-center gap-2 text-sm text-foreground/80">
                    <Check className="h-4 w-4 shrink-0 text-brand-500" />
                    {t}
                  </li>
                ))}
              </ul>

              <ol className="mt-10 grid gap-4 sm:grid-cols-3">
                {steps.map((step, i) => (
                  <li key={step.title} className="rounded-2xl border border-border bg-card/60 p-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
                      <step.icon className="h-4 w-4" />
                    </span>
                    <div className="mt-3 text-sm font-semibold">
                      {i + 1}. {step.title}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{step.text}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div id="buy" className="lg:sticky lg:top-28 lg:self-start">
              <ServiceOrderPanel key={`${service.slug}-${initialQty ?? "default"}`} service={service} initialQty={initialQty} />
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section className="border-t border-border bg-muted/40 py-16">
            <div className="mx-auto max-w-7xl px-6">
              <h2 className="text-2xl font-bold tracking-tight">More {service.platformLabel} services</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/services/${s.slug}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3.5 transition hover:border-brand-500/40 hover:shadow-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <PlatformIcon platformId={s.platformId} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{s.category}</span>
                        <span className="block text-xs text-muted-foreground">
                          from ${centsToUsd(Math.min(...s.tiers.map((t) => t.priceCents)))}
                        </span>
                      </span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition group-hover:text-brand-500" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
