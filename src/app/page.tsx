"use client";

import { useEffect, useState } from "react";
import TelemetrySimulator from "@/components/TelemetrySimulator";
import ApplianceVisual from "@/components/ApplianceVisual";

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

const SEGMENTS: { key: Status; label: string }[] = [
  { key: "HEALTHY", label: "Healthy" },
  { key: "WARNING", label: "Warning" },
  { key: "CRITICAL", label: "Critical" },
  { key: "OFFLINE", label: "Offline" },
];

// metric code -> display unit
const UNIT: Record<string, string> = {
  TEMP_C: "°C",
  VIBRATION_MM_S: "mm/s",
};

const tint = (s: Status) => `var(--st-${s.toLowerCase()}-dot)`;
const prettyType = (t: string) => t.charAt(0) + t.slice(1).toLowerCase();

export default function Dashboard() {
  const [fleet, setFleet] = useState<Appliance[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Status | "all">("all");

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

  const counts = (fleet ?? []).reduce(
    (acc, a) => {
      acc[a.health.status]++;
      return acc;
    },
    { HEALTHY: 0, WARNING: 0, CRITICAL: 0, OFFLINE: 0 } as Record<Status, number>
  );

  const visible =
    filter === "all" ? fleet ?? [] : (fleet ?? []).filter((a) => a.health.status === filter);

  return (
    <main>
      <TelemetrySimulator />
      <div className="shq-page">
        {/* header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 24 }}>
          <div>
            <h1 className="shq-h1">Fleet overview</h1>
            <p className="shq-sub">
              Real-time health across {fleet?.length ?? 0} connected appliances
            </p>
          </div>
          <span className="shq-livepill">
            <span className="shq-livedot" />
            Live · updates every 3s
          </span>
        </div>

        {error && (
          <div className="shq-empty" style={{ borderColor: "var(--st-critical-dot)" }}>
            <p style={{ margin: 0, fontWeight: 600, color: "var(--st-critical-fg)" }}>Couldn’t reach the fleet</p>
            <p className="shq-sub" style={{ maxWidth: 340 }}>{error}</p>
          </div>
        )}

        {/* status segments / filter */}
        <div className="shq-segs">
          {SEGMENTS.map((seg) => {
            const active = filter === seg.key;
            return (
              <button
                key={seg.key}
                className="shq-seg"
                data-active={active}
                onClick={() => setFilter((f) => (f === seg.key ? "all" : seg.key))}
                style={
                  active
                    ? { borderColor: tint(seg.key), background: `var(--st-${seg.key.toLowerCase()}-bg)` }
                    : undefined
                }
              >
                <span
                  className="shq-seg-dot"
                  style={{ background: tint(seg.key), boxShadow: `0 0 0 4px var(--st-${seg.key.toLowerCase()}-bg)` }}
                />
                <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <span className="shq-seg-count">{counts[seg.key]}</span>
                  <span className="shq-seg-label">{seg.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* results row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, minHeight: 24 }}>
          <span style={{ fontSize: 13, color: "var(--text-2)" }}>
            {filter === "all"
              ? `Showing all ${fleet?.length ?? 0} appliances`
              : `Showing ${visible.length} ${filter.toLowerCase()} of ${fleet?.length ?? 0} appliances`}
          </span>
          {filter !== "all" && (
            <button
              onClick={() => setFilter("all")}
              style={{ appearance: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 500, color: "var(--accent)", background: "none", border: "none", padding: "4px 6px", borderRadius: 6 }}
            >
              Clear filter ✕
            </button>
          )}
        </div>

        {/* loading skeletons */}
        {!fleet && !error && (
          <div className="shq-cards">
            {[0, 1, 2, 3].map((k) => (
              <div key={k} className="shq-skel" />
            ))}
          </div>
        )}

        {/* empty state */}
        {fleet && visible.length === 0 && (
          <div className="shq-empty">
            <div style={{ width: 46, height: 46, borderRadius: 13, background: "var(--surface-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <span style={{ width: 12, height: 12, borderRadius: 999, border: "2px solid var(--text-3)" }} />
            </div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
              No {filter.toLowerCase()} appliances
            </p>
            <p className="shq-sub" style={{ maxWidth: 340 }}>
              Nothing matches this status right now. Try another segment or clear the filter.
            </p>
            <button className="shq-btn-ghost" style={{ marginTop: 16 }} onClick={() => setFilter("all")}>
              Show all appliances
            </button>
          </div>
        )}

        {/* cards */}
        {fleet && visible.length > 0 && (
          <div className="shq-cards">
            {visible.map((a) => {
              const s = a.health.status;
              return (
                <div key={a.id} className="shq-card">
                  <span className="shq-card-accent" style={{ background: tint(s) }} />
                  <ApplianceVisual type={a.type} status={s} />
                  <div className="shq-card-body">
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <p className="shq-card-name">{a.name}</p>
                        <p className="shq-card-meta">{prettyType(a.type)} · {a.model}</p>
                      </div>
                      <span
                        className="shq-badge"
                        style={{ color: `var(--st-${s.toLowerCase()}-fg)`, background: `var(--st-${s.toLowerCase()}-bg)`, flexShrink: 0 }}
                      >
                        <span className="shq-badge-dot" style={{ background: tint(s) }} />
                        {s}
                      </span>
                    </div>

                    <div className="shq-card-metric">
                      <span className="shq-card-value">
                        {a.health.value ?? "—"}
                      </span>
                      <span className="shq-card-unit">
                        {a.health.metric ? UNIT[a.health.metric] ?? "" : ""}
                      </span>
                    </div>

                    <p className="shq-card-reason">
                      <span className="shq-card-reason-dot" style={{ background: tint(s) }} />
                      <span style={{ textWrap: "pretty" }}>{a.health.reason}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
