# Logly Life 開発ログ

個人の活動ログを記録・振り返りできるローカルファーストのデスクトップアプリ「Logly Life」の開発記録。

---

## #1 プロジェクト開始 & 環境構築（Rust インストール）
**日付:** 2026-04-25

### 作るもの
自分の行動・学習・就活・研究・開発ログを記録して、カレンダーや集計で振り返れるデスクトップアプリ。

**技術構成:**
| 役割 | 技術 |
|------|------|
| デスクトップ基盤 | Tauri |
| UI | React / Next.js + TypeScript |
| DB | SQLite + Drizzle ORM |
| バックエンド処理 | Rust |

### やったこと

#### 1. 環境確認
まず開発に必要なツールが入っているか確認した。

```powershell
node -v   # → v25.9.0
npm -v    # → v11.12.1
```

Node.js と npm はすでにインストール済みだった。
Rust はまだ入っていなかったので次のステップでインストール。

#### 2. Rust のインストール
Tauri はバックエンド処理に Rust を使うため、Rust のインストールが必須。

公式サイト（https://rustup.rs）から `rustup-init.exe` をダウンロードして実行。
インストーラーの選択肢で `1) Proceed with standard installation` を選んだ。

`rustup` は Rust のバージョン管理ツール（Node.js でいう `nvm` に相当）。

インストール後、ターミナルを再起動して確認：

```powershell
rustc --version  # → rustc 1.95.0 (59807616e 2026-04-14)
cargo --version  # → cargo 1.95.0 (f2d3ce0bd 2026-03-21)
```

- `rustc` … Rust のコンパイラ
- `cargo` … Rust のパッケージマネージャー（Node.js でいう `npm` に相当）

### 現在の状態
- [x] Node.js / npm インストール済み
- [x] Rust / Cargo インストール済み
- [ ] Tauri プロジェクト作成
- [ ] SQLite + Drizzle ORM 導入
