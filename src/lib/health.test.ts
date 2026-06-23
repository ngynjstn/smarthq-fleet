import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { evaluateHealth, type Reading } from "./health";

// evaluateHealth compares each reading's recordedAt against Date.now() to
// decide staleness. We freeze the clock so "now" and the 30s staleness
// boundary are exact and the tests are fully deterministic.
const NOW = new Date("2026-06-23T12:00:00.000Z").getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});
afterEach(() => {
  vi.useRealTimers();
});

// Helper: a reading recorded `secondsAgo` before the frozen "now".
// Readings are newest-first, matching how the API returns them.
function reading(metric: string, value: number, secondsAgo = 0): Reading {
  return { metric, value, recordedAt: new Date(NOW - secondsAgo * 1000).toISOString() };
}

describe("evaluateHealth — offline & staleness", () => {
  it("reports OFFLINE when there are no readings at all", () => {
    // A device we've never heard from isn't healthy — it's simply not reporting.
    const h = evaluateHealth("REFRIGERATOR", []);
    expect(h.status).toBe("OFFLINE");
    expect(h.reason).toBe("No readings received");
    expect(h.metric).toBeNull();
    expect(h.value).toBeNull();
  });

  it("treats a fresh reading (just under 30s old) as live, not offline", () => {
    // Boundary: ageMs must be STRICTLY greater than 30_000 to count as stale.
    const h = evaluateHealth("OVEN", [reading("TEMP_C", 200, 29.999)]);
    expect(h.status).toBe("HEALTHY");
  });

  it("treats a reading exactly 30s old as still live (boundary is exclusive)", () => {
    // ageMs === 30_000 is NOT > 30_000, so the device is still considered live.
    const h = evaluateHealth("OVEN", [reading("TEMP_C", 200, 30)]);
    expect(h.status).toBe("HEALTHY");
  });

  it("reports OFFLINE once the latest reading is older than 30s", () => {
    // One millisecond past the window flips it offline — but we keep the last
    // known metric/value so the UI can still show what we last saw.
    const h = evaluateHealth("OVEN", [reading("TEMP_C", 200, 30.001)]);
    expect(h.status).toBe("OFFLINE");
    expect(h.reason).toBe("No recent readings");
    expect(h.metric).toBe("TEMP_C");
    expect(h.value).toBe(200);
  });
});

describe("evaluateHealth — REFRIGERATOR thresholds", () => {
  // Single reading => not enough points for a trend, so only the absolute
  // value is judged. This isolates the threshold logic from the predictive logic.
  it("is HEALTHY at the top of the ideal band (exactly 5°C)", () => {
    // 5 is NOT > 5, so it stays healthy — exact upper boundary of "ideal".
    expect(evaluateHealth("REFRIGERATOR", [reading("TEMP_C", 5)]).status).toBe("HEALTHY");
  });

  it("is HEALTHY at the bottom of the ideal band (exactly 1°C)", () => {
    // 1 is NOT < 1, so it stays healthy — exact lower boundary.
    expect(evaluateHealth("REFRIGERATOR", [reading("TEMP_C", 1)]).status).toBe("HEALTHY");
  });

  it("WARNS just above the ideal band (5.1°C)", () => {
    const h = evaluateHealth("REFRIGERATOR", [reading("TEMP_C", 5.1)]);
    expect(h.status).toBe("WARNING");
    expect(h.reason).toContain("Out of ideal range");
  });

  it("WARNS just below the ideal band (0.9°C)", () => {
    expect(evaluateHealth("REFRIGERATOR", [reading("TEMP_C", 0.9)]).status).toBe("WARNING");
  });

  it("still only WARNS at exactly 7°C (food-safety boundary not yet crossed)", () => {
    // 7 is NOT > 7, so it's a warning, not yet critical.
    const h = evaluateHealth("REFRIGERATOR", [reading("TEMP_C", 7)]);
    expect(h.status).toBe("WARNING");
  });

  it("is CRITICAL once temp exceeds 7°C (food-safety risk)", () => {
    const h = evaluateHealth("REFRIGERATOR", [reading("TEMP_C", 7.1)]);
    expect(h.status).toBe("CRITICAL");
    expect(h.reason).toContain("food safety");
  });
});

describe("evaluateHealth — REFRIGERATOR predictive compressor-wear trend", () => {
  // This is the headline feature: catch a fridge on its way to failure while
  // its absolute temperature is still inside the safe range.
  it("WARNS on a sustained upward trend even though every temp is in-range", () => {
    // Newest-first: 4.0 now, falling back to 2.0 across the window.
    // trend = newest(4.0) - oldest(2.0) = +2.0 > 1.5 → flagged.
    // Note 4.0 is well within the healthy band, so ONLY the trend trips it.
    const readings = [
      reading("TEMP_C", 4.0),
      reading("TEMP_C", 3.4),
      reading("TEMP_C", 2.7),
      reading("TEMP_C", 2.0),
    ];
    const h = evaluateHealth("REFRIGERATOR", readings);
    expect(h.status).toBe("WARNING");
    expect(h.reason).toContain("compressor wear");
  });

  it("does NOT flag a trend of exactly +1.5°C (boundary is exclusive)", () => {
    // trend = 3.5 - 2.0 = 1.5, which is NOT > 1.5 → no predictive warning,
    // and 3.5 is in-range → HEALTHY.
    const readings = [
      reading("TEMP_C", 3.5),
      reading("TEMP_C", 3.0),
      reading("TEMP_C", 2.5),
      reading("TEMP_C", 2.0),
    ];
    expect(evaluateHealth("REFRIGERATOR", readings).status).toBe("HEALTHY");
  });

  it("ignores the trend when there are too few readings to call it one (<4 points)", () => {
    // Only 3 points → temperatureTrend returns null → fall back to absolute
    // value, which is in-range → HEALTHY. Prevents false alarms on sparse data.
    const readings = [
      reading("TEMP_C", 4.0),
      reading("TEMP_C", 3.0),
      reading("TEMP_C", 2.0),
    ];
    expect(evaluateHealth("REFRIGERATOR", readings).status).toBe("HEALTHY");
  });

  it("computes the trend only over TEMP_C readings, ignoring interleaved metrics", () => {
    // Real telemetry interleaves metrics. The trend must filter to TEMP_C only;
    // the DOOR_OPEN rows here must not corrupt the +2.0 temperature trend.
    const readings = [
      reading("TEMP_C", 4.0),
      reading("DOOR_OPEN", 1),
      reading("TEMP_C", 3.0),
      reading("DOOR_OPEN", 0),
      reading("TEMP_C", 2.5),
      reading("TEMP_C", 2.0),
    ];
    const h = evaluateHealth("REFRIGERATOR", readings);
    expect(h.status).toBe("WARNING");
    expect(h.reason).toContain("compressor wear");
  });

  it("does not flag a flat or cooling fridge", () => {
    // A steady/declining temperature has trend <= 0, so no false positive.
    const readings = [
      reading("TEMP_C", 2.0),
      reading("TEMP_C", 2.5),
      reading("TEMP_C", 3.0),
      reading("TEMP_C", 3.5),
    ];
    expect(evaluateHealth("REFRIGERATOR", readings).status).toBe("HEALTHY");
  });

  it("lets a real overheat win: critical absolute temp is reported regardless", () => {
    // Even mid-trend, if the newest temp is already unsafe the predictive branch
    // still fires first when trend>1.5 — here trend is small so the CRITICAL
    // threshold applies. Confirms an actually-too-warm fridge is caught.
    const readings = [
      reading("TEMP_C", 8.0),
      reading("TEMP_C", 7.9),
      reading("TEMP_C", 7.8),
      reading("TEMP_C", 7.7),
    ];
    const h = evaluateHealth("REFRIGERATOR", readings);
    expect(h.status).toBe("CRITICAL");
  });
});

describe("evaluateHealth — DRYER thresholds", () => {
  it("is HEALTHY at exactly 75°C (boundary)", () => {
    expect(evaluateHealth("DRYER", [reading("TEMP_C", 75)]).status).toBe("HEALTHY");
  });
  it("WARNS just above 75°C", () => {
    expect(evaluateHealth("DRYER", [reading("TEMP_C", 75.1)]).status).toBe("WARNING");
  });
  it("still WARNS at exactly 90°C (boundary)", () => {
    expect(evaluateHealth("DRYER", [reading("TEMP_C", 90)]).status).toBe("WARNING");
  });
  it("is CRITICAL above 90°C — fire hazard", () => {
    const h = evaluateHealth("DRYER", [reading("TEMP_C", 90.1)]);
    expect(h.status).toBe("CRITICAL");
    expect(h.reason).toContain("fire hazard");
  });
});

describe("evaluateHealth — WASHER vibration thresholds", () => {
  it("is HEALTHY at exactly 8 mm/s (boundary)", () => {
    expect(evaluateHealth("WASHER", [reading("VIBRATION_MM_S", 8)]).status).toBe("HEALTHY");
  });
  it("WARNS just above 8 mm/s — unbalanced load", () => {
    expect(evaluateHealth("WASHER", [reading("VIBRATION_MM_S", 8.1)]).status).toBe("WARNING");
  });
  it("still WARNS at exactly 12 mm/s (boundary)", () => {
    expect(evaluateHealth("WASHER", [reading("VIBRATION_MM_S", 12)]).status).toBe("WARNING");
  });
  it("is CRITICAL above 12 mm/s — stop & rebalance", () => {
    const h = evaluateHealth("WASHER", [reading("VIBRATION_MM_S", 12.1)]);
    expect(h.status).toBe("CRITICAL");
    expect(h.metric).toBe("VIBRATION_MM_S");
  });
});

describe("evaluateHealth — OVEN thresholds", () => {
  it("is HEALTHY at exactly 260°C (boundary)", () => {
    expect(evaluateHealth("OVEN", [reading("TEMP_C", 260)]).status).toBe("HEALTHY");
  });
  it("WARNS just above 260°C", () => {
    expect(evaluateHealth("OVEN", [reading("TEMP_C", 260.1)]).status).toBe("WARNING");
  });
  it("still WARNS at exactly 300°C (boundary)", () => {
    expect(evaluateHealth("OVEN", [reading("TEMP_C", 300)]).status).toBe("WARNING");
  });
  it("is CRITICAL above 300°C — temperature runaway", () => {
    const h = evaluateHealth("OVEN", [reading("TEMP_C", 300.1)]);
    expect(h.status).toBe("CRITICAL");
    expect(h.reason).toContain("runaway");
  });
});

describe("evaluateHealth — unknown appliance type", () => {
  it("falls back to HEALTHY and echoes the latest metric for unrecognized types", () => {
    // Defensive default: bad/unknown type from the DB must not throw; we report
    // the device as operating normally using whatever metric it last sent.
    const h = evaluateHealth("TOASTER", [reading("POWER_W", 800)]);
    expect(h.status).toBe("HEALTHY");
    expect(h.metric).toBe("POWER_W");
    expect(h.value).toBe(800);
  });
});
