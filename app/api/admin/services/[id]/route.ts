import { secureRoute } from "@/lib/security/request";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { dbConnect } from "@/lib/db/connect";
import { Service } from "@/lib/db/models/Service";
import {
  serviceUpdateSchema,
  validProviderPlatform,
} from "@/lib/validation/service";

async function patchHandler(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = serviceUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  await dbConnect();
  const existing = await Service.findById(id);
  if (!existing)
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  if (!validProviderPlatform({ ...existing.toObject(), ...parsed.data }))
    return NextResponse.json(
      { error: "Tiksta is only available for TikTok services" },
      { status: 400 },
    );
  const service = await Service.findByIdAndUpdate(id, parsed.data, {
    new: true,
    runValidators: true,
  });
  if (!service)
    return NextResponse.json({ error: "Service not found" }, { status: 404 });

  return NextResponse.json({ service });
}

async function deleteHandler(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await dbConnect();
  await Service.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}

export const PATCH = secureRoute(patchHandler);
export const DELETE = secureRoute(deleteHandler);
