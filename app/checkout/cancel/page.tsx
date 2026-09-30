import Link from "next/link";
import { XCircle } from "lucide-react";

export const metadata = { title: "Payment cancelled | Surgeon" };

export default function CheckoutCancelPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-grid px-6">
      <div className="glow absolute inset-x-0 top-0 h-[500px]" />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-2xl shadow-black/40">
        <XCircle className="mx-auto h-12 w-12 text-white/40" />
        <h1 className="mt-4 text-xl font-bold">Payment cancelled</h1>
        <p className="mt-2 text-sm text-white/50">
          No charge was made. You can try again anytime.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
