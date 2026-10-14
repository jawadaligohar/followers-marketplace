import { NextResponse } from "next/server";
import { bankInstructions } from "@/lib/bankTransfer";
export async function GET() { return NextResponse.json({ bankEnabled: Boolean(bankInstructions()) }); }
