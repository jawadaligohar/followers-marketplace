"use client";

import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";

export default function GoogleButton({ callbackUrl }: { callbackUrl?: string }) {
  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl: callbackUrl ?? "/dashboard" })}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
    >
      <FcGoogle className="h-4 w-4" />
      Continue with Google
    </button>
  );
}
