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

### Step 1: npm パッケージのインストール

```powershell
npm install drizzle-orm @tauri-apps/plugin-sql
npm install -D drizzle-kit
```

- `drizzle-orm` … TypeScript から型安全に SQL を書けるライブラリ
- `@tauri-apps/plugin-sql` … Tauri から SQLite を操作する公式プラグインの JS 側
- `drizzle-kit` … スキーマ管理ツール（開発用、`-D` は devDependencies に追加する意味）

---

### Step 2: Rust 側に tauri-plugin-sql を追加

**変更ファイル:** `src-tauri/Cargo.toml`

```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-opener = "2"
tauri-plugin-sql = { version = "2", features = ["sqlite"] }  # 追加
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

`features = ["sqlite"]` で SQLite を使うことを Rust 側に宣言する。

---

### Step 3: フロントエンドに SQL 権限を許可

**変更ファイル:** `src-tauri/capabilities/default.json`

```json
{
  "permissions": [
    "core:default",
    "opener:default",
    "sql:default"   // 追加
  ]
}
```

Tauri 2 はセキュリティのため、許可リストにない API はフロントエンドから呼べない。`sql:default` で SQLite の読み書き権限を許可する。

---

### Step 4: Rust にプラグインを登録

**変更ファイル:** `src-tauri/src/lib.rs`

```rust
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())  // 追加
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

`Cargo.toml` に追加しただけでは使えない。`.plugin(...)` で起動時に読み込むよう登録する必要がある。Node.js の `app.use(...)` に相当する。

---

### Step 5: DBスキーマ定義

**新規作成:** `src/db/schema.ts`

テーブルの設計図を TypeScript で定義する。実際に DB にテーブルを作るわけではなく、Drizzle ORM が型を自動生成するための情報を渡す。

```typescript
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";


export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  parentId: integer("parent_id"),
  color: text("color"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const activityLogs = sqliteTable("activity_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  title: text("title").notNull(),
  durationMinutes: integer("duration_minutes"),
  memo: text("memo"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
```

**なぜ TypeScript で設計図を書くのか？**
SQL を直接書いてデータを取得すると、返ってくる型が `any` になる。Drizzle に設計図を渡しておくことで、`activityLogs.title` は `string`、`activityLogs.durationMinutes` は `number | null` と自動で型がつき、ミスをコンパイル時に発見できる。

---

### Step 6: DB接続ファイル作成

**新規作成:** `src/db/index.ts`

DB への接続と、テーブルの初期化（なければ作成）を行う。`schema.ts` は設計図だけで、実際に DB ファイルを作ったりテーブルを作ったりはしない。このファイルが実際の処理を担う。

```typescript
import Database from "@tauri-apps/plugin-sql";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;
let _db: Db | null = null;

export async function initDb(): Promise<Db> {
  const sqlite = await Database.load("sqlite:loglylife.db");

  // テーブルが存在しなければ作成（2回目以降はスキップ）
  await sqlite.execute(`CREATE TABLE IF NOT EXISTS categories (...)`, []);
  await sqlite.execute(`CREATE TABLE IF NOT EXISTS activity_logs (...)`, []);

  // Tauri の SQL プラグインを Drizzle のドライバーとして橋渡しする
  _db = drizzle(async (sql, params, method) => {
    if (method === "run") {
      await sqlite.execute(sql, params as unknown[]);
      return { rows: [] };
    }
    const rows = await sqlite.select<Record<string, unknown>[]>(sql, params as unknown[]);
    return { rows: rows.map((row) => Object.values(row)) };
  }, { schema });

  return _db;
}

export function getDb(): Db {
  if (!_db) throw new Error("DB not initialized. Call initDb() first.");
  return _db;
}
```

**`sqlite-proxy` を使う理由:**
Drizzle ORM は通常 Node.js 環境向けに作られており、Tauri の SQLite プラグインに直接対応していない。`sqlite-proxy` はカスタムドライバーを差し込める仕組みで、Tauri の API を Drizzle が理解できる形に変換している。

---

### Step 7: アプリ起動時にDBを初期化

**変更ファイル:** `src/main.tsx`

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initDb } from "./db";

initDb().then(() => {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
```

`initDb()` は非同期処理なので、DB の準備が終わる前に React が起動するとデータ操作で失敗する。`.then()` で「DB の準備ができてから React を起動する」順番を保証している。

---

### 次のステップ
- [x] 最小のデータ登録（INSERT）を試す
- [x] 最小のデータ取得（SELECT）を試す
- [ ] UI からログを登録できるようにする

---

## #3 INSERT / SELECT の動作確認
**日付:** 2026-04-26

### やったこと
テスト用の `App.tsx` を作り、DB への INSERT と SELECT が実際に動くか確認した。

### トラブル①：真っ白な画面

`npm run tauri dev` でアプリを起動したら画面が真っ白になった。

**原因:** `capabilities/default.json` の `"sql:default"` に `execute` の権限が含まれていなかった。

**解決:** 個別の権限を明示的に指定する。

```json
// 変更前
"sql:default"

// 変更後
"sql:allow-load",
"sql:allow-execute",
"sql:allow-select"
```

Tauri 2 は許可リストにない操作をフロントから呼ぶとエラーになる。`sql:default` は期待した権限をすべて含んでいなかったため、必要な操作を1つずつ明示した。

---

### トラブル②：タイムスタンプが文字列になる

INSERT 後に SELECT すると `createdAt` が `"CURRENT_TIMESTAMP"` という文字列になっていた。

**原因:** `.default("CURRENT_TIMESTAMP")` と書くと Drizzle が文字列としてそのまま INSERT してしまう。

**解決:** `sql` テンプレートを使って SQL 式として評価させる。

```typescript
// 変更前
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),

// 変更後
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
```

`sql\`...\`` は drizzle-orm の関数で、バッククォートで囲んだ内容を文字列ではなく SQL 式として扱う。タイムスタンプは JavaScript の `new Date()` ではなく SQLite の `CURRENT_TIMESTAMP` 関数が評価する。ネット環境なしで動作し、PC のシステムクロックから時刻を取得する。

---

### 動作確認結果

- `categories` テーブルへの INSERT・SELECT が正常に動作することを確認
- タイムスタンプに実際の日時が記録されることを確認

---

### 次のステップ
- [ ] UI からログを登録できるようにする（`activityLogs` への INSERT フォームを作る）
- [ ] ログ一覧を画面に表示する

---
