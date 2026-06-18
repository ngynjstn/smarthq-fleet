"use client";

import { useEffect, useState } from "react";

type Reading = {
  id: string;
  metric: string;
  value: number;
  recordedAt: string;
};

type Appliance = {
  id: string;
  name: string;
  type: string;
  model: string;
  readings: Reading[];
};

export default function Dashboard() {
  const [appliance, setAppliance] = useState<Appliance | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/appliances/fridge-001");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setAppliance(await res.json());
        setError(null);
      } catch (e) {
        setError((e as Error).message);
      }
    }

    load();                                   // fetch immediately on mount
    const interval = setInterval(load, 3000); // then every 3s
    return () => clearInterval(interval);     // cleanup: stop polling on unmount
  }, []);

  if (error) return <main className="p-8 text-red-600">Error: {error}</main>;
  if (!appliance) return <main className="p-8">Loading…</main>;

  // readings come back newest-first, so the first TEMP_C is the latest.
  const latestTemp = appliance.readings.find((r) => r.metric === "TEMP_C");

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900">SmartHQ Fleet</h1>
        <p className="text-gray-500">Connected appliance monitor</p>

        <div className="mt-6 rounded-xl bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{appliance.name}</h2>
              <p className="text-sm text-gray-500">
                {appliance.type} · {appliance.model}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-600">
                {latestTemp ? `${latestTemp.value}°C` : "—"}
              </div>
              <div className="text-xs text-gray-400">current temp</div>
            </div>
          </div>

          <h3 className="mt-6 text-sm font-medium text-gray-700">Recent readings</h3>
          <ul className="mt-2 divide-y divide-gray-100">
            {appliance.readings.map((r) => (
              <li key={r.id} className="grid grid-cols-3 py-1 text-sm">
                <span className="text-gray-600">{r.metric}</span>
                <span className="font-mono">{r.value}</span>
                <span className="text-right text-gray-400">
                  {new Date(r.recordedAt).toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
