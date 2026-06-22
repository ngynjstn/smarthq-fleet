import { NextResponse } from "next/server";
import { getFleetWithHealth } from "@/lib/fleet";

export async function GET() {
  return NextResponse.json(await getFleetWithHealth());
}

