import { useState } from "react";
import { CategoryForm } from "./components/CategoryForm";
import { CalendarView } from "./components/CalendarView";
import { Dashboard } from "./components/Dashboard";
import { TaskPage } from "./components/TaskPage";
import { DeskScene } from "./components/DeskScene";
import { HomePage } from "./components/HomePage";
import { BottomNav, type Page } from "./components/BottomNav";
import "./App.css";

function App() {
  const [page, setPage] = useState<Page>("log");
  const [categoryRefreshKey, setCategoryRefreshKey] = useState(0);

  return (
    <div className="app">
      {page === "log" ? (
        <DeskScene raw>
          <HomePage categoryRefreshKey={categoryRefreshKey} />
        </DeskScene>
      ) : (
        <DeskScene>
          {page === "category" && (
            <CategoryForm onAdded={() => setCategoryRefreshKey((k) => k + 1)} />
          )}
          {page === "task"      && <TaskPage />}
          {page === "calendar"  && <CalendarView />}
          {page === "dashboard" && <Dashboard />}
        </DeskScene>
      )}

      <BottomNav current={page} onChange={setPage} />
    </div>
  );
}

export default App;
