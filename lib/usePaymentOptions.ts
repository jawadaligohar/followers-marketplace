"use client";
import { useEffect, useState } from "react";
export function usePaymentOptions() {
  const [bankEnabled, setBankEnabled] = useState(false);
  useEffect(() => { fetch("/api/payment-options").then((r) => r.json()).then((data) => setBankEnabled(data.bankEnabled === true)).catch(() => {}); }, []);
  return { bankEnabled };
}
