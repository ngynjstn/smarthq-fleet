// Animated SVG schematics for each appliance type. Pure presentation —
// all motion is CSS (see globals.css .shq-eq*). The animation maps to each
// appliance's real failure mode so the picture *means* something:
//   REFRIGERATOR -> heat waves rise as temp/compressor-wear climbs
//   WASHER       -> drum spins + whole unit shakes with vibration
//   DRYER        -> drum tumbles + heat waves (overheat = faster/redder)
//   OVEN         -> element glow + heat runaway
import type { Status } from "@/lib/health";

const STATUS_CLASS: Record<Status, string> = {
  HEALTHY: "shq-eq--healthy",
  WARNING: "shq-eq--warning",
  CRITICAL: "shq-eq--critical",
  OFFLINE: "shq-eq--offline",
};

export default function ApplianceVisual({
  type,
  status,
}: {
  type: string;
  status: Status;
}) {
  return (
    <div
      className={`shq-eq ${STATUS_CLASS[status]}`}
      role="img"
      aria-label={`${type.toLowerCase()} — ${status.toLowerCase()}`}
    >
      <Schematic type={type} />
    </div>
  );
}

function Schematic({ type }: { type: string }) {
  switch (type) {
    case "REFRIGERATOR":
      return <Refrigerator />;
    case "WASHER":
      return <Washer />;
    case "DRYER":
      return <Dryer />;
    case "OVEN":
      return <Oven />;
    default:
      return <Refrigerator />;
  }
}

// shared stroke props for the structural line-art
const line = {
  className: "shq-eq-stroke",
  fill: "none",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Refrigerator() {
  return (
    <svg viewBox="0 0 150 100" fill="none">
      {/* rising warmth waves (the predictive compressor-wear story) */}
      <g>
        <path className="shq-wave shq-eq-accent" d="M62 30c4-3 8 3 12 0" fill="none" strokeWidth={2} strokeLinecap="round" />
        <path className="shq-wave shq-eq-accent" d="M70 30c4-3 8 3 12 0" fill="none" strokeWidth={2} strokeLinecap="round" />
        <path className="shq-wave shq-eq-accent" d="M66 30c4-3 8 3 12 0" fill="none" strokeWidth={2} strokeLinecap="round" />
      </g>
      {/* body */}
      <rect {...line} x="52" y="34" width="46" height="58" rx="7" className="shq-eq-stroke shq-eq-fill-soft" fill="var(--surface)" />
      <line {...line} x1="52" y1="56" x2="98" y2="56" />
      {/* handles */}
      <line {...line} x1="90" y1="42" x2="90" y2="50" />
      <line {...line} x1="90" y1="62" x2="90" y2="74" />
      {/* status LED */}
      <circle className="shq-led" cx="59" cy="40" r="2.4" />
    </svg>
  );
}

function Washer() {
  return (
    <svg viewBox="0 0 150 100" fill="none">
      <g className="shq-vib">
        {/* body + control panel */}
        <rect {...line} x="50" y="20" width="50" height="62" rx="7" fill="var(--surface)" />
        <line {...line} x1="50" y1="32" x2="100" y2="32" />
        <circle className="shq-led" cx="58" cy="26" r="2.2" />
        {/* dial */}
        <circle {...line} cx="90" cy="26" r="3" />
        {/* drum */}
        <circle {...line} cx="75" cy="57" r="18" />
        <circle className="shq-eq-accent" cx="75" cy="57" r="11" fill="none" strokeWidth={1.6} opacity={0.5} />
        {/* spinning spokes */}
        <g className="shq-drum">
          <line className="shq-eq-accent" x1="75" y1="44" x2="75" y2="70" strokeWidth={2} strokeLinecap="round" />
          <line className="shq-eq-accent" x1="63.7" y1="50.5" x2="86.3" y2="63.5" strokeWidth={2} strokeLinecap="round" />
          <line className="shq-eq-accent" x1="63.7" y1="63.5" x2="86.3" y2="50.5" strokeWidth={2} strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

function Dryer() {
  return (
    <svg viewBox="0 0 150 100" fill="none">
      {/* heat waves out the top vent */}
      <g>
        <path className="shq-wave shq-eq-accent" d="M64 14c4-3 8 3 12 0" fill="none" strokeWidth={2} strokeLinecap="round" />
        <path className="shq-wave shq-eq-accent" d="M70 14c4-3 8 3 12 0" fill="none" strokeWidth={2} strokeLinecap="round" />
        <path className="shq-wave shq-eq-accent" d="M67 14c4-3 8 3 12 0" fill="none" strokeWidth={2} strokeLinecap="round" />
      </g>
      {/* body + panel */}
      <rect {...line} x="50" y="22" width="50" height="60" rx="7" fill="var(--surface)" />
      <line {...line} x1="50" y1="34" x2="100" y2="34" />
      <circle className="shq-led" cx="58" cy="28" r="2.2" />
      {/* tumbling drum (vented door) */}
      <circle {...line} cx="75" cy="58" r="17" />
      <g className="shq-drum">
        <circle className="shq-eq-accent" cx="75" cy="47" r="1.8" fill="var(--eq-tint)" stroke="none" />
        <circle className="shq-eq-accent" cx="86" cy="58" r="1.8" fill="var(--eq-tint)" stroke="none" />
        <circle className="shq-eq-accent" cx="75" cy="69" r="1.8" fill="var(--eq-tint)" stroke="none" />
        <circle className="shq-eq-accent" cx="64" cy="58" r="1.8" fill="var(--eq-tint)" stroke="none" />
      </g>
    </svg>
  );
}

function Oven() {
  return (
    <svg viewBox="0 0 150 100" fill="none">
      {/* heat waves above the range */}
      <g>
        <path className="shq-wave shq-eq-accent" d="M60 18c4-3 8 3 12 0" fill="none" strokeWidth={2} strokeLinecap="round" />
        <path className="shq-wave shq-eq-accent" d="M78 18c4-3 8 3 12 0" fill="none" strokeWidth={2} strokeLinecap="round" />
        <path className="shq-wave shq-eq-accent" d="M69 18c4-3 8 3 12 0" fill="none" strokeWidth={2} strokeLinecap="round" />
      </g>
      {/* body */}
      <rect {...line} x="48" y="24" width="54" height="60" rx="7" fill="var(--surface)" />
      {/* control strip with knobs + LED */}
      <line {...line} x1="48" y1="38" x2="102" y2="38" />
      <circle className="shq-led" cx="55" cy="31" r="2.2" />
      <circle {...line} cx="80" cy="31" r="2.4" />
      <circle {...line} cx="90" cy="31" r="2.4" />
      {/* oven door + window */}
      <rect {...line} x="56" y="46" width="38" height="30" rx="4" />
      {/* glowing element inside the window */}
      <rect className="shq-glow shq-eq-accent-fill" x="61" y="58" width="28" height="9" rx="4" opacity={0.5} />
      <line className="shq-eq-accent" x1="63" y1="62.5" x2="87" y2="62.5" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}
