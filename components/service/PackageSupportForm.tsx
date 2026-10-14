"use client";

import { useState } from "react";
import { useServices } from "@/lib/cart/useServices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PackageSupportForm({ email }: { email: string }) {
  const { services } = useServices();
  const [slug, setSlug] = useState("");
  const [quantity, setQuantity] = useState("");
  const service = services.find((s) => s.slug === slug);

  function openEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const title = service
      ? `${service.platformLabel} ${service.category}`
      : "General support";
    const body = [
      `Name: ${fields.get("name")}`,
      `Checkout email: ${fields.get("email")}`,
      `Order ID: ${fields.get("orderId") || "Not yet ordered"}`,
      `Service: ${title}`,
      `Quantity: ${quantity || "Not selected"}`,
      "",
      String(fields.get("message")),
    ].join("\n");
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(`Package enquiry: ${title}`)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <form onSubmit={openEmail} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="support-name">Name</Label>
        <Input id="support-name" name="name" autoComplete="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="support-email">Checkout email</Label>
        <Input
          id="support-email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="support-order">Order ID (optional)</Label>
        <Input id="support-order" name="orderId" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="support-service">Service</Label>
        <select
          id="support-service"
          value={slug}
          onChange={(event) => {
            setSlug(event.target.value);
            setQuantity("");
          }}
          className="w-full rounded-lg border border-input bg-background p-2 text-sm"
        >
          <option value="">General support</option>
          {services.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.platformLabel} {s.category}
            </option>
          ))}
        </select>
      </div>
      {service && (
        <div className="space-y-2">
          <Label htmlFor="support-quantity">Package quantity</Label>
          <select
            id="support-quantity"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="w-full rounded-lg border border-input bg-background p-2 text-sm"
          >
            <option value="">Choose a quantity (optional)</option>
            {service.tiers.map((tier) => (
              <option key={tier.qtyValue} value={tier.qtyValue}>
                {tier.qty}
                {service.kind === "auto" ? " per post" : ""}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="support-message">Message</Label>
        <textarea
          id="support-message"
          name="message"
          rows={4}
          required
          className="w-full rounded-lg border border-input bg-background p-3 text-sm"
          placeholder="Tell us which package or order you need help with."
        />
      </div>
      <Button type="submit" className="w-full">
        Open email draft
      </Button>
      <p className="text-xs text-muted-foreground">
        Opens your email app with these details. Review and send your message
        there.
      </p>
    </form>
  );
}
