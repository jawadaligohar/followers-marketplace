import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrderTracking from "@/components/service/OrderTracking";
export const metadata = {
  title: "Claim 50 free likes | Surgeon",
  robots: { index: false, follow: false },
};
export default async function ClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl px-6 py-16">
        <h1 className="mb-6 text-3xl font-bold">Your 50-like bonus</h1>
        <OrderTracking key={token || "search"} token={token} mode="bonus" />
      </main>
      <Footer />
    </>
  );
}
