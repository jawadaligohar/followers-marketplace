"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
type AdminData = {
  transfers: {
    reference: string;
    email: string;
    amountCents: number;
    kind: string;
  }[];
  draws: {
    month: string;
    winnerEmail: string;
    prizeCents: number;
    totalEntries: number;
  }[];
  emails: { _id: string; to: string; subject: string }[];
  emailConfigured: boolean;
};
export default function BenefitsPanel() {
  const [data, setData] = useState<AdminData | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [month, setMonth] = useState("");
  const [prize, setPrize] = useState("");
  const [refundOrderId, setRefundOrderId] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundMode, setRefundMode] = useState("refundWallet");
  async function load() {
    const response = await fetch("/api/admin/benefits");
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    setData(result);
  }
  useEffect(() => {
    fetch("/api/admin/benefits")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        setData(result);
      })
      .catch((e) => setMessage(e.message));
  }, []);
  async function act(body: Record<string, unknown>, confirmation: string) {
    if (!window.confirm(confirmation)) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/benefits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await load();
      setMessage("Completed");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Operation failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-8">
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      <Card className="p-5">
        <h2 className="text-xl font-semibold">Refunds</h2>
        <p className="mt-2 text-sm text-muted-foreground">Issue wallet credit with the customer&apos;s agreement, or record money you have already returned outside this panel. Recording an external refund does not send money. Automatic card and crypto refunds are recorded by their signed payment notifications.</p>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={event => { event.preventDefault(); void act({ action: refundMode, orderId: refundOrderId, amountCents: Math.round(Number(refundAmount) * 100) }, refundMode === "refundWallet" ? "Has the customer agreed to this wallet-credit refund? Confirming credits the account and reduces reward eligibility." : "Have you already returned this total amount externally? This records the cumulative amount returned; it does not transfer funds."); }}>
          <div><Label htmlFor="refund-order">Full order ID</Label><Input id="refund-order" required value={refundOrderId} onChange={event => setRefundOrderId(event.target.value)} /></div>
          <div><Label htmlFor="refund-amount">Amount in USD</Label><Input id="refund-amount" type="number" min="0.01" step="0.01" required value={refundAmount} onChange={event => setRefundAmount(event.target.value)} /></div>
          <select aria-label="Refund method" value={refundMode} onChange={event => setRefundMode(event.target.value)} className="rounded-lg border border-input bg-background p-2 text-sm"><option value="refundWallet">Refund amount into wallet</option><option value="recordRefund">Record total already returned externally</option></select>
          <Button type="submit" disabled={busy}>Confirm refund record</Button>
        </form>
      </Card>
      <section>
        <h2 className="mb-4 text-xl font-semibold">Pending bank deposits</h2>
        {data?.transfers.length === 0 && (
          <p className="text-sm text-muted-foreground">No pending transfers.</p>
        )}
        <div className="space-y-3">
          {data?.transfers.map((transfer) => (
            <Card key={transfer.reference} className="p-4">
              <p className="font-semibold">
                ${(transfer.amountCents / 100).toFixed(2)} ·{" "}
                {transfer.kind === "topup" ? "Wallet top-up" : "Order payment"}
              </p>
              <p className="mt-1 text-sm">{transfer.email}</p>
              <p className="mt-1 break-all text-xs text-muted-foreground">
                {transfer.reference}
              </p>
              <Button
                className="mt-3"
                disabled={busy}
                onClick={() =>
                  act(
                    { action: "confirmBank", reference: transfer.reference },
                    "Have you verified that this exact amount and reference arrived in the bank account? Confirmation releases the order or credits the wallet.",
                  )
                }
              >
                Confirm funds received
              </Button>
            </Card>
          ))}
        </div>
      </section>
      <Card className="p-5">
        <h2 className="text-xl font-semibold">Monthly draw</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Select a completed UTC month and a fixed USD wallet-credit prize. Each
          entry has equal weight. A month can be drawn once. Leave the prize
          blank until it has been decided.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void act(
              {
                action: "draw",
                month,
                prizeCents: Math.round(Number(prize) * 100),
              },
              `Draw one winner for ${month} with a $${Number(prize).toFixed(2)} wallet-credit prize? This result is permanent.`,
            );
          }}
          className="mt-4 grid gap-3 sm:grid-cols-3"
        >
          <div>
            <Label htmlFor="draw-month">Month</Label>
            <Input
              id="draw-month"
              type="month"
              required
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="draw-prize">Prize in USD</Label>
            <Input
              id="draw-prize"
              type="number"
              min="0.01"
              max="10000"
              step="0.01"
              required
              value={prize}
              onChange={(e) => setPrize(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={busy} className="self-end">
            Run monthly draw
          </Button>
        </form>
        <div className="mt-5 space-y-2">
          {data?.draws.map((draw) => (
            <p key={draw.month} className="text-sm">
              {draw.month} · {draw.winnerEmail} · $
              {(draw.prizeCents / 100).toFixed(2)} · {draw.totalEntries} total
              entries
            </p>
          ))}
        </div>
      </Card>
      <section>
        <h2 className="text-xl font-semibold">
          Pending order and reward emails
        </h2>
        {data && !data.emailConfigured && (
          <p className="mt-2 text-sm text-muted-foreground">
            Set RESEND_API_KEY and EMAIL_FROM to deliver these messages. Private
            bonus links remain available at checkout.
          </p>
        )}
        <div className="mt-4 space-y-3">
          {data?.emails.map((email) => (
            <Card
              key={email._id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <p className="text-sm font-semibold">{email.subject}</p>
                <p className="text-xs text-muted-foreground">{email.to}</p>
              </div>
              <Button
                disabled={busy || !data.emailConfigured}
                onClick={() =>
                  act(
                    { action: "sendEmail", id: email._id },
                    "Send this queued transactional email?",
                  )
                }
              >
                Send email
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
