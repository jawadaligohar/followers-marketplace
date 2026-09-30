"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, UserPlus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function GuestAccountPrompt({ email }: { email: string }) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      toast.error(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (result?.error) {
      toast.success("Account created — sign in to view your order");
      router.push("/login");
      return;
    }

    toast.success("Account created — your order is now linked to it");
    router.push("/dashboard/orders");
    router.refresh();
  }

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <UserPlus className="h-4 w-4 text-accent-500" />
            Save this order to an account
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Optional — create a password for {email} to track this order, reorder faster, and unlock 15% off with wallet payments.
          </p>

          <form onSubmit={handleCreate} className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="guest-name" className="text-xs text-muted-foreground">
                Name
              </Label>
              <Input
                id="guest-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guest-password" className="text-xs text-muted-foreground">
                Create a password
              </Label>
              <Input
                id="guest-password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                type="submit"
                variant="brand"
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Create account
              </Button>
              <Button type="button" variant="outline" onClick={() => setDismissed(true)}>
                Skip
              </Button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
