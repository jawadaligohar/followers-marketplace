import { secureRoute } from "@/lib/security/request";
import { NextResponse } from "next/server";
import { bankInstructions } from "@/lib/bankTransfer";
async function getHandler() { return NextResponse.json({ bankEnabled: Boolean(bankInstructions()) }); }

export const GET = secureRoute(getHandler);
