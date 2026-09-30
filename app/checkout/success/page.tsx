import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata = { title: "Payment successful | Surgeon" };

export default function CheckoutSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-grid px-6">
      <div className="glow absolute inset-x-0 top-0 h-[500px]" />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-2xl shadow-black/40">
        <CheckCircle2 className="mx-auto h-12 w-12 text-accent-500" />
        <h1 className="mt-4 text-xl font-bold">Payment successful</h1>
        <p className="mt-2 text-sm text-white/50">
          Your payment is being processed. It may take a few seconds to reflect in your
          dashboard.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:opacity-90"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
