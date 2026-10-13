"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, RefreshCw, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SupplierStatus {
  connected: boolean;
  mode: "sandbox" | "live";
  apiKeyConfigured: boolean;
  balance?: number;
  currency?: string;
  error?: string;
}

export default function PeakerrStatusBanner() {
  const [status, setStatus] = useState<SupplierStatus | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/supplier/status");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({
        connected: false,
        mode: "sandbox",
        apiKeyConfigured: false,
        error: "Network error fetching Peakerr status",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading && !status) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground animate-pulse">
        <Layers className="h-3.5 w-3.5" />
        Checking Peakerr connection...
      </div>
    );
  }

  if (!status) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 bg-card/60 px-3.5 py-2.5 text-xs backdrop-blur-sm">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 font-medium">
          <Layers className="h-4 w-4 text-brand-500" />
          <span>Peakerr SMM Supplier:</span>
        </div>

        {status.connected ? (
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Connected</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-amber-400">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{status.error || "Disconnected"}</span>
          </div>
        )}

        <Badge
          variant="outline"
          className={
            status.mode === "sandbox"
              ? "border-sky-500/30 bg-sky-500/10 text-sky-400 font-mono text-[10px]"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-[10px]"
          }
        >
          {status.mode === "sandbox" ? "Sandbox Simulator" : "Live Production"}
        </Badge>

        {status.balance !== undefined && (
          <div className="text-muted-foreground">
            Balance:{" "}
            <span className="font-semibold text-foreground">
              ${status.balance.toFixed(2)} {status.currency}
            </span>
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={fetchStatus}
        disabled={loading}
        className="h-6 gap-1 text-[11px] text-muted-foreground hover:text-foreground"
      >
        <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        Refresh
      </Button>
    </div>
  );
}

