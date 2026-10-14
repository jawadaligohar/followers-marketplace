import type {
  SupplierClient,
  SubmitOrderInput,
  SubmitOrderResult,
  OrderStatusResult,
} from "./types";
import { randomUUID } from "node:crypto";
import { providerConfig, PROVIDER_LABELS, type ProviderId } from "./providers";

export class ProviderRejectedError extends Error {}

export interface PeakerrBalanceResult {
  balance: number;
  currency: string;
}

export interface PeakerrServiceInfo {
  service: string;
  name: string;
  type?: string;
  category: string;
  rate: string;
  min: string;
  max: string;
}

const SAMPLE_SANDBOX_SERVICES: PeakerrServiceInfo[] = [
  {
    service: "1001",
    name: "Instagram Followers [High Quality - Non Drop]",
    category: "Instagram Followers",
    rate: "0.85",
    min: "100",
    max: "50000",
  },
  {
    service: "1002",
    name: "Instagram Likes [Instant - HQ]",
    category: "Instagram Likes",
    rate: "0.45",
    min: "50",
    max: "100000",
  },
  {
    service: "1003",
    name: "TikTok Followers [Real & Active]",
    category: "TikTok Followers",
    rate: "1.20",
    min: "100",
    max: "25000",
  },
  {
    service: "1004",
    name: "TikTok Likes [Instant]",
    category: "TikTok Likes",
    rate: "0.35",
    min: "100",
    max: "50000",
  },
  {
    service: "1005",
    name: "YouTube Subscribers [Non-Drop Guarantee]",
    category: "YouTube Subscribers",
    rate: "4.50",
    min: "50",
    max: "10000",
  },
  {
    service: "1006",
    name: "YouTube Views [Retention - Monetizable]",
    category: "YouTube Views",
    rate: "1.10",
    min: "500",
    max: "1000000",
  },
  {
    service: "1007",
    name: "Twitter/X Followers [Global]",
    category: "Twitter Followers",
    rate: "2.10",
    min: "100",
    max: "20000",
  },
];

export class PeakerrSupplierClient implements SupplierClient {
  private endpoint: string;

  constructor(
    private apiKey: string,
    private provider: ProviderId = "peakerr",
  ) {
    this.endpoint = providerConfig(provider).endpoint;
  }

  public isSandbox(): boolean {
    return providerConfig(this.provider).sandbox;
  }

  async submitOrder(input: SubmitOrderInput): Promise<SubmitOrderResult> {
    if (this.isSandbox()) {
      console.log(
        `[${PROVIDER_LABELS[this.provider]} Sandbox] Simulating order submission: Service #${input.supplierServiceId}, Qty: ${input.quantity}, Link: ${input.link}`,
        input.subscription ??
          input.pollOption ??
          (input.comments ? `${input.comments.length} comments` : ""),
      );
      return {
        supplierOrderId: `sim-${this.provider}-${randomUUID()}`,
        status: "processing",
      };
    }

    const body = new URLSearchParams({
      key: this.apiKey.trim(),
      action: "add",
      service: input.supplierServiceId,
    });

    // Standard SMM-panel parameters per service type.
    if (input.subscription) {
      body.set("username", input.subscription.username);
      body.set("min", String(input.quantity));
      body.set("max", String(input.quantity));
      body.set("posts", String(input.subscription.posts));
      body.set("delay", "0");
      const expiry = new Date();
      expiry.setUTCDate(expiry.getUTCDate() + 30);
      body.set(
        "expiry",
        `${expiry.getUTCDate()}/${expiry.getUTCMonth() + 1}/${expiry.getUTCFullYear()}`,
      );
    } else if (input.comments?.length) {
      body.set("link", input.link);
      body.set("comments", input.comments.join("\n"));
    } else {
      body.set("link", input.link);
      body.set("quantity", String(input.quantity));
      if (input.pollOption) body.set("answer_number", String(input.pollOption));
    }

    const res = await fetch(this.endpoint, {
      method: "POST",
      signal: AbortSignal.timeout(20000),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `${PROVIDER_LABELS[this.provider]} HTTP error (${res.status}): ${errorText}`,
      );
    }

    const data = await res.json().catch(() => null);

    if (!data) {
      throw new Error(
        `${PROVIDER_LABELS[this.provider]} returned invalid JSON response`,
      );
    }

    if (data.error) {
      throw new ProviderRejectedError(
        `${PROVIDER_LABELS[this.provider]} Error: ${data.error}`,
      );
    }

    if (!data.order) {
      throw new Error(
        `${PROVIDER_LABELS[this.provider]} did not return an order ID`,
      );
    }

    return {
      supplierOrderId: String(data.order),
      status: "processing",
    };
  }

  async getOrderStatus(supplierOrderId: string): Promise<OrderStatusResult> {
    if (this.isSandbox()) {
      return {
        status: "processing",
        remains: 0,
        startCount: 0,
      };
    }

    const body = new URLSearchParams({
      key: this.apiKey.trim(),
      action: "status",
      order: supplierOrderId,
    });

    const res = await fetch(this.endpoint, {
      method: "POST",
      signal: AbortSignal.timeout(20000),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `${PROVIDER_LABELS[this.provider]} HTTP error (${res.status}): ${errorText}`,
      );
    }

    const data = await res.json().catch(() => null);

    if (!data) {
      throw new Error(
        `${PROVIDER_LABELS[this.provider]} returned invalid JSON response`,
      );
    }

    if (data.error) {
      throw new ProviderRejectedError(
        `${PROVIDER_LABELS[this.provider]} Error: ${data.error}`,
      );
    }

    if (!data.status) throw new Error("Provider did not return an order status");
    return {
      status: String(data.status).toLowerCase(),
      remains: data.remains ? Number(data.remains) : undefined,
      startCount: data.start_count ? Number(data.start_count) : undefined,
    };
  }

  async getBalance(): Promise<PeakerrBalanceResult> {
    if (this.isSandbox()) {
      return { balance: 500.0, currency: "USD" };
    }

    const body = new URLSearchParams({
      key: this.apiKey.trim(),
      action: "balance",
    });

    const res = await fetch(this.endpoint, {
      method: "POST",
      signal: AbortSignal.timeout(20000),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!res.ok) {
      throw new Error(
        `${PROVIDER_LABELS[this.provider]} HTTP error (${res.status})`,
      );
    }

    const data = await res.json().catch(() => null);
    if (!data || data.error) {
      throw new Error(data?.error ?? "Failed to retrieve Peakerr balance");
    }

    return {
      balance: parseFloat(data.balance ?? "0"),
      currency: data.currency ?? "USD",
    };
  }

  async requestAction(
    action: "cancel" | "refill" | "refill_status",
    id: string,
  ) {
    if (this.isSandbox())
      return action === "refill"
        ? { refill: `sim-refill-${randomUUID()}` }
        : { status: action === "cancel" ? "requested" : "completed" };
    const body = new URLSearchParams({
      key: this.apiKey.trim(),
      action,
      [action === "cancel"
        ? "orders"
        : action === "refill_status"
          ? "refill"
          : "order"]: id,
    });
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok)
      throw new Error(
        `${PROVIDER_LABELS[this.provider]} request failed (${response.status})`,
      );
    const payload = await response.json();
    const data = Array.isArray(payload) ? payload[0] : payload;
    if (!data || data.error || data.cancel?.error || data.refill?.error)
      throw new ProviderRejectedError(
        String(
          data?.error ||
            data?.cancel?.error ||
            data?.refill?.error ||
            "Provider action failed",
        ),
      );
    return data as {
      refill?: string | number;
      status?: string;
      cancel?: number;
    };
  }

  async getServices(): Promise<PeakerrServiceInfo[]> {
    if (this.isSandbox()) {
      return SAMPLE_SANDBOX_SERVICES;
    }

    const body = new URLSearchParams({
      key: this.apiKey.trim(),
      action: "services",
    });

    const res = await fetch(this.endpoint, {
      method: "POST",
      signal: AbortSignal.timeout(20000),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!res.ok) {
      throw new Error(
        `${PROVIDER_LABELS[this.provider]} HTTP error (${res.status})`,
      );
    }

    const data = await res.json().catch(() => null);
    if (!data || !Array.isArray(data)) {
      throw new Error("Failed to retrieve Peakerr services list");
    }

    return data.map((item) => ({
      service: String(item.service),
      name: String(item.name || ""),
      type: item.type ? String(item.type) : undefined,
      category: String(item.category || ""),
      rate: String(item.rate || "0"),
      min: String(item.min || "0"),
      max: String(item.max || "0"),
    }));
  }
}
