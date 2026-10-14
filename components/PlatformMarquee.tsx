import Link from "next/link";
import { PLATFORM_ORDER, PLATFORMS } from "@/lib/catalog";
import PlatformIcon from "@/components/shared/PlatformIcon";
const LOGOS = PLATFORM_ORDER.map(platform => ({ platform, name: PLATFORMS[platform].label }));

export default function PlatformMarquee() {
  const items = [...LOGOS, ...LOGOS];
  return (
    <div className="border-y border-border bg-muted/40 py-6">
      <div
        className="mx-auto max-w-7xl overflow-hidden px-6"
        style={{
          maskImage:
            "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
        }}
      >
        <div className="flex w-max animate-marquee gap-12">
          {items.map((item, i) => (
            <Link
              href={`/services#${item.platform}`}
              key={`${item.name}-${i}`}
              className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold uppercase tracking-widest text-muted-foreground/50 transition-colors hover:text-foreground"
            >
              <PlatformIcon platformId={item.platform} colored={false} />
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
