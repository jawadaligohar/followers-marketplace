import NewOrderForm from "@/components/dashboard/NewOrderForm";

export const metadata = { title: "New Order | Surgeon" };

export default function NewOrderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Place a new order</h1>
        <p className="mt-1 text-sm text-white/50">
          Choose a platform, quantity and payment method.
        </p>
      </div>
      <NewOrderForm />
    </div>
  );
}
