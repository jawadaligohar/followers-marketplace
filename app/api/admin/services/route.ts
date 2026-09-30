import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { dbConnect } from "@/lib/db/connect";
import { Service } from "@/lib/db/models/Service";
import { serviceSchema } from "@/lib/validation/service";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const services = await Service.find({}).sort({ sortOrder: 1 }).lean();
  return NextResponse.json({ services });
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = serviceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  await dbConnect();
  const service = await Service.create(parsed.data);
  return NextResponse.json({ service });
}
