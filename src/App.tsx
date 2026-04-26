import { useState } from "react";
import { CategoryForm } from "./components/CategoryForm";
import { LogForm } from "./components/LogForm";
import { LogList } from "./components/LogList";

type Page = "log" | "category";

function App() {
  const [page, setPage] = useState<Page>("log");
  const [refreshKey, setRefreshKey] = useState(0);
  const [categoryRefreshKey, setCategoryRefreshKey] = useState(0);

  return (
    <>
      <nav style={{ display: "flex", gap: "8px", padding: "8px", borderBottom: "1px solid #ccc" }}>
        <button onClick={() => setPage("log")} style={{ fontWeight: page === "log" ? "bold" : "normal" }}>
          ログ記録
        </button>
        <button onClick={() => setPage("category")} style={{ fontWeight: page === "category" ? "bold" : "normal" }}>
          カテゴリ管理
        </button>
      </nav>

      {page === "log" && (
        <>
          <LogForm
            onAdded={() => setRefreshKey((k) => k + 1)}
            categoryRefreshKey={categoryRefreshKey}
          />
          <LogList refreshKey={refreshKey} />
        </>
      )}

      {page === "category" && (
        <CategoryForm onAdded={() => setCategoryRefreshKey((k) => k + 1)} />
      )}
    </>
  );
}

export default App;
