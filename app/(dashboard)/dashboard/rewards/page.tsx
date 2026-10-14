import RewardsPanel from "@/components/service/RewardsPanel";
export const metadata = { title: "My rewards | Surgeon" };
export default function MyRewardsPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Your rewards</h1>
      <RewardsPanel />
    </>
  );
}
