import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrderTracking from "@/components/service/OrderTracking";
export const metadata = {
  title: "Track order | Surgeon",
  robots: { index: false, follow: false },
};
export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; orderId?: string }>;
}) {
  const { token, orderId } = await searchParams;
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl px-6 py-16">
        <h1 className="mb-6 text-3xl font-bold">Track your order</h1>
        <OrderTracking
          key={token || orderId || "search"}
          token={token}
          initialOrderId={orderId}
        />
      </main>
      <Footer />
    </>
  );
}
