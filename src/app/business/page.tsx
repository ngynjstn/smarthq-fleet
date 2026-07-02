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

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const tint = (s: Status) => `var(--st-${s.toLowerCase()}-dot)`;

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

  if (error)
    return (
      <main className="shq-page shq-page--narrow">
        <p style={{ color: "var(--st-critical-fg)" }}>Error: {error}</p>
      </main>
    );

  const rows = data ? [...data.units].sort((a, b) => b.atRisk - a.atRisk) : [];

  const stats = data
    ? [
        { label: "Estimated savings", value: usd(data.estimatedSavings), note: `${data.issuesCaughtEarly} issue(s) caught early`, color: data.estimatedSavings ? "var(--st-healthy-fg)" : "var(--text)" },
        { label: "Cost at risk", value: usd(data.costAtRisk), note: `${data.criticalNow} critical now`, color: data.costAtRisk ? "var(--st-critical-fg)" : "var(--text)" },
        { label: "Fleet uptime", value: `${data.uptimePct}%`, note: `${data.offline} offline`, color: "var(--text)" },
        { label: "Units monitored", value: String(data.totalUnits), note: "connected appliances", color: "var(--text)" },
      ]
    : null;

  return (
    <main>
      <div className="shq-page shq-page--narrow">
        <div style={{ marginBottom: 26 }}>
          <p className="shq-kicker" style={{ margin: 0 }}>Business / Impact</p>
          <h1 className="shq-h1">What the fleet is worth</h1>
          <p className="shq-sub">Savings captured and cost exposure, computed live from the same health verdicts the Ops view runs on.</p>
        </div>

        {/* stat strip */}
        {stats ? (
          <div className="shq-stats">
            {stats.map((k) => (
              <div key={k.label} className="shq-stat">
                <p className="shq-micro" style={{ margin: 0 }}>{k.label}</p>
                <p className="shq-stat-value" style={{ color: k.color }}>{k.value}</p>
                <p className="shq-stat-note">{k.note}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="shq-skel" style={{ height: 110, marginBottom: 28 }} />
        )}

        {/* ledger */}
        <div className="shq-panel">
          <div className="shq-panel-head">
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Appliance ledger</h2>
            {data && (
              <span className="shq-micro">{data.totalUnits} units · ranked by exposure</span>
            )}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="shq-table">
              <thead>
                <tr>
                  <th>Appliance</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Savings captured</th>
                  <th style={{ textAlign: "right" }}>Cost at risk</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <span style={{ fontWeight: 600, color: "var(--text)" }}>{u.name}</span>
                        <span className="shq-micro">{u.type}</span>
                      </div>
                    </td>
                    <td>
                      <span className="shq-badge" style={{ color: `var(--st-${u.status.toLowerCase()}-fg)`, background: `var(--st-${u.status.toLowerCase()}-bg)` }}>
                        <span className="shq-badge-dot" style={{ background: tint(u.status) }} />
                        {u.status}
                      </span>
                    </td>
                    <td className="shq-num" style={{ textAlign: "right", color: u.savings ? "var(--st-healthy-fg)" : "var(--text-3)" }}>
                      {u.savings ? usd(u.savings) : "—"}
                    </td>
                    <td className="shq-num" style={{ textAlign: "right", color: u.atRisk ? "var(--st-critical-fg)" : "var(--text-3)" }}>
                      {u.atRisk ? usd(u.atRisk) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p style={{ marginTop: 16, fontSize: 12, color: "var(--text-3)", maxWidth: 640, lineHeight: 1.5 }}>
          Savings = avoided emergency premium when an issue is caught early. Cost at risk =
          emergency-repair exposure of units currently critical. Figures from the cost model in
          src/lib/costs.ts.
        </p>
      </div>
    </main>
  );
}
