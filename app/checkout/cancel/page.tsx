import CheckoutStatusCard from "@/components/checkout/CheckoutStatusCard";

export const metadata = { title: "Payment cancelled | Surgeon" };

export default function CheckoutCancelPage() {
  return (
    <CheckoutStatusCard
      status="cancel"
      title="Payment cancelled"
      description="No charge was made. You can try again anytime."
      ctaLabel="Back to dashboard"
      ctaHref="/dashboard"
      ctaVariant="outline"
    />
  );
}
