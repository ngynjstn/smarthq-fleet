export type Status = "HEALTHY" | "WARNING" | "CRITICAL" | "OFFLINE";

export type Reading = {
  metric: string;
  value: number;
  recordedAt: string | Date;
};

export type Health = {
  status: Status;
  reason: string;        // human-readable, actionable
  metric: string | null; // which metric we judged on
  value: number | null;  // its latest value
};

// If we haven't heard from a device in this long, treat it as offline.
const STALE_MS = 30_000;

// PURE function: data in, verdict out. No DB, no network, no surprises.
// `readings` is newest-first (that's how our API returns them).
export function evaluateHealth(type: string, readings: Reading[]): Health {
  const latest = readings[0];

  // No data, or data too old → the device isn't really reporting.
  if (!latest) {
    return { status: "OFFLINE", reason: "No readings received", metric: null, value: null };
  }
  const ageMs = Date.now() - new Date(latest.recordedAt).getTime();
  if (ageMs > STALE_MS) {
    return { status: "OFFLINE", reason: "No recent readings", metric: latest.metric, value: latest.value };
  }

  const value = latest.value;

  switch (type) {
    case "REFRIGERATOR": {
      // PREDICTIVE: even if temp is still in range, a sustained upward
      // trend can mean the compressor is degrading. Catch it BEFORE it fails.
      const trend = temperatureTrend(readings);
      if (trend !== null && trend > 1.5) {
        return warn("TEMP_C", value,
          `Temp rising (+${trend.toFixed(1)}°C trend) — possible compressor wear`);
      }
      if (value > 7) return crit("TEMP_C", value, `Too warm (${value}°C) — food safety risk`);
      if (value > 5 || value < 1) return warn("TEMP_C", value, `Out of ideal range (${value}°C)`);
      return ok("TEMP_C", value);
    }

    case "DRYER": {
      if (value > 90) return crit("TEMP_C", value, `Overheating (${value}°C) — fire hazard, check lint`);
      if (value > 75) return warn("TEMP_C", value, `Running hot (${value}°C)`);
      return ok("TEMP_C", value);
    }

    case "WASHER": {
      if (value > 12) return crit("VIBRATION_MM_S", value, `Severe vibration (${value} mm/s) — stop & rebalance`);
      if (value > 8)  return warn("VIBRATION_MM_S", value, `High vibration (${value} mm/s) — unbalanced load`);
      return ok("VIBRATION_MM_S", value);
    }

    case "OVEN": {
      if (value > 300) return crit("TEMP_C", value, `Temperature runaway (${value}°C)`);
      if (value > 260) return warn("TEMP_C", value, `Above safe range (${value}°C)`);
      return ok("TEMP_C", value);
    }

    default:
      return ok(latest.metric, value);
  }
}

// --- tiny helpers so the rules above read like English ---
function ok(metric: string, value: number): Health {
  return { status: "HEALTHY", reason: "Operating normally", metric, value };
}
function warn(metric: string, value: number, reason: string): Health {
  return { status: "WARNING", reason, metric, value };
}
function crit(metric: string, value: number, reason: string): Health {
  return { status: "CRITICAL", reason, metric, value };
}

// Estimate temperature change across the recent window:
// newest minus oldest of the last 6 TEMP_C readings. Positive = warming up.
function temperatureTrend(readings: Reading[]): number | null {
  const temps = readings.filter((r) => r.metric === "TEMP_C").slice(0, 6);
  if (temps.length < 4) return null; // need enough points to call it a trend
  return temps[0].value - temps[temps.length - 1].value;
}
