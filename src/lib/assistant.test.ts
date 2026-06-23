import { describe, it, expect, vi } from "vitest";

// buildFleetContext loads the fleet from the database via getFleetWithHealth.
// We replace that single dependency with a fixed snapshot so this is a pure,
// deterministic unit test of the CONTEXT-BUILDING + ROLE-GATING logic — no DB.
const mockFleet = vi.hoisted(() => [
  {
    id: "fridge-1",
    name: "Kitchen Fridge",
    type: "REFRIGERATOR",
    health: {
      status: "WARNING" as const,
      reason: "Temp rising (+2.0°C trend) — possible compressor wear",
      metric: "TEMP_C",
      value: 4.5,
    },
  },
  {
    id: "oven-1",
    name: "Garage Oven",
    type: "OVEN",
    health: { status: "HEALTHY" as const, reason: "Operating normally", metric: "TEMP_C", value: 200 },
  },
]);

vi.mock("./fleet", () => ({
  getFleetWithHealth: vi.fn(async () => mockFleet),
}));

import { buildFleetContext } from "./assistant";

describe("buildFleetContext — snapshot reflects current fleet state", () => {
  it("lists every appliance with its live status, reason and metric value", () => {
    return buildFleetContext(false).then((ctx) => {
      // The LLM must reason over the ACTUAL current fleet, not stale prose.
      expect(ctx).toContain("Fleet status (2 appliances)");
      expect(ctx).toContain("Kitchen Fridge (REFRIGERATOR): WARNING — Temp rising");
      expect(ctx).toContain("[TEMP_C=4.5]");
      expect(ctx).toContain("Garage Oven (OVEN): HEALTHY — Operating normally");
    });
  });
});

describe("buildFleetContext — role gating (security)", () => {
  it("OPS users: dollar figures are NEVER placed in the LLM context", async () => {
    // This is the security guarantee: financials are filtered out of the data
    // handed to the model, not just hidden in the UI. A standard user therefore
    // cannot coax exec-only numbers out of the assistant by asking cleverly.
    const ctx = await buildFleetContext(false);
    expect(ctx).not.toContain("Business impact");
    expect(ctx).not.toContain("$");
    expect(ctx).not.toContain("savings");
    expect(ctx).not.toContain("uptime");
    // ...but they still get the operational fleet picture.
    expect(ctx).toContain("Kitchen Fridge");
  });

  it("EXEC users: dollar figures ARE included so the assistant can answer cost questions", async () => {
    const ctx = await buildFleetContext(true);
    expect(ctx).toContain("Business impact");
    expect(ctx).toContain("Estimated savings from early catches: $650"); // fridge WARNING
    expect(ctx).toContain("Cost at risk (critical units): $0");
    expect(ctx).toContain("Issues caught early (warnings): 1");
    expect(ctx).toContain("Fleet uptime: 100%");
  });

  it("the only difference between OPS and EXEC context is the business block", async () => {
    // The operational portion must be identical regardless of role; role only
    // adds (never removes or alters) the financial section.
    const ops = await buildFleetContext(false);
    const exec = await buildFleetContext(true);
    expect(exec.startsWith(ops)).toBe(true);
    expect(exec.length).toBeGreaterThan(ops.length);
  });
});
