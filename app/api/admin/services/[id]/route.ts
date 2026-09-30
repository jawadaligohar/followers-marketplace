import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { dbConnect } from "@/lib/db/connect";
import { Service } from "@/lib/db/models/Service";
import { serviceSchema } from "@/lib/validation/service";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = serviceSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  await dbConnect();
  const service = await Service.findByIdAndUpdate(id, parsed.data, { new: true });
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  return NextResponse.json({ service });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await dbConnect();
  await Service.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
