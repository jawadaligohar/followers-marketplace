import NewOrderForm from "@/components/dashboard/NewOrderForm";
import FadeIn from "@/components/shared/FadeIn";

export const metadata = { title: "New Order | Surgeon" };

export default function NewOrderPage() {
  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="text-2xl font-bold">Place a new order</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a platform, quantity and payment method.
        </p>
      </FadeIn>
      <FadeIn delay={0.05}>
        <NewOrderForm />
      </FadeIn>
    </div>
  );
}
