import CheckoutStatusCard from "@/components/checkout/CheckoutStatusCard";
import GuestAccountPrompt from "@/components/checkout/GuestAccountPrompt";

export const metadata = { title: "Payment successful | Surgeon" };

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ guest_email?: string }>;
}) {
  const { guest_email } = await searchParams;

  return (
    <CheckoutStatusCard
      status="success"
      title="Payment successful"
      description="Your payment is being processed. It may take a few seconds to reflect in your order status."
      ctaLabel={guest_email ? "Back to home" : "Go to dashboard"}
      ctaHref={guest_email ? "/" : "/dashboard"}
    >
      {guest_email && <GuestAccountPrompt email={guest_email} />}
    </CheckoutStatusCard>
  );
}
