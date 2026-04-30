import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  raw?: boolean;
}

export function DeskScene({ children, raw }: Props) {
  return (
    <div className="machine">
      <div className="machine-header">
        <div className="machine-header-sides">
          <TubeDecoration small />
          <TubeDecoration />
        </div>

        <div className="machine-header-center">
          <div className="machine-led machine-led--green" />
          <div className="title-panel">
            <span className="machine-title">LoglyLife</span>
            <span className="machine-subtitle">活動記録装置</span>
          </div>
          <div className="machine-led machine-led--amber" />
        </div>

        <div className="machine-header-sides" style={{ justifyContent: "flex-end" }}>
          <TubeDecoration />
          <TubeDecoration small />
        </div>
      </div>

      {raw ? (
        <div className="machine-raw">{children}</div>
      ) : (
        <div className="machine-screen">
          <div className="machine-screen-inner">{children}</div>
        </div>
      )}
    </div>
  );
}

function TubeDecoration({ small }: { small?: boolean }) {
  const w = small ? 18 : 24;
  const h = small ? 36 : 46;
  return (
    <svg viewBox={`0 0 ${w} ${h + 4}`} style={{ width: w, height: h + 4, flexShrink: 0 }}>
      <defs>
        <radialGradient id={`td-glow-${small ? "s" : "l"}`} cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor="#ffa030" stopOpacity="0.85" />
          <stop offset="55%" stopColor="#ff5000" stopOpacity="0.3" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      {/* base */}
      <rect x={w * 0.15} y={h * 0.78} width={w * 0.7} height={h * 0.22} rx="2" fill="#4a3010" />
      {/* neck */}
      <rect x={w * 0.38} y={h * 0.55} width={w * 0.24} height={h * 0.25} rx="1" fill="#3a2800" />
      {/* glow */}
      <ellipse cx={w / 2} cy={h * 0.38} rx={w * 0.42} ry={h * 0.36} fill={`url(#td-glow-${small ? "s" : "l"})`} />
      {/* glass */}
      <ellipse cx={w / 2} cy={h * 0.38} rx={w * 0.42} ry={h * 0.36}
        fill="rgba(200,160,60,0.08)" stroke="#b08040" strokeWidth="1.2" />
      {/* highlight */}
      <ellipse cx={w * 0.33} cy={h * 0.22} rx={w * 0.12} ry={h * 0.1} fill="rgba(255,255,255,0.14)" />
    </svg>
  );
}
