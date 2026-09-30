import Link from "next/link";

export default function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20">
      <div className="glow relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-600/20 to-accent-500/10 px-8 py-16 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Ready to grow your audience?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/60">
          Join thousands of creators and businesses already growing faster
          with Surgeon. Get started in less than 2 minutes.
        </p>
        <Link
          href="/signup"
          className="mt-8 inline-block rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:opacity-90"
        >
          Start Growing Now
        </Link>
      </div>
    </section>
  );
}
