import { secureRoute } from "@/lib/security/request";
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/connect";
import { Service, type IService } from "@/lib/db/models/Service";
import { toServiceDoc } from "@/lib/serviceQueries";

async function getHandler() {
  await dbConnect();
  const services = await Service.find({ active: true })
    .select("-supplierServiceId")
    .sort({ sortOrder: 1 })
    .lean<IService[]>();
  return NextResponse.json({ services: services.map(toServiceDoc) });
}

export const GET = secureRoute(getHandler);
