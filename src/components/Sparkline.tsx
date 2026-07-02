// Tiny SVG sparkline of recent readings — real telemetry, no chart lib.
// Points are chronological; the last point is dotted in the status color.
import type { Status } from "@/lib/health";

export default function Sparkline({ points, status }: { points: number[]; status: Status }) {
  if (points.length < 2) return null;

  const w = 132, h = 32, pad = 3;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = (w - pad * 2) / (points.length - 1);
  const xy = points.map((v, i) => [
    pad + i * step,
    h - pad - ((v - min) / span) * (h - pad * 2),
  ]);
  const [lx, ly] = xy[xy.length - 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="shq-spark" aria-hidden="true">
      <polyline
        points={xy.map(([x, y]) => `${x},${y}`).join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lx} cy={ly} r={2.5} fill={`var(--st-${status.toLowerCase()}-dot)`} />
    </svg>
  );
}
