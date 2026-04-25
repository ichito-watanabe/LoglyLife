# Logly Life 開発ログ

個人の活動ログを記録・振り返りできるローカルファーストのデスクトップアプリ「Logly Life」の開発記録。

---

## #1 プロジェクト開始 & 環境構築
**日付:** 2026-04-25

### 作るもの
自分の行動・学習・就活・研究・開発ログを記録して、カレンダーや集計で振り返れるデスクトップアプリ。

**技術構成:**
| 役割 | 技術 |
|------|------|
| デスクトップ基盤 | Tauri |
| UI | React + TypeScript + Vite |
| DB | SQLite + Drizzle ORM |
| バックエンド処理 | Rust |

---

### Tauri とは何か

**Tauri** は Rust 製のデスクトップアプリフレームワーク。
Web技術（React/Vue など）でUIを書き、アプリの本体部分（ファイル操作・DBアクセスなど）を Rust で書く。

**なぜ Tauri を使うのか？**
- **軽量**: Electron と違い、Chrome をバンドルしない。OS標準のWebView を使うのでアプリサイズが小さい
- **安全**: Rust はメモリ安全な言語なのでバグが起きにくい
- **ローカルファースト**: サーバーなしで動くデスクトップアプリが作れる

**Electron との比較:**
| | Tauri | Electron |
|--|-------|----------|
| サイズ | 小さい（数MB） | 大きい（100MB〜） |
| バックエンド言語 | Rust | Node.js |
| パフォーマンス | 高い | 普通 |

---

### Step 1: 環境確認

開発に必要なツールが揃っているか確認した。

```powershell
node -v   # → v25.9.0
npm -v    # → v11.12.1
```

Node.js と npm はインストール済みだった。
Rust はまだ入っていなかった。

---

### Step 2: Rust のインストール

Tauri はバックエンド処理に Rust を使うため、Rust が必須。

**rustup とは？**
Rust のバージョン管理ツール。Node.js でいう `nvm` に相当する。
rustup をインストールすると `rustc`（コンパイラ）と `cargo`（パッケージマネージャー）が一緒に入る。

公式サイト（https://rustup.rs）から `rustup-init.exe` をダウンロードして実行。
インストーラーの選択肢は `1) Proceed with standard installation` を選択。

```powershell
rustc --version  # → rustc 1.95.0
cargo --version  # → cargo 1.95.0
```

- `rustc` … Rust のコンパイラ。`.rs` ファイルを実行ファイルに変換する
- `cargo` … Rust のパッケージマネージャー兼ビルドツール。npm に相当する

**PATHの問題**
インストール後、ターミナルを再起動しても `rustc` が認識されない問題が発生。
Rust は `C:\Users\ichito0229\.cargo\bin` にインストールされるが、PATHに追加されていなかった。

以下で永続的にPATHを設定して解決：
```powershell
[System.Environment]::SetEnvironmentVariable(
  "PATH",
  [System.Environment]::GetEnvironmentVariable("PATH", "User") + ";$env:USERPROFILE\.cargo\bin",
  "User"
)
```

`SetEnvironmentVariable` の第3引数 `"User"` は「このユーザーのPATHに永続的に追加する」という意味。
`"Machine"` にすると全ユーザー対象になるが、管理者権限が必要。

---

### Step 3: Git & GitHub の初期設定

**なぜ最初にGit設定をするのか？**
コードを書き始める前にGitを設定しておくことで、変更履歴をすべて残せる。
後から「いつ何を変えたか」を追えるのが Git の価値。

```powershell
git init                          # Gitリポジトリを初期化（.gitフォルダが作られる）
git add .                         # 全ファイルをステージング（コミット対象に追加）
git commit -m "プロジェクト初期設定"  # コミット（スナップショットを保存）
git remote add origin git@github.com:ichito-watanabe/LoglyLife.git  # GitHubと接続
git branch -M main               # ブランチ名をmainに変更
git push -u origin main          # GitHubに送信（-u で追跡設定も同時に行う）
```

`.gitignore` に書いたもの：
- `node_modules/` … npm でインストールされるライブラリ群。大量のファイルがあるため除外（`npm install` で復元できる）
- `target/` … Rust のビルド成果物。サイズが大きいため除外
- `.env` … APIキーなどの機密情報が入るファイル。絶対にGitに上げてはいけない

---

### Step 4: Tauri プロジェクト作成

```powershell
npm create tauri-app@latest .
```

**このコマンドで何が起きるか？**
`create-tauri-app` というプロジェクト生成ツールが実行される。
`.` は「現在のディレクトリにプロジェクトを作る」という意味。

選択した設定：
- フロントエンド言語: TypeScript / JavaScript
- パッケージマネージャー: npm
- UIテンプレート: React
- UIフレーバー: TypeScript

生成されたフォルダ構成：
```
LoglyLife/
├── src/              # React（フロントエンド）のコード
│   ├── App.tsx       # メインのReactコンポーネント
│   └── main.tsx      # エントリーポイント
├── src-tauri/        # Rust（バックエンド）のコード
│   ├── src/
│   │   └── main.rs   # Rustのエントリーポイント
│   └── Cargo.toml    # Rustの依存関係定義（npmでいうpackage.json）
├── package.json      # npmの依存関係定義
└── vite.config.ts    # Viteの設定ファイル
```

---

### Step 5: 依存関係のインストール

```powershell
npm install
```

**このコマンドで何が起きるか？**
`package.json` に書かれたライブラリを `node_modules/` にダウンロードする。
初回は時間がかかるが、2回目以降はキャッシュが効く。

結果: 73 packages added, 0 vulnerabilities

---

### 次のステップ
- [x] `npm run tauri dev` でアプリを起動して動作確認
- [ ] SQLite + Drizzle ORM の導入
- [ ] DBテーブルの作成

---

## #2 SQLite + Drizzle ORM の導入
**日付:** 2026-04-25

### この章でやること
DBにデータを保存・取得できるようにする。
使う技術は2つ：

- **SQLite** … ファイル1つで動くデータベース。サーバー不要でローカルに保存できる
- **Drizzle ORM** … TypeScript から SQLite を操作するためのライブラリ。SQLを直接書かずに型安全にDBを扱える

---
