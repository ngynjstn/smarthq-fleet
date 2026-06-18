const API_URL = "http://localhost:3000/api/telemetry";
const APPLIANCE_ID = "fridge-001";
const SETPOINT_C = 3.5; // a fridge targets ~3.5°C

let temp = SETPOINT_C;

// Produce a realistic next temperature: a "random walk" that drifts a bit
// each tick but is gently pulled back toward the setpoint — like a real
// fridge's compressor cycling on and off around its target.
function nextTemp(): number {
  const drift = (Math.random() - 0.5) * 0.6;        // ±0.3°C of noise
  const pullBack = (SETPOINT_C - temp) * 0.1;       // tug toward setpoint
  temp = Number((temp + drift + pullBack).toFixed(2));
  return temp;
}

async function sendReading(): Promise<void> {
  const value = nextTemp();
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applianceId: APPLIANCE_ID,
        metric: "TEMP_C",
        value,
      }),
    });

    if (!res.ok) {
      // The cloud rejected us — log why (e.g. validation failure).
      console.error(`Rejected (${res.status}):`, await res.text());
    } else {
      console.log(`TEMP_C = ${value}°C`);
    }
  } catch (err) {
    // The cloud was unreachable (server down, network gone). A real device
    // must survive this, not crash. For now we just log and keep going.
    console.error("Could not reach API:", (err as Error).message);
  }
}

console.log("Fridge simulator started — posting every 3s. Ctrl+C to stop.");
sendReading();                    // send one immediately
setInterval(sendReading, 3000);   // then every 3 seconds
