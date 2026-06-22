"use client";

import { useEffect } from "react";
import { simulateReading } from "@/lib/simulate";

// Acts as N simulated devices: every 5s each appliance POSTs a fresh
// reading to the same /api/telemetry endpoint a real device would use,
// keeping the deployed fleet "live". Renders nothing.
export default function TelemetrySimulator() {
  useEffect(() => {
    let fleet: { id: string; type: string }[] = [];

    async function tick() {
      if (fleet.length === 0) {
        const res = await fetch("/api/appliances");
        if (!res.ok) return;
        const data = await res.json();
        fleet = data.map((a: { id: string; type: string }) => ({ id: a.id, type: a.type }));
      }
      await Promise.all(
        fleet.map((a) => {
          const { metric, value } = simulateReading(a.type);
          return fetch("/api/telemetry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ applianceId: a.id, metric, value }),
          });
        })
      );
    }

    tick();
    const interval = setInterval(tick, 5000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
