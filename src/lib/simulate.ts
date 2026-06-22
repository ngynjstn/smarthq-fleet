// src/lib/simulate.ts
// Pure simulator: given an appliance type, produce a plausible reading.
// Mostly healthy, with the occasional WARNING/CRITICAL so the live demo
// shows variety. Bands are tuned to the thresholds in health.ts.

type Band = [number, number];
type Profile = { metric: string; healthy: Band; warning: Band; critical: Band };

const PROFILES: Record<string, Profile> = {
  //REFRIGERATOR: { metric: "TEMP_C",         healthy: [2, 5],     warning: [5.5, 7],   critical: [7.5, 10]  },
  DRYER:        { metric: "TEMP_C",         healthy: [45, 70],   warning: [76, 89],   critical: [91, 105]  },
  WASHER:       { metric: "VIBRATION_MM_S", healthy: [2, 7],     warning: [8.5, 11],  critical: [12.5, 16] },
  OVEN:         { metric: "TEMP_C",         healthy: [180, 250], warning: [265, 295], critical: [305, 330] },
};

function rand([lo, hi]: Band): number {
  return Math.round((lo + Math.random() * (hi - lo)) * 10) / 10;
}

// One fridge slowly drifts upward over several ticks to exercise the
// PREDICTIVE compressor-wear trend in health.ts, then resets. Temps stay
// in the safe (<7) range the whole time, so only the *trend* flags it —
// that's the early catch the dashboard exists to show off.
let fridgeTick = 0;
function fridgeTemp(): number {
  const cycle = fridgeTick++ % 12;                 // 12-tick sawtooth (~60s)
  if (cycle < 8) return Math.round((2 + cycle * 0.5) * 10) / 10; // ~2.0 → 5.5 rising
  return rand([2, 4]);                             // healthy baseline between ramps
}

export function simulateReading(type: string): { metric: string; value: number } {
  // The refrigerator is our predictive-maintenance showcase: a gradual
  // upward temp trend health.ts catches before it crosses any limit.
  if (type === "REFRIGERATOR") return { metric: "TEMP_C", value: fridgeTemp() };

  const p = PROFILES[type];
  if (!p) return { metric: "TEMP_C", value: 20 };

  const r = Math.random();
  const band = r < 0.8 ? p.healthy : r < 0.95 ? p.warning : p.critical;
  return { metric: p.metric, value: rand(band) };
}

