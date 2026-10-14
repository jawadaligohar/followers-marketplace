import crypto from "crypto";

export function getNowpaymentsApiKey(): string {
  return (process.env.NOWPAYMENTS_API_KEY || "").trim();
}

export function getNowpaymentsIpnSecret(): string {
  return (process.env.NOWPAYMENTS_IPN_SECRET || "").trim();
}

export function getNowpaymentsApiBase(): string {
  return process.env.NOWPAYMENTS_SANDBOX === "true"
    ? "https://api-sandbox.nowpayments.io/v1"
    : "https://api.nowpayments.io/v1";
}

export interface CreateInvoiceParams {
  price_amount: number;
  price_currency: string;
  order_id: string;
  order_description?: string;
  ipn_callback_url: string;
  success_url: string;
  cancel_url: string;
}

export interface InvoiceResponse {
  id: string;
  order_id: string;
  order_description?: string;
  price_amount: number;
  price_currency: string;
  pay_currency?: string | null;
  ipn_callback_url: string;
  invoice_url: string;
  success_url: string;
  cancel_url: string;
  created_at: string;
  updated_at: string;
}

export const nowpayments = {
  isConfigured(): boolean {
    return Boolean(getNowpaymentsApiKey());
  },

  async createInvoice(params: CreateInvoiceParams): Promise<InvoiceResponse> {
    const apiKey = getNowpaymentsApiKey();
    if (!apiKey) {
      throw new Error("NOWPayments API key is not configured. Please add NOWPAYMENTS_API_KEY to your environment variables.");
    }

    const apiBase = getNowpaymentsApiBase();

    const res = await fetch(`${apiBase}/invoice`, {
      method: "POST",
      signal: AbortSignal.timeout(20000),
      redirect: "error",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw new Error(`NOWPayments invoice request failed (${res.status})`);
    }

    const data = (await res.json()) as InvoiceResponse;
    const checkoutUrl = data.invoice_url ? new URL(data.invoice_url) : null;
    if (!checkoutUrl || checkoutUrl.protocol !== "https:" || checkoutUrl.username || checkoutUrl.password || !["nowpayments.io", "sandbox.nowpayments.io"].includes(checkoutUrl.hostname)) {
      throw new Error("NOWPayments did not return an invoice URL");
    }

    return data;
  },

  verifySignature(body: Record<string, unknown>, signature: string): boolean {
    const ipnSecret = getNowpaymentsIpnSecret();
    if (!ipnSecret) {
      return false;
    }
    if (!/^[a-f\d]{128}$/i.test(signature) || !body || typeof body !== "object" || Array.isArray(body)) return false;

    const sortedBody = Object.fromEntries(Object.keys(body).sort().map(key => [key, body[key]]));

    const hmac = crypto.createHmac("sha512", ipnSecret);
    hmac.update(JSON.stringify(sortedBody));
    const calculatedSignature = hmac.digest("hex");

    return crypto.timingSafeEqual(Buffer.from(calculatedSignature, "hex"), Buffer.from(signature, "hex"));
  },
};
