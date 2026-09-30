"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Something went wrong");
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  if (!token) {
    return (
      <p className="text-sm text-muted-foreground">
        This reset link is missing its token.{" "}
        <Link href="/forgot-password" className="text-accent-500 hover:underline">
          Request a new one
        </Link>
        .
      </p>
    );
  }

  if (done) {
    return <p className="text-sm text-muted-foreground">Password updated. Redirecting to sign in…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="new-password" className="text-xs text-muted-foreground">
          New password
        </Label>
        <Input
          id="new-password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />
      </div>

      <Button
        type="submit"
        variant="brand"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 py-5"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Reset password
      </Button>
    </form>
  );
}
