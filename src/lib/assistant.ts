// src/lib/assistant.ts
// Builds a compact, factual snapshot of the fleet for the LLM to reason over.
// `includeBusiness` gates dollar figures behind the EXEC role.
import { prisma } from "@/lib/prisma";
import { evaluateHealth } from "@/lib/health";
import { summarizeBusiness } from "@/lib/business";

export async function buildFleetContext(includeBusiness: boolean): Promise<string> {
  const appliances = await prisma.appliance.findMany({
    orderBy: { name: "asc" },
    include: { readings: { orderBy: { recordedAt: "desc" }, take: 20 } },
  });

  const fleet = appliances.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    health: evaluateHealth(a.type, a.readings),
  }));

  const lines = fleet.map((a) => {
    const v = a.health.value !== null ? ` [${a.health.metric}=${a.health.value}]` : "";
    return `- ${a.name} (${a.type}): ${a.health.status} — ${a.health.reason}${v}`;
  });

  let context = `Fleet status (${fleet.length} appliances):\n${lines.join("\n")}`;

  // Only EXEC users get the financial picture in their assistant's context.
  if (includeBusiness) {
    const b = summarizeBusiness(fleet);
    context +=
      `\n\nBusiness impact:\n` +
      `- Estimated savings from early catches: $${b.estimatedSavings}\n` +
      `- Cost at risk (critical units): $${b.costAtRisk}\n` +
      `- Issues caught early (warnings): ${b.issuesCaughtEarly}\n` +
      `- Fleet uptime: ${b.uptimePct}%`;
  }

  return context;
}
