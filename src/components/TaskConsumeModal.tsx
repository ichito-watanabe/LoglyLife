import { useState } from "react";

type Props = {
  taskTitle: string;
  onConfirm: (duration: number | null, memo: string) => void;
  onClose: () => void;
};

export function TaskConsumeModal({ taskTitle, onConfirm, onClose }: Props) {
  const [duration, setDuration] = useState("");
  const [memo, setMemo] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onConfirm(duration ? Number(duration) : null, memo);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "white", padding: "24px", borderRadius: "8px", minWidth: "300px" }}>
        <h3 style={{ marginTop: 0 }}>「{taskTitle}」を消化する</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "12px" }}>
            <label>作業時間（分・任意）</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="1"
              style={{ display: "block", marginTop: "4px", width: "100%", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label>メモ（任意）</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              style={{ display: "block", marginTop: "4px", width: "100%", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit">ログに記録して消化</button>
            <button type="button" onClick={onClose}>キャンセル</button>
          </div>
        </form>
      </div>
    </div>
  );
}
