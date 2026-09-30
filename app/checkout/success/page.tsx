import CheckoutStatusCard from "@/components/checkout/CheckoutStatusCard";

export const metadata = { title: "Payment successful | Surgeon" };

export default function CheckoutSuccessPage() {
  return (
    <CheckoutStatusCard
      status="success"
      title="Payment successful"
      description="Your payment is being processed. It may take a few seconds to reflect in your dashboard."
      ctaLabel="Go to dashboard"
      ctaHref="/dashboard"
    />
  );
}
