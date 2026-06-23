import { describe, it, expect } from "vitest";
import { summarizeBusiness } from "./business";
import type { Status } from "./health";

// summarizeBusiness only reads { id, name, type, health.status } off each unit,
// so a tiny factory is all we need to drive every branch.
function unit(type: string, status: Status, id = type) {
  return { id, name: `${type} ${id}`, type, health: { status } };
}

describe("summarizeBusiness", () => {
  it("returns zeros and 0% uptime for an empty fleet (no divide-by-zero)", () => {
    const b = summarizeBusiness([]);
    expect(b.totalUnits).toBe(0);
    expect(b.uptimePct).toBe(0);
    expect(b.estimatedSavings).toBe(0);
    expect(b.costAtRisk).toBe(0);
    expect(b.units).toEqual([]);
  });

  it("books savings only for WARNING units (the early catches)", () => {
    // A WARNING is an issue caught early → savingsPerCatch; nothing is at risk yet.
    const b = summarizeBusiness([unit("REFRIGERATOR", "WARNING")]);
    expect(b.issuesCaughtEarly).toBe(1);
    expect(b.estimatedSavings).toBe(650); // 900 - 250
    expect(b.costAtRisk).toBe(0);
    expect(b.units[0].savings).toBe(650);
    expect(b.units[0].atRisk).toBe(0);
  });

  it("books at-risk cost only for CRITICAL units (running to failure)", () => {
    // A CRITICAL unit's exposure is the full emergency repair cost.
    const b = summarizeBusiness([unit("REFRIGERATOR", "CRITICAL")]);
    expect(b.criticalNow).toBe(1);
    expect(b.costAtRisk).toBe(900);
    expect(b.estimatedSavings).toBe(0);
    expect(b.units[0].atRisk).toBe(900);
  });

  it("books neither savings nor risk for HEALTHY or OFFLINE units", () => {
    const b = summarizeBusiness([unit("OVEN", "HEALTHY"), unit("DRYER", "OFFLINE")]);
    expect(b.estimatedSavings).toBe(0);
    expect(b.costAtRisk).toBe(0);
  });

  it("counts offline/critical and computes uptime as 'not offline and not critical'", () => {
    // 4 units: 1 healthy, 1 warning (still running), 1 critical, 1 offline.
    // Operational = total - offline - critical = 4 - 1 - 1 = 2 → 50%.
    // NB: WARNING units still count as up — they're degraded, not down.
    const fleet = [
      unit("OVEN", "HEALTHY", "a"),
      unit("REFRIGERATOR", "WARNING", "b"),
      unit("WASHER", "CRITICAL", "c"),
      unit("DRYER", "OFFLINE", "d"),
    ];
    const b = summarizeBusiness(fleet);
    expect(b.totalUnits).toBe(4);
    expect(b.offline).toBe(1);
    expect(b.criticalNow).toBe(1);
    expect(b.issuesCaughtEarly).toBe(1);
    expect(b.uptimePct).toBe(50);
  });

  it("rounds uptime to the nearest whole percent", () => {
    // 3 units, 1 offline → operational 2/3 = 66.67% → rounds to 67%.
    const fleet = [
      unit("OVEN", "HEALTHY", "a"),
      unit("DRYER", "HEALTHY", "b"),
      unit("WASHER", "OFFLINE", "c"),
    ];
    expect(summarizeBusiness(fleet).uptimePct).toBe(67);
  });

  it("sums savings and at-risk cost across a mixed fleet", () => {
    // Two early catches (fridge 650 + washer 250) and one critical oven (500).
    const fleet = [
      unit("REFRIGERATOR", "WARNING", "a"),
      unit("WASHER", "WARNING", "b"),
      unit("OVEN", "CRITICAL", "c"),
    ];
    const b = summarizeBusiness(fleet);
    expect(b.estimatedSavings).toBe(900); // 650 + 250
    expect(b.costAtRisk).toBe(500);
  });
});
