import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PLATFORMS, type PlatformId } from "@/lib/catalog";
export default async function FreeLikesPage({
  params,
}: {
  params: Promise<{ platform: string }>;
}) {
  const { platform } = await params;
  if (!Object.hasOwn(PLATFORMS, platform)) notFound();
  const label = PLATFORMS[platform as PlatformId].label;
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-20">
        <span className="text-sm font-semibold text-brand-600">
          Free with a paid order
        </span>
        <h1 className="mt-3 text-4xl font-bold">50 free {label} likes</h1>
        <p className="mt-6 text-lg text-muted-foreground">
          When the first item in your paid checkout is a {label} service, you
          can claim 50 likes for one public post on {label}. The bonus costs $0
          and is separate from your purchased package. It requires a paid
          purchase.
        </p>
        <ol className="mt-8 list-decimal space-y-3 pl-5 text-sm">
          <li>Choose any {label} package and complete payment.</li>
          <li>
            Use the private bonus link shown at checkout or sent with your order
            email.
          </li>
          <li>
            Paste one public post URL. The full 50 likes go to that post; each
            checkout can be claimed once.
          </li>
        </ol>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href={`/services#${platform}`}
            className="font-semibold text-brand-600 hover:underline"
          >
            Browse {label} packages &rarr;
          </Link>
          <Link
            href="/track-order"
            className="font-semibold text-brand-600 hover:underline"
          >
            Track an order
          </Link>
          <Link
            href="/rewards"
            className="font-semibold text-brand-600 hover:underline"
          >
            My bonuses
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
