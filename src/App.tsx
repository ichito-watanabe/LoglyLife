import { useState } from "react";
import { CategoryForm } from "./components/CategoryForm";
import { LogForm } from "./components/LogForm";
import { LogList } from "./components/LogList";
import { CalendarView } from "./components/CalendarView";
import { Dashboard } from "./components/Dashboard";
import { TaskPage } from "./components/TaskPage";
import { DeskScene } from "./components/DeskScene";
import { BottomNav, type Page } from "./components/BottomNav";
import "./App.css";

function App() {
  const [page, setPage] = useState<Page>("log");
  const [refreshKey, setRefreshKey] = useState(0);
  const [categoryRefreshKey, setCategoryRefreshKey] = useState(0);

  return (
    <div className="app">
      <DeskScene>
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
        {page === "task"      && <TaskPage />}
        {page === "calendar"  && <CalendarView />}
        {page === "dashboard" && <Dashboard />}
      </DeskScene>

      <BottomNav current={page} onChange={setPage} />
    </div>
  );
}

export default App;
