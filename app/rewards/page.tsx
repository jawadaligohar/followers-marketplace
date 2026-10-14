import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Offers from "@/components/Offers";
import RewardsPanel from "@/components/service/RewardsPanel";
export const metadata = { title: "Rewards and free likes | Surgeon" };
export default function RewardsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl px-6 py-16">
        <h1 className="text-4xl font-bold">Rewards for every paid order</h1>
        <p className="mt-4 max-w-3xl text-muted-foreground">
          Earn 1% loyalty credit and claim 50 free likes for the first platform
          in each checkout. Wallet top-ups and direct payments earn monthly draw
          entries; spending your topped-up balance is counted once. Refunds
          reduce qualifying spend. Entries close at the end of each UTC calendar
          month, with one equally weighted winner selected by staff from the
          eligible entries. The fixed USD prize is set for the monthly draw; no
          prize amount has been announced yet.
        </p>
        <RewardsPanel />
      </main>
      <Offers />
      <Footer />
    </>
  );
}
