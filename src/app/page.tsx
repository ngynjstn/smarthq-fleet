"use client";

import { useEffect, useState } from "react";
import TelemetrySimulator from "@/components/TelemetrySimulator";
import ApplianceVisual from "@/components/ApplianceVisual";
import Sparkline from "@/components/Sparkline";

type Status = "HEALTHY" | "WARNING" | "CRITICAL" | "OFFLINE";

type Reading = { metric: string; value: number; recordedAt: string };

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
  readings: Reading[]; // newest-first, from the API
  health: Health;
};

const SEGMENTS: { key: Status; label: string }[] = [
  { key: "HEALTHY", label: "Healthy" },
  { key: "WARNING", label: "Warning" },
  { key: "CRITICAL", label: "Critical" },
  { key: "OFFLINE", label: "Offline" },
];

const UNIT: Record<string, string> = {
  TEMP_C: "°C",
  VIBRATION_MM_S: "mm/s",
};

const tint = (s: Status) => `var(--st-${s.toLowerCase()}-dot)`;

function ago(iso: string): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export default function Dashboard() {
  const [fleet, setFleet] = useState<Appliance[] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Status | "all">("all");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/appliances");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setFleet(await res.json());
        setUpdatedAt(new Date());
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
        {/* kicker + title + live meta */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <p className="shq-kicker" style={{ margin: 0 }}>Ops / Fleet monitor</p>
            <h1 className="shq-h1">Fleet overview</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, paddingBottom: 4 }}>
            <span className="shq-livedot" />
            <span className="shq-mono" style={{ fontSize: 11.5, color: "var(--text-2)", fontVariantNumeric: "tabular-nums" }}>
              LIVE{updatedAt ? ` · UPDATED ${updatedAt.toLocaleTimeString("en-US", { hour12: false })}` : ""}
            </span>
          </div>
        </div>

        {/* command strip: unit count + status filter chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", margin: "22px 0 26px", paddingBottom: 18, borderBottom: "1px solid var(--border)" }}>
          <span className="shq-micro">{fleet?.length ?? 0} units</span>
          <div className="shq-chipbar">
            {SEGMENTS.map((seg) => (
              <button
                key={seg.key}
                className="shq-statchip"
                data-active={filter === seg.key}
                onClick={() => setFilter((f) => (f === seg.key ? "all" : seg.key))}
                style={{
                  ["--chip-tint" as string]: tint(seg.key),
                  ["--chip-bg" as string]: `var(--st-${seg.key.toLowerCase()}-bg)`,
                }}
              >
                <span className="d" />
                <span className="n">{counts[seg.key]}</span>
                {seg.label}
              </button>
            ))}
          </div>
          {filter !== "all" && (
            <button
              onClick={() => setFilter("all")}
              className="shq-mono"
              style={{ appearance: "none", cursor: "pointer", fontSize: 11, color: "var(--text-2)", background: "none", border: "none", padding: 4, textDecoration: "underline", textUnderlineOffset: 3 }}
            >
              clear ✕
            </button>
          )}
        </div>

        {error && (
          <div className="shq-empty" style={{ borderColor: "var(--st-critical-dot)", marginBottom: 16 }}>
            <p style={{ margin: 0, fontWeight: 600, color: "var(--st-critical-fg)" }}>Couldn’t reach the fleet</p>
            <p className="shq-sub" style={{ maxWidth: 340 }}>{error}</p>
          </div>
        )}

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
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
              No {filter.toLowerCase()} appliances
            </p>
            <p className="shq-sub" style={{ maxWidth: 340 }}>
              Nothing matches this status right now. Try another segment or clear the filter.
            </p>
            <button className="shq-btn-ghost" style={{ marginTop: 16 }} onClick={() => setFilter("all")}>
              Show all
            </button>
          </div>
        )}

        {/* instrument tiles */}
        {fleet && visible.length > 0 && (
          <div className="shq-cards">
            {visible.map((a) => {
              const s = a.health.status;
              // chronological values of the metric the verdict is based on
              const series = a.health.metric
                ? a.readings.filter((r) => r.metric === a.health.metric).map((r) => r.value).reverse()
                : [];
              const latest = a.readings[0];
              return (
                <article key={a.id} className="shq-tile">
                  <span className="shq-tile-rail" style={{ background: tint(s) }} />

                  <div className="shq-tile-head">
                    <div style={{ minWidth: 0 }}>
                      <h2 className="shq-tile-name">{a.name}</h2>
                      <p className="shq-tile-model">{a.type} · {a.model}</p>
                    </div>
                    <span className="shq-badge" style={{ color: `var(--st-${s.toLowerCase()}-fg)`, background: `var(--st-${s.toLowerCase()}-bg)`, flexShrink: 0 }}>
                      <span className="shq-badge-dot" style={{ background: tint(s) }} />
                      {s}
                    </span>
                  </div>

                  <div className="shq-tile-main">
                    <div style={{ minWidth: 0 }}>
                      <div className="shq-tile-value">
                        <span className="v">{a.health.value ?? "—"}</span>
                        <span className="u">{a.health.metric ? UNIT[a.health.metric] ?? "" : ""}</span>
                      </div>
                      <Sparkline points={series} status={s} />
                      <p className="shq-micro" style={{ margin: "8px 0 0" }}>
                        {a.health.metric ?? "no signal"}
                        {series.length > 1 ? ` · ${series.length} pts` : ""}
                        {latest ? ` · ${ago(latest.recordedAt)}` : ""}
                      </p>
                    </div>
                    <ApplianceVisual type={a.type} status={s} />
                  </div>

                  <p className="shq-tile-note">
                    <span style={{ textWrap: "pretty" }}>{a.health.reason}</span>
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
