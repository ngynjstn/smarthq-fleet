// src/app/business/page.tsx
"use client";

import { useEffect, useState } from "react";

type Status = "HEALTHY" | "WARNING" | "CRITICAL" | "OFFLINE";

type BusinessUnit = {
  id: string;
  name: string;
  type: string;
  status: Status;
  savings: number;
  atRisk: number;
};

type BusinessSummary = {
  totalUnits: number;
  offline: number;
  criticalNow: number;
  issuesCaughtEarly: number;
  uptimePct: number;
  estimatedSavings: number;
  costAtRisk: number;
  units: BusinessUnit[];
};

// Format a number as whole-dollar USD, e.g. 650 -> "$650".
const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const STATUS_BADGE: Record<Status, string> = {
  HEALTHY:  "bg-green-100 text-green-800",
  WARNING:  "bg-amber-100 text-amber-800",
  CRITICAL: "bg-red-100 text-red-800",
  OFFLINE:  "bg-gray-100 text-gray-600",
};

export default function BusinessView() {
  const [data, setData] = useState<BusinessSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/business");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setData(await res.json());
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
  if (!data) return <main className="p-8">Loading…</main>;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fleet Business Impact</h1>
            <p className="text-gray-500">What the connected fleet is worth, in dollars</p>
          </div>
          <a href="/" className="text-sm text-blue-600 hover:underline">← Ops view</a>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Estimated savings" value={usd(data.estimatedSavings)}
               sub={`${data.issuesCaughtEarly} issue(s) caught early`} accent="text-green-700" />
          <Kpi label="Cost at risk" value={usd(data.costAtRisk)}
               sub={`${data.criticalNow} critical now`} accent="text-red-700" />
          <Kpi label="Fleet uptime" value={`${data.uptimePct}%`}
               sub={`${data.offline} offline`} accent="text-gray-900" />
          <Kpi label="Units monitored" value={String(data.totalUnits)}
               sub="connected appliances" accent="text-gray-900" />
        </div>

        <div className="mt-6 overflow-hidden rounded-xl bg-white shadow">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">Appliance</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Savings captured</th>
                <th className="px-5 py-3 text-right">Cost at risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.units.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900">{u.name}</div>
                    <div className="text-xs text-gray-400">{u.type}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[u.status]}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-green-700">{u.savings ? usd(u.savings) : "—"}</td>
                  <td className="px-5 py-3 text-right text-red-700">{u.atRisk ? usd(u.atRisk) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-gray-400">
          Savings = avoided emergency premium when an issue is caught early.
          Cost at risk = emergency-repair exposure of units currently critical.
          Figures from the cost model in src/lib/costs.ts.
        </p>
      </div>
    </main>
  );
}

function Kpi({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`mt-2 text-3xl font-bold ${accent}`}>{value}</div>
      <div className="mt-1 text-xs text-gray-400">{sub}</div>
    </div>
  );
}
