import { describe, it, expect } from "vitest";
import { COST_MODEL, costProfile, savingsPerCatch } from "./costs";

describe("costProfile", () => {
  it("returns the exact profile for each known appliance type", () => {
    // These dollar figures back the business KPIs and the interview story
    // ($900 emergency fridge repair incl. spoilage vs $250 planned).
    expect(costProfile("REFRIGERATOR")).toEqual({ emergencyRepair: 900, proactiveRepair: 250 });
    expect(costProfile("OVEN")).toEqual({ emergencyRepair: 500, proactiveRepair: 220 });
  });

  it("falls back to a safe default for unknown/garbage types", () => {
    // The cost math must never crash on an unexpected type coming from the DB.
    expect(costProfile("TOASTER")).toEqual({ emergencyRepair: 400, proactiveRepair: 200 });
    expect(costProfile("")).toEqual({ emergencyRepair: 400, proactiveRepair: 200 });
  });
});

describe("savingsPerCatch", () => {
  it("is emergency minus proactive repair cost", () => {
    // The whole predictive-maintenance value prop in one number:
    // catching a fridge early saves 900 - 250 = $650.
    expect(savingsPerCatch("REFRIGERATOR")).toBe(650);
    expect(savingsPerCatch("WASHER")).toBe(250);
    expect(savingsPerCatch("DRYER")).toBe(250);
    expect(savingsPerCatch("OVEN")).toBe(280);
  });

  it("uses the default profile's spread for unknown types (400 - 200 = 200)", () => {
    expect(savingsPerCatch("TOASTER")).toBe(200);
  });

  it("matches savings derived directly from the COST_MODEL table", () => {
    // Guards against the table and the helper drifting apart.
    for (const [type, profile] of Object.entries(COST_MODEL)) {
      expect(savingsPerCatch(type)).toBe(profile.emergencyRepair - profile.proactiveRepair);
    }
  });
});
