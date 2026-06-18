import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateHealth } from "@/lib/health";

export async function GET() {
  // Load every appliance with its 20 most-recent readings.
  const appliances = await prisma.appliance.findMany({
    orderBy: { name: "asc" },
    include: {
      readings: {
        orderBy: { recordedAt: "desc" },
        take: 20,
      },
    },
  });

  // Enrich each appliance with a freshly-computed health verdict.
  // Note: health is NOT stored in the DB — we derive it on every read so
  // it's always current. (Storing it would risk it going stale.)
  const fleet = appliances.map((appliance) => ({
    ...appliance,
    health: evaluateHealth(appliance.type, appliance.readings),
  }));

  return NextResponse.json(fleet);
}
