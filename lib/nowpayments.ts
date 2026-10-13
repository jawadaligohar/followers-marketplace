import crypto from "crypto";

export const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || "";
export const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || "";

const API_BASE =
  process.env.NOWPAYMENTS_SANDBOX === "true"
    ? "https://api-sandbox.nowpayments.io/v1"
    : "https://api.nowpayments.io/v1";

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
    return Boolean(NOWPAYMENTS_API_KEY.trim());
  },

  async createInvoice(params: CreateInvoiceParams): Promise<InvoiceResponse> {
    if (!this.isConfigured()) {
      throw new Error("NOWPayments API key is not configured. Please add NOWPAYMENTS_API_KEY to your environment variables.");
    }

    const res = await fetch(`${API_BASE}/invoice`, {
      method: "POST",
      headers: {
        "x-api-key": NOWPAYMENTS_API_KEY.trim(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`NOWPayments error (${res.status}): ${errorText}`);
    }

    const data = (await res.json()) as InvoiceResponse;
    if (!data.invoice_url) {
      throw new Error("NOWPayments did not return an invoice URL");
    }

    return data;
  },

  verifySignature(body: Record<string, unknown>, signature: string): boolean {
    if (!NOWPAYMENTS_IPN_SECRET.trim()) {
      // In development / testing without secret, accept payload with warning
      return true;
    }

    const sortedBody = Object.keys(body)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = body[key];
        return acc;
      }, {});

    const hmac = crypto.createHmac("sha512", NOWPAYMENTS_IPN_SECRET.trim());
    hmac.update(JSON.stringify(sortedBody));
    const calculatedSignature = hmac.digest("hex");

    return calculatedSignature.toLowerCase() === signature.toLowerCase();
  },
};
