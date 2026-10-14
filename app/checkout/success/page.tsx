import CheckoutStatusCard from "@/components/checkout/CheckoutStatusCard";
import GuestAccountPrompt from "@/components/checkout/GuestAccountPrompt";
import OrderTracking from "@/components/service/OrderTracking";

export const metadata = { title: "Payment successful | Surgeon" };

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ guest_email?: string; token?: string }>;
}) {
  const { guest_email, token } = await searchParams;

  return (
    <CheckoutStatusCard
      status="success"
      title="Payment successful"
      description="Your payment is being processed. It may take a few seconds to reflect in your order status."
      ctaLabel={guest_email ? "Back to home" : "Go to dashboard"}
      ctaHref={guest_email ? "/" : "/dashboard"}
    >
      {token && <div className="mt-6 text-left"><OrderTracking token={token} /></div>}
      {guest_email && <GuestAccountPrompt email={guest_email} orderToken={token} />}
    </CheckoutStatusCard>
  );
}
