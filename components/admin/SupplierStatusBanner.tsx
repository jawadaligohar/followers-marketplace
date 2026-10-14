"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
type Status = {
  provider: string;
  label: string;
  connected: boolean;
  configured: boolean;
  mode: string;
  balance?: number;
  currency?: string;
  lowBalance?: boolean;
  error?: string;
};
export default function SupplierStatusBanner() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [routing, setRouting] = useState<
    {
      slug: string;
      packages: {
        quantity: number;
        provider: string;
        serviceId: string | null;
        hold: string | null;
        refillPolicy?: string;
        durationMinutes?: number;
      }[];
    }[]
  >([]);
  const [error, setError] = useState("");
  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/supplier/status");
      if (!response.ok) throw new Error();
      const data = await response.json();
      setStatuses(data.providers || []);
      setEnabled(data.dispatchEnabled === true);
      setRouting(data.routing || []);
    } catch {
      setError("Unable to check supplier balances");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let active = true;
    fetch("/api/admin/supplier/status")
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => {
        if (active) {
          setStatuses(data.providers || []);
          setEnabled(data.dispatchEnabled === true);
          setRouting(data.routing || []);
        }
      })
      .catch(() => {
        if (active) setError("Unable to check supplier balances");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <section
      aria-label="Supplier balances"
      className="space-y-2 rounded-xl border border-border p-4 text-sm"
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold">SMM provider balances</span>
        <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
          {loading ? "Checking…" : "Refresh"}
        </Button>
      </div>
      {error && <p role="alert">{error}</p>}
      <p className="text-muted-foreground">
        Dispatch {enabled ? "enabled" : "paused"}.{" "}
        {enabled
          ? "Held packages still require staff review."
          : "Paid orders queue for staff until SMM_DISPATCH_ENABLED=true. Sandbox settings do not override this."}
      </p>
      {routing.length > 0 && (
        <details>
          <summary className="cursor-pointer">
            Service routing and package holds ({routing.length} services)
          </summary>
          <div className="mt-3 max-h-96 space-y-3 overflow-auto">
            {routing.map((service) => (
              <div key={service.slug} className="rounded border p-2">
                <p className="font-medium">{service.slug}</p>
                {service.packages.map((tier) => (
                  <p
                    key={tier.quantity}
                    className="text-xs text-muted-foreground"
                  >
                    {tier.quantity.toLocaleString()}: {tier.provider} #
                    {tier.serviceId || "unmapped"} —{" "}
                    {tier.hold ||
                      "Mapped; API catalog and delivery test still required"}
                    {tier.refillPolicy && ` · ${tier.refillPolicy}`}
                    {tier.durationMinutes &&
                      ` · ${tier.durationMinutes} minutes`}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </details>
      )}
      <div className="grid gap-2 sm:grid-cols-3">
        {statuses.map((status) => (
          <div
            key={status.provider}
            className={`rounded-lg border p-3 ${status.lowBalance || !status.connected ? "border-amber-500/40" : "border-border"}`}
          >
            <p className="font-medium">
              {status.label}{" "}
              <span className="text-xs text-muted-foreground">
                {status.configured ? status.mode : "not configured"}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {status.connected
                ? `${status.balance?.toFixed(2)} ${status.currency}`
                : status.error}
            </p>
            {status.lowBalance && (
              <p className="mt-1 text-xs text-amber-600">
                Below $25. Add supplier credit before dispatching.
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
