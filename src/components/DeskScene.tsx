import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function DeskScene({ children }: Props) {
  return (
    <div className="machine">
      {/* 筐体ヘッダー */}
      <div className="machine-header">
        <div className="machine-screw" />
        <div className="machine-header-center">
          <div className="machine-led machine-led--green" />
          <span className="machine-title">LoglyLife</span>
          <span className="machine-subtitle">/ 活動記録装置</span>
          <div className="machine-led machine-led--amber" />
        </div>
        <div className="machine-screw" />
      </div>

      {/* メインスクリーン */}
      <div className="machine-screen">
        <div className="machine-screen-inner">
          {children}
        </div>
      </div>
    </div>
  );
}
