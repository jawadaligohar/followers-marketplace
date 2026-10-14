"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function VerifyEmail({ token }: { token?: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function verify() {
    setBusy(true);
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      setMessage(
        response.ok && data.verified
          ? "Your email is verified. You can now claim any guest draw prize sent to this address."
          : data.error || "Check your email for a verification link.",
      );
    } catch {
      setMessage("Could not verify your email. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Sign in to the account that requested this email before confirming.
      </p>
      <Button onClick={verify} disabled={busy || !token}>
        Confirm my email
      </Button>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      <Link
        href="/rewards"
        className="block text-sm font-semibold text-brand-600"
      >
        Return to rewards &rarr;
      </Link>
    </div>
  );
}
