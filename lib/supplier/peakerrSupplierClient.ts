import type {
  SupplierClient,
  SubmitOrderInput,
  SubmitOrderResult,
  OrderStatusResult,
} from "./types";

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
  { service: "1001", name: "Instagram Followers [High Quality - Non Drop]", category: "Instagram Followers", rate: "0.85", min: "100", max: "50000" },
  { service: "1002", name: "Instagram Likes [Instant - HQ]", category: "Instagram Likes", rate: "0.45", min: "50", max: "100000" },
  { service: "1003", name: "TikTok Followers [Real & Active]", category: "TikTok Followers", rate: "1.20", min: "100", max: "25000" },
  { service: "1004", name: "TikTok Likes [Instant]", category: "TikTok Likes", rate: "0.35", min: "100", max: "50000" },
  { service: "1005", name: "YouTube Subscribers [Non-Drop Guarantee]", category: "YouTube Subscribers", rate: "4.50", min: "50", max: "10000" },
  { service: "1006", name: "YouTube Views [Retention - Monetizable]", category: "YouTube Views", rate: "1.10", min: "500", max: "1000000" },
  { service: "1007", name: "Twitter/X Followers [Global]", category: "Twitter Followers", rate: "2.10", min: "100", max: "20000" },
];

export class PeakerrSupplierClient implements SupplierClient {
  private endpoint: string;

  constructor(private apiKey: string) {
    this.endpoint = process.env.PEAKERR_API_BASE || "https://peakerr.com/api/v2";
  }

  public isSandbox(): boolean {
    return process.env.PEAKERR_SANDBOX === "true" || !this.apiKey || this.apiKey === "peakerr-sandbox";
  }

  async submitOrder(input: SubmitOrderInput): Promise<SubmitOrderResult> {
    if (this.isSandbox()) {
      console.log(`[Peakerr Sandbox] Simulating order submission: Service #${input.supplierServiceId}, Qty: ${input.quantity}, Link: ${input.link}`);
      return {
        supplierOrderId: `sim-pk-${Date.now()}`,
        status: "processing",
      };
    }

    const body = new URLSearchParams({
      key: this.apiKey.trim(),
      action: "add",
      service: input.supplierServiceId,
      link: input.link,
      quantity: String(input.quantity),
    });

    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Peakerr HTTP error (${res.status}): ${errorText}`);
    }

    const data = await res.json().catch(() => null);

    if (!data) {
      throw new Error("Peakerr returned invalid JSON response");
    }

    if (data.error) {
      throw new Error(`Peakerr Error: ${data.error}`);
    }

    if (!data.order) {
      throw new Error("Peakerr did not return an order ID");
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
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Peakerr HTTP error (${res.status}): ${errorText}`);
    }

    const data = await res.json().catch(() => null);

    if (!data) {
      throw new Error("Peakerr returned invalid JSON response");
    }

    if (data.error) {
      throw new Error(`Peakerr Error: ${data.error}`);
    }

    return {
      status: data.status ? String(data.status).toLowerCase() : "processing",
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
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!res.ok) {
      throw new Error(`Peakerr HTTP error (${res.status})`);
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
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!res.ok) {
      throw new Error(`Peakerr HTTP error (${res.status})`);
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
