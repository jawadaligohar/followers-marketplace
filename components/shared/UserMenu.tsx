"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function UserMenu({ name, email }: { name?: string | null; email?: string | null }) {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <div className="text-sm font-medium">{name ?? "Account"}</div>
        <div className="text-xs text-white/40">{email}</div>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
