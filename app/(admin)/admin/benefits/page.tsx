import BenefitsPanel from "@/components/admin/BenefitsPanel";
export const metadata = { title: "Payments and rewards | Surgeon" };
export default function BenefitsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Payments and rewards</h1>
      <BenefitsPanel />
    </div>
  );
}
