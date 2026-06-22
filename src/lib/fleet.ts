// src/lib/fleet.ts
// Single source of truth for "load the fleet and attach live health".
// Health is derived on every read (never stored) so it can't go stale.
import { prisma } from "@/lib/prisma";
import { evaluateHealth } from "@/lib/health";

export async function getFleetWithHealth() {
  const appliances = await prisma.appliance.findMany({
    orderBy: { name: "asc" },
    include: { readings: { orderBy: { recordedAt: "desc" }, take: 20 } },
  });

  return appliances.map((appliance) => ({
    ...appliance,
    health: evaluateHealth(appliance.type, appliance.readings),
  }));
}
