import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateHealth } from "@/lib/health";
import { summarizeBusiness } from "@/lib/business";

export async function GET() {
  // Same load as /api/appliances: each unit with its 20 newest readings.
  const appliances = await prisma.appliance.findMany({
    orderBy: { name: "asc" },
    include: {
      readings: { orderBy: { recordedAt: "desc" }, take: 20 },
    },
  });

  // Derive health on read (always current), then roll up into business KPIs.
  const fleet = appliances.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    health: evaluateHealth(a.type, a.readings),
  }));

  return NextResponse.json(summarizeBusiness(fleet));
}
