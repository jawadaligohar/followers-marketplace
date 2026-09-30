import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-grid px-6 py-16">
      <div className="glow absolute inset-x-0 top-0 h-[500px]" />
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500">
            <Sparkles className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-bold tracking-tight">Surgeon</span>
        </Link>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-white/50">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
