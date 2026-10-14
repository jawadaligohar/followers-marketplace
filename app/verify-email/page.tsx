import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VerifyEmail from "@/components/auth/VerifyEmail";
export const metadata = {
  title: "Verify email | Surgeon",
  robots: { index: false, follow: false },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl px-6 py-20">
        <h1 className="mb-6 text-3xl font-bold">Verify your email</h1>
        <VerifyEmail token={token} />
      </main>
      <Footer />
    </>
  );
}
