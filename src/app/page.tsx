"use client";

import { useEffect, useState } from "react";

type Status = "HEALTHY" | "WARNING" | "CRITICAL" | "OFFLINE";

type Health = {
  status: Status;
  reason: string;
  metric: string | null;
  value: number | null;
};

type Appliance = {
  id: string;
  name: string;
  type: string;
  model: string;
  health: Health;
};

// Map each status to its styles ONCE, instead of scattering if/else in the JSX.
const STATUS_STYLES: Record<Status, { dot: string; badge: string; ring: string }> = {
  HEALTHY:  { dot: "bg-green-500", badge: "bg-green-100 text-green-800", ring: "" },
  WARNING:  { dot: "bg-amber-500", badge: "bg-amber-100 text-amber-800", ring: "ring-2 ring-amber-300" },
  CRITICAL: { dot: "bg-red-500",   badge: "bg-red-100 text-red-800",     ring: "ring-2 ring-red-400" },
  OFFLINE:  { dot: "bg-gray-400",  badge: "bg-gray-100 text-gray-600",   ring: "" },
};

export default function Dashboard() {
  const [fleet, setFleet] = useState<Appliance[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/appliances");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setFleet(await res.json());
        setError(null);
      } catch (e) {
        setError((e as Error).message);
      }
    }
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  if (error) return <main className="p-8 text-red-600">Error: {error}</main>;
  if (!fleet) return <main className="p-8">Loading…</main>;

  // Tally how many appliances are in each status for the summary bar.
  const counts = fleet.reduce(
    (acc, a) => {
      acc[a.health.status]++;
      return acc;
    },
    { HEALTHY: 0, WARNING: 0, CRITICAL: 0, OFFLINE: 0 } as Record<Status, number>
  );

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-gray-900">SmartHQ Fleet</h1>
        <p className="text-gray-500">Connected appliance monitor</p>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Summary label="Healthy" n={counts.HEALTHY} color="text-green-700" />
          <Summary label="Warning" n={counts.WARNING} color="text-amber-700" />
          <Summary label="Critical" n={counts.CRITICAL} color="text-red-700" />
          <Summary label="Offline" n={counts.OFFLINE} color="text-gray-500" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fleet.map((a) => {
            const s = STATUS_STYLES[a.health.status];
            return (
              <div key={a.id} className={`rounded-xl bg-white p-5 shadow ${s.ring}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">{a.name}</h2>
                    <p className="text-xs text-gray-500">{a.type} · {a.model}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.badge}`}>
                    <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                    {a.health.status}
                  </span>
                </div>

                <div className="mt-4 text-3xl font-bold text-gray-900">
                  {a.health.value ?? "—"}
                  <span className="ml-1 text-sm font-normal text-gray-400">{a.health.metric}</span>
                </div>

                <p className="mt-3 text-sm text-gray-600">{a.health.reason}</p>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function Summary({ label, n, color }: { label: string; n: number; color: string }) {
  return (
    <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
      <span className={`text-lg font-bold ${color}`}>{n}</span>{" "}
      <span className="text-gray-500">{label}</span>
    </div>
  );
}
