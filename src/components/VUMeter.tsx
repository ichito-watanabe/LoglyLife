import { useMemo, useState, useEffect, useRef } from "react";

interface Props {
  value: number;
  spinTrigger?: number;   // 値がインクリメントされるとスピン発動
  onSpinEnd?: () => void; // スピン完了後コールバック
}

const PX = 170;
const PY = 148;
const NL = 108;
const HS = 65;

export function VUMeter({ value, spinTrigger = 0, onSpinEnd }: Props) {
  const effectiveMax = value <= 60 ? 60 : Math.ceil(value / 60) * 60;

  // 余分な回転量（スピン演出用）
  const [extraRot, setExtraRot] = useState(0);
  const [transition, setTransition] = useState("transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)");
  const prevTrigger = useRef(0);

  useEffect(() => {
    if (spinTrigger === 0 || spinTrigger === prevTrigger.current) return;
    prevTrigger.current = spinTrigger;

    // ① 360° 上乗せ → スピンアニメーション開始
    setTransition("transform 0.85s ease-in-out");
    setExtraRot((prev) => prev + 360);

    // ② スピン完了後: トランジション無効で extraRot をリセット（見た目は変わらない）
    const t1 = setTimeout(() => {
      setTransition("none");
      setExtraRot(0);
    }, 870);

    // ③ 少し待ってからバネ付きトランジション有効化 → 親の value リセットに合わせて針が戻る
    const t2 = setTimeout(() => {
      setTransition("transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1)");
      onSpinEnd?.();
    }, 910);

    // ④ 通常のトランジションに戻す
    const t3 = setTimeout(() => {
      setTransition("transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)");
    }, 1600);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [spinTrigger]);

  const baseRot = useMemo(() => {
    const r = Math.max(0, Math.min(value, effectiveMax)) / effectiveMax;
    return -HS + r * (HS * 2);
  }, [value, effectiveMax]);

  const displayRot = baseRot + extraRot;

  const step = effectiveMax / 6;
  const labelValues  = [0, step, step * 2, step * 4, step * 5, step * 6];
  const majorTickValues = [0, step, step * 2, step * 3, step * 4, step * 5, step * 6];
  const minorTickValues = [step * 0.5, step * 1.5, step * 2.5, step * 3.5, step * 4.5, step * 5.5];

  function pos(v: number, radius: number) {
    const a = (-HS + (Math.max(0, Math.min(v, effectiveMax)) / effectiveMax) * HS * 2) * (Math.PI / 180);
    return { x: PX + radius * Math.sin(a), y: PY - radius * Math.cos(a) };
  }

  return (
    <svg viewBox="0 0 340 182" width="100%" height="100%" style={{ display: "block" }}>
      <defs>
        <radialGradient id="vu-face" cx="50%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#f8f2e0" />
          <stop offset="80%" stopColor="#e0cfa0" />
          <stop offset="100%" stopColor="#c8b888" />
        </radialGradient>
        <radialGradient id="vu-glass" cx="37%" cy="22%" r="60%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
          <stop offset="55%" stopColor="rgba(255,255,255,0.04)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <linearGradient id="vu-bezel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a2000" />
          <stop offset="100%" stopColor="#180e00" />
        </linearGradient>
        <radialGradient id="vu-pivot" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#e0c060" />
          <stop offset="60%" stopColor="#9a7030" />
          <stop offset="100%" stopColor="#4a3010" />
        </radialGradient>
      </defs>

      {/* ベゼル */}
      <rect x="0" y="0" width="340" height="182" rx="8" fill="url(#vu-bezel)" />
      <rect x="1.5" y="1.5" width="337" height="179" rx="7" fill="none" stroke="#6a4010" strokeWidth="1.5" />
      <rect x="3.5" y="3.5" width="333" height="175" rx="6" fill="none" stroke="#2a1600" strokeWidth="0.8" />

      {/* 四隅リベット */}
      {([[22, 16], [318, 16], [22, 164], [318, 164]] as [number, number][]).map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="7" fill="#2a1800" />
          <circle cx={cx} cy={cy} r="6" fill="#6a4820" />
          <circle cx={cx - 1} cy={cy - 1} r="3.5" fill="#d0a840" />
          <circle cx={cx} cy={cy} r="2" fill="#f0d080" />
        </g>
      ))}

      {/* フェイス */}
      <rect x="16" y="10" width="308" height="144" rx="4" fill="url(#vu-face)" />
      <rect x="16" y="10" width="308" height="144" rx="4" fill="none" stroke="#c0a050" strokeWidth="1.5" />

      {/* タイトル（メモリの弧より上） */}
      <text x="170" y="28" textAnchor="middle" fill="#7a5830" fontSize="10"
        fontFamily="Georgia, serif" letterSpacing="3">
        作業時間
      </text>
      {effectiveMax > 60 && (
        <text x="170" y="42" textAnchor="middle" fill="#9a6040" fontSize="8"
          fontFamily="Georgia, serif" letterSpacing="1">
          (max {effectiveMax}分)
        </text>
      )}

      {/* マイナー目盛り */}
      {minorTickValues.map((v, i) => {
        const inner = pos(v, 92); const outer = pos(v, 102);
        return <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
          stroke="#a08050" strokeWidth="0.8" strokeLinecap="round" />;
      })}

      {/* メジャー目盛り */}
      {majorTickValues.map((v, i) => {
        const inner = pos(v, 86); const outer = pos(v, 102);
        return <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
          stroke="#5a3818" strokeWidth="1.8" strokeLinecap="round" />;
      })}

      {/* 数値ラベル */}
      {labelValues.map((v, i) => {
        const lp = pos(v, 74);
        return (
          <text key={i} x={lp.x} y={lp.y + 4} textAnchor="middle"
            fill="#4a3010" fontSize="11" fontFamily="Georgia, serif" fontWeight="bold">
            {Math.round(v)}
          </text>
        );
      })}

      {/* 針の影 */}
      <g style={{ transform: `rotate(${displayRot}deg)`, transformOrigin: `${PX}px ${PY}px`, transition }}>
        <line x1={PX + 0.6} y1={PY + 8} x2={PX + 0.6} y2={PY - NL}
          stroke="rgba(0,0,0,0.22)" strokeWidth="3.5" strokeLinecap="round" />
      </g>

      {/* 針 */}
      <g style={{ transform: `rotate(${displayRot}deg)`, transformOrigin: `${PX}px ${PY}px`, transition }}>
        <line x1={PX} y1={PY + 8} x2={PX} y2={PY - NL}
          stroke="#cc2200" strokeWidth="2.5" strokeLinecap="round" />
        <line x1={PX} y1={PY + 8} x2={PX} y2={PY + 14}
          stroke="#991800" strokeWidth="4" strokeLinecap="round" />
      </g>

      {/* 軸キャップ */}
      <circle cx={PX} cy={PY} r="9" fill="#1a1000" />
      <circle cx={PX} cy={PY} r="7" fill="url(#vu-pivot)" />
      <circle cx={PX - 1} cy={PY - 1} r="3" fill="#f0d888" />
      <circle cx={PX - 1.5} cy={PY - 1.5} r="1.2" fill="rgba(255,255,240,0.9)" />

      {/* ガラス反射 */}
      <rect x="16" y="10" width="308" height="144" rx="4" fill="url(#vu-glass)" />

      {/* LCD */}
      <rect x="112" y="156" width="116" height="22" rx="2" fill="#0d1004" />
      <rect x="112" y="156" width="116" height="22" rx="2" fill="none" stroke="#4a3000" strokeWidth="1" />
      <rect x="114" y="158" width="112" height="18" rx="1" fill="#080d03" />
      <text x="170" y="172" textAnchor="middle" fill="#d8b800" fontSize="13"
        fontFamily="'Courier New', Courier, monospace" letterSpacing="2">
        {value > 0 ? `${value} 分` : "-- 分"}
      </text>
    </svg>
  );
}
