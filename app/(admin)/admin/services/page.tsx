import { dbConnect } from "@/lib/db/connect";
import { Service } from "@/lib/db/models/Service";
import ServicesTable, { AdminServiceRow } from "@/components/admin/ServicesTable";

export const metadata = { title: "Services | Surgeon Admin" };

export default async function AdminServicesPage() {
  await dbConnect();
  const services = await Service.find({}).sort({ sortOrder: 1 }).lean();

  const rows: AdminServiceRow[] = services.map((s) => ({
    _id: s._id.toString(),
    platformId: s.platformId,
    platformLabel: s.platformLabel,
    category: s.category,
    active: s.active,
    tiers: s.tiers,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Services & pricing</h1>
      <ServicesTable services={rows} />
    </div>
  );
}
