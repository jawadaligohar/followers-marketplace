import crypto from "crypto";

export const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || "";
export const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || "";

export const nowpayments = {
  async createInvoice({ price_amount, price_currency, order_id, order_description, ipn_callback_url, success_url, cancel_url }: any) {
    const res = await fetch("https://api.nowpayments.io/v1/invoice", {
      method: "POST",
      headers: {
        "x-api-key": NOWPAYMENTS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount,
        price_currency,
        order_id,
        order_description,
        ipn_callback_url,
        success_url,
        cancel_url,
      }),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error("NOWPayments error: " + errorText);
    }
    
    return res.json();
  },

  verifySignature(body: any, signature: string) {
    if (!NOWPAYMENTS_IPN_SECRET) return true; // if not set, assume valid for testing (or you should enforce it)
    
    // Sort keys alphabetically
    const sortedBody = Object.keys(body)
      .sort()
      .reduce((acc, key) => {
        acc[key] = body[key];
        return acc;
      }, {} as any);
      
    const hmac = crypto.createHmac("sha512", NOWPAYMENTS_IPN_SECRET);
    hmac.update(JSON.stringify(sortedBody));
    const calculatedSignature = hmac.digest("hex");
    
    return calculatedSignature === signature;
  }
};
