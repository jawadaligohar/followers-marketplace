"use client";

import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";

export default function GoogleButton({ callbackUrl }: { callbackUrl?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => signIn("google", { callbackUrl: callbackUrl ?? "/dashboard" })}
      className="flex w-full items-center justify-center gap-2 py-5"
    >
      <FcGoogle className="h-4 w-4" />
      Continue with Google
    </Button>
  );
}
