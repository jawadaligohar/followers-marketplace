import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/connect";
import { Service } from "@/lib/db/models/Service";

export async function GET() {
  await dbConnect();
  const services = await Service.find({ active: true }).sort({ sortOrder: 1 }).lean();
  return NextResponse.json({ services });
}
