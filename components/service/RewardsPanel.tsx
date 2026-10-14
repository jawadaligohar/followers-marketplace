"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
type Summary = {
  availableCents: number;
  earnedCents: number;
  redeemedCents: number;
  month: string;
  entries: number;
  qualifyingCents: number;
  entryThresholdCents: number;
  emailVerified: boolean;
  prizes: { id: string; month: string; amountCents: number }[];
  bonuses: {
    orderId: string;
    platformId: string;
    platformLabel: string;
    claimed: boolean;
  }[];
};
export default function RewardsPanel() {
  const { status, update } = useSession();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    const response = await fetch("/api/rewards");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    setSummary(data);
  }
  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/rewards")
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error);
          setSummary(data);
        })
        .catch((e) => setMessage(e.message));
    }
  }, [status]);
  async function verifyEmail() {
    setBusy(true);
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessage(
        data.verified
          ? "Your email is verified."
          : data.sent
            ? "Check your email for the verification link."
            : "Your verification email is queued. Contact support if it does not arrive.",
      );
      await load();
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Could not request verification",
      );
    } finally {
      setBusy(false);
    }
  }
  async function redeem() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/rewards", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessage(
        `$${(data.creditedCents / 100).toFixed(2)} added to your wallet`,
      );
      await Promise.all([load(), update()]);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not redeem rewards");
    } finally {
      setBusy(false);
    }
  }
  if (status !== "authenticated")
    return (
      <p className="mt-8 text-sm">
        <Link
          href="/login?callbackUrl=/rewards"
          className="font-semibold text-brand-600 hover:underline"
        >
          Sign in
        </Link>{" "}
        to view loyalty credit, draw entries, and order bonuses. Guest orders
        include a private bonus link at checkout.
      </p>
    );
  return (
    <div className="mt-8 space-y-6">
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      {summary && !summary.emailVerified && (
        <Button
          type="button"
          variant="outline"
          onClick={verifyEmail}
          disabled={busy}
        >
          Verify email for guest prizes
        </Button>
      )}
      {summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <p className="text-sm text-muted-foreground">
                Available loyalty credit
              </p>
              <p className="mt-2 text-3xl font-bold">
                ${(summary.availableCents / 100).toFixed(2)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                1% of paid package spend, adjusted for refunds and previous
                redemptions.
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-muted-foreground">
                Entries for {summary.month}
              </p>
              <p className="mt-2 text-3xl font-bold">{summary.entries}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                ${(summary.qualifyingCents / 100).toFixed(2)} qualifying. One
                entry per ${(summary.entryThresholdCents / 100).toFixed(2)}.
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-muted-foreground">
                Unclaimed draw prizes
              </p>
              <p className="mt-2 text-3xl font-bold">
                $
                {(
                  summary.prizes.reduce((sum, p) => sum + p.amountCents, 0) /
                  100
                ).toFixed(2)}
              </p>
              <Button
                className="mt-3"
                disabled={
                  busy || (!summary.availableCents && !summary.prizes.length)
                }
                onClick={redeem}
              >
                Redeem into wallet
              </Button>
            </Card>
          </div>
          <h2 className="text-xl font-semibold">Your 50-like bonuses</h2>
          {!summary.bonuses.length && (
            <p className="text-sm text-muted-foreground">
              Bonuses appear after a paid order is confirmed.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {summary.bonuses.map((bonus) => (
              <Card key={bonus.orderId} className="p-4">
                <p className="font-semibold">50 {bonus.platformLabel} likes</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {bonus.claimed
                    ? "Already claimed"
                    : "Available for one public post"}
                </p>
                {!bonus.claimed && (
                  <Link
                    className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline"
                    href={`/track-order?orderId=${bonus.orderId}`}
                  >
                    View order and claim &rarr;
                  </Link>
                )}
              </Card>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Loading rewards…</p>
      )}
    </div>
  );
}
