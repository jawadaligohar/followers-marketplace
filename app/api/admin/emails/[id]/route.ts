import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { dbConnect } from "@/lib/db/connect";
import { EmailOutbox } from "@/lib/db/models/Benefits";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id))
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  await dbConnect();
  const message = await EmailOutbox.findById(id)
    .select("to subject text status providerMessageId")
    .lean();
  return message
    ? NextResponse.json({ message })
    : NextResponse.json({ error: "Message not found" }, { status: 404 });
}
