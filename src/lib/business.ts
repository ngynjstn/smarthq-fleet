// Pure aggregator: live fleet health -> business KPIs.
// Reuses evaluateHealth's verdicts (Phase 2) and costs.ts (the money).

import type { Status } from "./health";
import { costProfile, savingsPerCatch } from "./costs";

// What each unit contributes to the business picture right now.
export type BusinessUnit = {
  id: string;
  name: string;
  type: string;
  status: Status;
  savings: number; // $ we capture by acting on an early WARNING
  atRisk: number;  // $ exposure if a CRITICAL unit runs to failure
};

export type BusinessSummary = {
  totalUnits: number;
  offline: number;
  criticalNow: number;
  issuesCaughtEarly: number; // units in WARNING — caught before failure
  uptimePct: number;         // % of fleet still operational
  estimatedSavings: number;  // sum of savings across early catches
  costAtRisk: number;        // sum of emergency cost across criticals
  units: BusinessUnit[];
};

// We only need these fields off each appliance; the API gives us more.
type FleetItem = {
  id: string;
  name: string;
  type: string;
  health: { status: Status };
};

export function summarizeBusiness(fleet: FleetItem[]): BusinessSummary {
  const units: BusinessUnit[] = fleet.map((a) => {
    const status = a.health.status;
    return {
      id: a.id,
      name: a.name,
      type: a.type,
      status,
      savings: status === "WARNING" ? savingsPerCatch(a.type) : 0,
      atRisk: status === "CRITICAL" ? costProfile(a.type).emergencyRepair : 0,
    };
  });

  const offline = units.filter((u) => u.status === "OFFLINE").length;
  const criticalNow = units.filter((u) => u.status === "CRITICAL").length;
  const issuesCaughtEarly = units.filter((u) => u.status === "WARNING").length;
  const total = units.length;

  return {
    totalUnits: total,
    offline,
    criticalNow,
    issuesCaughtEarly,
    // Operational = not offline and not critical. WARNING units still run.
    uptimePct: total === 0 ? 0 : Math.round(((total - offline - criticalNow) / total) * 100),
    estimatedSavings: units.reduce((sum, u) => sum + u.savings, 0),
    costAtRisk: units.reduce((sum, u) => sum + u.atRisk, 0),
    units,
  };
}
