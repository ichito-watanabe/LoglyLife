import {useState } from"react";
import { getDb } from "./db";
import { categories } from "./db/schema";

function App() {
  const [result, setResult] = useState<string>("");
  async function testInsert() {
    const db = getDb();
    await db.insert(categories).values({name:"学習"});
    setResult("INSERT 成功！");
  }

  async function testSelect() {
    const db = getDb();
    const rows = await db.select().from(categories);
    setResult(JSON.stringify(rows,null,2));
  }
  return(
    <main>
      <h1>DBテスト</h1>
      <button onClick={testInsert}>INSERT テスト</button>
      <button onClick={testSelect}>SELECT テスト</button>
      <pre>{result}</pre>
    </main>
  );
}

export default App;
