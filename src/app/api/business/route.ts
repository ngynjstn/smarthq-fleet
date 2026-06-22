import { NextResponse } from "next/server";
import { summarizeBusiness } from "@/lib/business";
import { getFleetWithHealth } from "@/lib/fleet";

export async function GET() {
  const fleet = await getFleetWithHealth();
  return NextResponse.json(summarizeBusiness(fleet));
}
