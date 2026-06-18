const API_URL = "http://localhost:3000/api/telemetry";

type Device = {
  id: string;
  metric: string;
  setpoint: number;       // normal target
  faultSetpoint: number;  // target when this device is "faulted"
  jitter: number;
  pull: number;
  value: number;          // current reading — mutable state we can steer
};

const devices: Device[] = [
  { id: "fridge-001", metric: "TEMP_C",         setpoint: 3.5, faultSetpoint: 9,   jitter: 0.6, pull: 0.1,  value: 3.5 },
  { id: "dryer-001",  metric: "TEMP_C",         setpoint: 60,  faultSetpoint: 95,  jitter: 4,   pull: 0.1,  value: 60  },
  { id: "washer-001", metric: "VIBRATION_MM_S", setpoint: 2,   faultSetpoint: 14,  jitter: 1.2, pull: 0.15, value: 2   },
  { id: "oven-001",   metric: "TEMP_C",         setpoint: 190, faultSetpoint: 320, jitter: 6,   pull: 0.1,  value: 190 },
];

// Any appliance ids passed as command-line args are "faulted": they drift
// toward faultSetpoint instead of setpoint.
//   npx tsx simulator/fleet.ts dryer-001 fridge-001
const faulted = new Set(process.argv.slice(2));

// Mean-reverting walk toward whichever target is active right now.
function step(d: Device): number {
  const target = faulted.has(d.id) ? d.faultSetpoint : d.setpoint;
  const drift = (Math.random() - 0.5) * d.jitter;
  const pullBack = (target - d.value) * d.pull;
  d.value = Number((d.value + drift + pullBack).toFixed(2));
  return d.value;
}

async function post(d: Device): Promise<void> {
  const value = step(d);
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applianceId: d.id, metric: d.metric, value }),
    });
    if (!res.ok) {
      console.error(`✗ ${d.id} rejected (${res.status}):`, await res.text());
    } else {
      console.log(`✓ ${d.id} ${d.metric}=${value}${faulted.has(d.id) ? "  ⚠FAULT" : ""}`);
    }
  } catch (err) {
    console.error(`✗ ${d.id} unreachable:`, (err as Error).message);
  }
}

function tick(): void {
  for (const d of devices) post(d);
}

if (faulted.size > 0) console.log("Faulting:", [...faulted].join(", "));
console.log("Fleet simulator started — posting every 3s. Ctrl+C to stop.");
tick();
setInterval(tick, 3000);
