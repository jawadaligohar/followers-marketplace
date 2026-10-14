import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PlatformIcon from "@/components/shared/PlatformIcon";
import { getCatalogService, PLATFORM_ORDER, PLATFORMS } from "@/lib/catalog";
import { centsToUsd } from "@/lib/pricing";
import { getActiveServices } from "@/lib/serviceQueries";

export const metadata = {
  title: "All Services | Surgeon",
  description: "Followers, likes, views, comments and auto engagement for Instagram, TikTok, Facebook and X (Twitter).",
};

export default async function ServicesPage() {
  const services = await getActiveServices();

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-6 pb-8 pt-14 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">All services</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {services.length} services across Instagram, TikTok, Facebook and X. No password needed, delivery starts
            within minutes.
          </p>
          <nav className="mx-auto mt-6 flex w-fit flex-wrap justify-center gap-2">
            {PLATFORM_ORDER.map((p) => (
              <a
                key={p}
                href={`#${p}`}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                <PlatformIcon platformId={p} />
                {PLATFORMS[p].label}
              </a>
            ))}
          </nav>
        </section>

        {PLATFORM_ORDER.map((platformId) => {
          const list = services.filter((s) => s.platformId === platformId);
          if (list.length === 0) return null;
          return (
            <section key={platformId} id={platformId} className="mx-auto max-w-7xl scroll-mt-28 px-6 py-10">
              <h2 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
                <PlatformIcon platformId={platformId} className="h-6 w-6" />
                {PLATFORMS[platformId].label}
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((s) => {
                  const copy = getCatalogService(s.slug);
                  return (
                    <Link
                      key={s.slug}
                      href={`/services/${s.slug}`}
                      className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">
                            {s.platformLabel} {s.category}
                          </div>
                          {copy && <div className="text-xs text-muted-foreground">{copy.tagline}</div>}
                        </div>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition group-hover:text-brand-500" />
                      </div>
                      {copy && <p className="mt-3 flex-1 text-sm text-muted-foreground">{copy.description}</p>}
                      <div className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
                        From{" "}
                        <span className="font-semibold text-foreground">
                          ${centsToUsd(Math.min(...s.tiers.map((t) => t.priceCents)))}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>
      <Footer />
    </>
  );
}
