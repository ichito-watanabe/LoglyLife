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

**PATHの設定**
インストール後、ターミナルを再起動しても `rustc` が認識されない場合がある。
Rust は `C:\Users\ichito0229\.cargo\bin` にインストールされるため、以下で永続的にPATHを設定する：

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

### Step 5: 依存関係のインストール & 動作確認

```powershell
npm install        # package.json に書かれたライブラリを node_modules/ にダウンロード
npm run tauri dev  # アプリを開発モードで起動（初回はRustのコンパイルで数分かかる）
```

アプリウィンドウが開けば環境構築完了。

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
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "opener:default",
    "sql:allow-load",
    "sql:allow-execute",
    "sql:allow-select"
  ]
}
```

Tauri 2 はセキュリティのため、許可リストにない API はフロントエンドから呼べない。
操作ごとに個別の権限を明示的に指定する：
- `sql:allow-load` … DBファイルを開く権限
- `sql:allow-execute` … INSERT・UPDATE・DELETE を実行する権限
- `sql:allow-select` … SELECT を実行する権限

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

**`sql\`CURRENT_TIMESTAMP\`` を使う理由:**
`.default("CURRENT_TIMESTAMP")` と書くと文字列としてそのまま INSERT されてしまう。
`sql\`...\`` は drizzle-orm の関数で、バッククォートで囲んだ内容を SQL 式として評価させる。
タイムスタンプは SQLite の `CURRENT_TIMESTAMP` 関数が評価し、PC のシステムクロックから取得する（ネット不要）。

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

  await sqlite.execute(
    `CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER,
      color TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    []
  );

  await sqlite.execute(
    `CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      title TEXT NOT NULL,
      duration_minutes INTEGER,
      memo TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    []
  );

  _db = drizzle(
    async (sql, params, method) => {
      if (method === "run") {
        await sqlite.execute(sql, params as unknown[]);
        return { rows: [] };
      }
      const rows = await sqlite.select<Record<string, unknown>[]>(sql, params as unknown[]);
      return { rows: rows.map((row) => Object.values(row)) };
    },
    { schema }
  );

  return _db;
}

export function getDb(): Db {
  if (!_db) throw new Error("DB not initialized. Call initDb() first.");
  return _db;
}
```

**`sqlite-proxy` を使う理由:**
Drizzle ORM は通常 Node.js 環境向けに作られており、Tauri の SQLite プラグインに直接対応していない。`sqlite-proxy` はカスタムドライバーを差し込める仕組みで、Tauri の API を Drizzle が理解できる形に変換している。

**DBファイルの保存場所:**
`C:\Users\ichito0229\AppData\Roaming\com.ichito0229.tauri-app\loglylife.db`

削除したい場合：
```powershell
Remove-Item "$env:APPDATA\com.ichito0229.tauri-app\loglylife.db"
```

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

### Step 8: INSERT / SELECT の動作確認

**変更ファイル:** `src/App.tsx`（テスト用）

```typescript
import { useState } from "react";
import { getDb } from "./db";
import { categories } from "./db/schema";

function App() {
  const [result, setResult] = useState<string>("");

  async function testInsert() {
    const db = getDb();
    await db.insert(categories).values({ name: "学習" });
    setResult("INSERT 成功！");
  }

  async function testSelect() {
    const db = getDb();
    const rows = await db.select().from(categories);
    setResult(JSON.stringify(rows, null, 2));
  }

  return (
    <main>
      <h1>DB テスト</h1>
      <button onClick={testInsert}>INSERT テスト</button>
      <button onClick={testSelect}>SELECT テスト</button>
      <pre>{result}</pre>
    </main>
  );
}

export default App;
```

INSERT → SELECT でタイムスタンプ付きのデータが返ってくることを確認。

---

### 次のステップ
- [x] UI からログを登録できるようにする（`activityLogs` への INSERT フォームを作る）
- [x] ログ一覧を画面に表示する

---

## #3 スキーマ再設計とカテゴリ管理機能
**日付:** 2026-04-26

### この章でやること
カテゴリを無限階層で管理できるようにする。
また、ログに複数カテゴリを紐付けられるようスキーマを再設計する。

---

### Step 1: スキーマ再設計

当初 `activity_logs` は `category_id` を直接持っていたが、以下の理由で設計を変更した。

- **複数カテゴリを持てない** — 1カラムに1つの外部キーしか入らない
- **祖先タグを自動付与できない** — 「単語」を選んだら「学習・TOEIC・単語」全部をタグにしたい

**変更後の構成:**

```
categories           activity_logs         activity_log_categories
─────────────────    ──────────────────    ───────────────────────
id                   id                    id
name                 date                  log_id  → activity_logs.id
parent_id            duration_minutes      category_id → categories.id
color                memo
sort_order           created_at
created_at           updated_at
updated_at
```

`activity_log_categories` はログとカテゴリの多対多を表す**中間テーブル**。
1件のログに複数のカテゴリ行を持てる。

**変更ファイル:** `src/db/schema.ts`

```typescript
export const activityLogs = sqliteTable("activity_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  durationMinutes: integer("duration_minutes"),
  memo: text("memo"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const activityLogCategories = sqliteTable("activity_log_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  logId: integer("log_id").notNull().references(() => activityLogs.id),
  categoryId: integer("category_id").notNull().references(() => categories.id),
});
```

スキーマ変更後は既存 DB ファイルを削除して再作成が必要。

```powershell
Remove-Item "$env:APPDATA\com.ichito0229.tauri-app\loglylife.db"
```

---

### Step 2: カテゴリユーティリティ

**新規作成:** `src/db/categoryUtils.ts`

カテゴリ関連の共通ロジックをまとめたファイル。

```typescript
export type Category = { id: number; name: string; parentId: number | null };

// ルートから指定IDまでの表示パスを返す（例: "学習 > TOEIC > 単語"）
export function buildPath(all: Category[], id: number): string {
  const map = new Map(all.map((c) => [c.id, c]));
  const parts: string[] = [];
  let cur = map.get(id);
  while (cur) {
    parts.unshift(cur.name);
    cur = cur.parentId != null ? map.get(cur.parentId) : undefined;
  }
  return parts.join(" > ");
}

// 指定IDのカテゴリ＋すべての祖先IDをルートから順に返す
export function getAncestorIds(all: Category[], id: number): number[] {
  const map = new Map(all.map((c) => [c.id, c]));
  const ids: number[] = [];
  let cur = map.get(id);
  while (cur) {
    ids.unshift(cur.id);
    cur = cur.parentId != null ? map.get(cur.parentId) : undefined;
  }
  return ids;
}
```

**`getAncestorIds` の役割:**
「単語」(id=5) を選んだとき、`[学習.id, TOEIC.id, 単語.id]` を返す。
ログ登録時にこの配列全体を `activity_log_categories` に INSERT することで、祖先カテゴリも自動タグになる。

---

### Step 3: ドリルダウン式カテゴリ選択 UI

**新規作成:** `src/components/CategoryTree.tsx`

フォルダ階層を掘り下げるような UI。
- **シングルクリック** → そのカテゴリを選択
- **ダブルクリック（250ms以内に2回）** → 中に入る（子を表示）
- **← 戻る** → 1つ上の階層に戻る

```typescript
function handleClick(id: number) {
  if (timerRef.current) {
    // 2回目のクリック = ダブルクリック → 中に入る
    clearTimeout(timerRef.current);
    timerRef.current = null;
    setViewParentId(id);
    onSelect?.(id);
  } else {
    // 1回目 → 250ms 待ってシングルクリックと確定
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onSelect?.(id);
    }, 250);
  }
}
```

タイマーで単発・ダブルを区別する。`onDoubleClick` だと単発クリックも一緒に発火するため、自前で管理する。

---

### Step 4: カテゴリ登録フォーム

**新規作成:** `src/components/CategoryForm.tsx`

- ツリーを操作して「追加先」を決める
- 同じ階層に同名カテゴリが存在する場合はエラー表示（重複防止）
- 追加後すぐにツリーを再取得して反映

```typescript
const duplicate = allCategories.some(
  (c) => c.name === trimmed && c.parentId === parentId
);
if (duplicate) {
  setError(`「${trimmed}」はすでに存在しています`);
  return;
}
```

---

## #4 ログ登録・一覧・編集・削除
**日付:** 2026-04-26

### Step 1: ページ分離

ログ記録とカテゴリ管理を同一画面に置くと分かりにくいため、タブで分離した。

**変更ファイル:** `src/App.tsx`

```typescript
type Page = "log" | "category";

function App() {
  const [page, setPage] = useState<Page>("log");
  // ...
  return (
    <>
      <nav>
        <button onClick={() => setPage("log")}>ログ記録</button>
        <button onClick={() => setPage("category")}>カテゴリ管理</button>
      </nav>
      {page === "log" && <><LogForm .../><LogList .../></>}
      {page === "category" && <CategoryForm .../>}
    </>
  );
}
```

---

### Step 2: ログ登録フォーム

**新規作成:** `src/components/LogForm.tsx`

複数カテゴリを選択でき、登録時に祖先カテゴリも自動でタグ付けされる。

```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (selectedCategoryIds.size === 0) return;

  // ログ本体を INSERT
  const logId = await insertActivityLog({ date, durationMinutes, memo });

  // 選択カテゴリ + 祖先をすべて収集して重複除去
  const allCategoryIds = new Set<number>();
  for (const catId of selectedCategoryIds) {
    for (const id of getAncestorIds(categoryList, catId)) {
      allCategoryIds.add(id);
    }
  }

  // 中間テーブルに INSERT
  for (const catId of allCategoryIds) {
    await db.insert(activityLogCategories).values({ logId, categoryId: catId });
  }
}
```

**`insertActivityLog` を別関数にした理由:**
Tauri の SQLite プラグイン経由では Drizzle の `.returning()` が動作しない（プロキシが RETURNING 句に対応していない）。
そのため `src/db/index.ts` に生 SQL で INSERT → `SELECT MAX(id)` する関数を用意した。

```typescript
export async function insertActivityLog(params): Promise<number> {
  await _sqlite.execute(
    "INSERT INTO activity_logs (date, duration_minutes, memo) VALUES (?, ?, ?)",
    [params.date, params.durationMinutes, params.memo]
  );
  const rows = await _sqlite.select<{ id: number }[]>(
    "SELECT MAX(id) as id FROM activity_logs", []
  );
  return rows[0].id;
}
```

---

### Step 3: ログ一覧

**新規作成:** `src/components/LogList.tsx`

ログと中間テーブルを別々にクエリして JS 側で結合。
各ログのタグをチップ形式で表示する。

```typescript
Promise.all([
  db.select({ id, date, durationMinutes, memo }).from(activityLogs).orderBy(desc(activityLogs.date)),
  db.select({ logId, categoryId, categoryName }).from(activityLogCategories)
    .innerJoin(categories, eq(categories.id, activityLogCategories.categoryId)),
]).then(([logRows, catRows]) => {
  const tagsByLog = new Map<number, string[]>();
  const idsByLog  = new Map<number, number[]>();
  for (const row of catRows) {
    tagsByLog.get(row.logId)?.push(row.categoryName) ?? tagsByLog.set(row.logId, [row.categoryName]);
    idsByLog.get(row.logId)?.push(row.categoryId)   ?? idsByLog.set(row.logId, [row.categoryId]);
  }
  setLogs(logRows.map(log => ({
    ...log,
    tags: tagsByLog.get(log.id) ?? [],
    categoryIds: idsByLog.get(log.id) ?? [],
  })));
});
```

---

### Step 4: 削除

`activity_log_categories` は `activity_logs` に対して外部キー制約を持つため、削除は必ず中間テーブルから先に行う。

```typescript
async function handleDelete(logId: number) {
  await db.delete(activityLogCategories).where(eq(activityLogCategories.logId, logId));
  await db.delete(activityLogs).where(eq(activityLogs.id, logId));
  await loadLogs();
}
```

---

### Step 5: 編集

**新規作成:** `src/components/LogEditModal.tsx`

編集ボタンを押すとオーバーレイでモーダルが表示される。
既存の値を初期値としてフォームに入れ、保存時はカテゴリを一度全削除して再 INSERT する。

```typescript
// カテゴリをリセットして再登録
await db.delete(activityLogCategories).where(eq(activityLogCategories.logId, log.id));
for (const catId of allCategoryIds) {
  await db.insert(activityLogCategories).values({ logId: log.id, categoryId: catId });
}
```

---

### 次のステップ
- [ ] カレンダー表示（月単位でログを俯瞰する）
- [ ] 集計・ダッシュボード（日別・カテゴリ別の作業時間）

---

## #5 気分スコア（感情バー）の追加
**日付:** 2026-04-29

### この章でやること
ログに気分スコア（1〜5）を記録できるようにする。
登録・一覧・編集の全画面にスライダーUIで追加する。

---

### Step 1: スキーマにカラム追加

**変更ファイル:** `src/db/schema.ts`

```typescript
mood: integer("mood"),  // 1=最悪 〜 5=最高、任意入力
```

nullable にした理由：既存ログとの互換性を保つため。気分を記録しない日があっても問題ないようにする。

---

### Step 2: DB の CREATE TABLE と INSERT 関数を更新

**変更ファイル:** `src/db/index.ts`

CREATE TABLE に `mood INTEGER` を追加。
`insertActivityLog` の型と SQL も更新：

```typescript
export async function insertActivityLog(params: {
  date: string;
  durationMinutes: number | null;
  memo: string | null;
  mood: number | null;   // 追加
}): Promise<number> {
  await _sqlite.execute(
    "INSERT INTO activity_logs (date, duration_minutes, memo, mood) VALUES (?, ?, ?, ?)",
    [params.date, params.durationMinutes, params.memo, params.mood]
  );
```

既存の DB ファイルは `CREATE TABLE IF NOT EXISTS` で作られているため、カラム追加後は削除して再作成が必要。

```powershell
Remove-Item "$env:APPDATA\com.ichito0229.tauri-app\loglylife.db"
```

---

### Step 3: UI にスライダーを追加

**変更ファイル:** `src/components/LogForm.tsx`, `LogEditModal.tsx`

`<input type="range" min="1" max="5">` でスライダーを実装。
ラベルは配列インデックスで対応させる：

```typescript
["", "最悪", "悪い", "普通", "良い", "最高"][mood]
```

index 0 は使わないダミー。1〜5 を自然な日本語ラベルに変換できる。

デフォルト値は `3`（普通）。リセット時も 3 に戻す。

---

### Step 4: 一覧に気分列を追加

**変更ファイル:** `src/components/LogList.tsx`

`Log` 型と `EditingLog` 型に `mood: number | null` を追加。
テーブルに「気分」列を追加し、null の場合は `—` を表示。

---

## #6 Godot 4 への移行決定と環境構築
**日付:** 2026-04-29

### なぜ移行したか
スプライトアニメーション（ラジオのつまみが回る・ノートがめくれるなど）を実現したかったため。Reactではスプライトアニメーションの実装が困難で、ポートフォリオ作品としての完成度を優先してGodot 4に移行することを決定。

DBスキーマ・機能設計はそのまま引き継ぐ。

### やったこと
1. Godot 4（Standard版）をインストール・起動
2. 新規プロジェクト作成、レンダラーは「互換性」を選択
3. ドット絵用設定：`レンダリング > 2D > Default Canvas Item Texture Filter` を `Nearest` に変更
4. AssetLib から SQLite プラグイン（by 2shady4u）をインストール・有効化

---
