"use client";

// Stadium background layer — the Arena design language's floor.
// Chalk pitch markings + mow stripes + floodlight bloom, all CSS/SVG,
// fixed behind every page. Pure decoration: aria-hidden, no pointer events.

export function PitchLines() {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* Mow stripes — alternating grass bands, barely there */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.012) 0 120px, transparent 120px 240px)",
        }}
      />

      {/* Chalk markings: halfway line, center circle, penalty boxes.
          Pitch runs horizontally across the viewport. */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0, opacity: 0.05 }}
      >
        <g stroke="var(--pitch-line)" strokeWidth="2" fill="none">
          {/* halfway line */}
          <line x1="800" y1="0" x2="800" y2="900" />
          {/* center circle + spot */}
          <circle cx="800" cy="450" r="110" />
          <circle cx="800" cy="450" r="4" fill="var(--pitch-line)" stroke="none" />
          {/* left penalty box + six-yard + arc */}
          <rect x="0" y="230" width="200" height="440" />
          <rect x="0" y="340" width="70" height="220" />
          <path d="M 200 360 A 110 110 0 0 1 200 540" />
          {/* right penalty box + six-yard + arc */}
          <rect x="1400" y="230" width="200" height="440" />
          <rect x="1530" y="340" width="70" height="220" />
          <path d="M 1400 540 A 110 110 0 0 1 1400 360" />
          {/* corner arcs */}
          <path d="M 0 24 A 24 24 0 0 1 24 0" />
          <path d="M 1576 0 A 24 24 0 0 1 1600 24" />
          <path d="M 1600 876 A 24 24 0 0 1 1576 900" />
          <path d="M 24 900 A 24 24 0 0 1 0 876" />
        </g>
      </svg>

      {/* Floodlight bloom — two cool-white sources above the stands */}
      <div
        style={{
          position: "absolute",
          top: "-30vh",
          left: "-15vw",
          width: "70vw",
          height: "70vh",
          background:
            "radial-gradient(ellipse at center, color-mix(in srgb, var(--floodlight) 7%, transparent) 0%, transparent 65%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-30vh",
          right: "-15vw",
          width: "70vw",
          height: "70vh",
          background:
            "radial-gradient(ellipse at center, color-mix(in srgb, var(--floodlight) 7%, transparent) 0%, transparent 65%)",
        }}
      />
    </div>
  );
}
