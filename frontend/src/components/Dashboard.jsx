import { useCallback, useEffect, useState } from "react";
import { graphqlRequest } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import TaskEditor from "./TaskEditor.jsx";
import TaskRow from "./TaskRow.jsx";

const PAGE_SIZE = 8;
const TASK_FIELDS = "id title description completed createdAt updatedAt";

export default function Dashboard() {
  const { session, signOut } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    const filter = status === "ALL" ? null : { completed: status === "COMPLETED" };
    try {
      const data = await graphqlRequest(
        `query GetTasks($filter: TaskFilterInput, $sortBy: TaskSortField, $sortOrder: SortOrder, $page: Int, $limit: Int) { getTasks(filter: $filter, sortBy: $sortBy, sortOrder: $sortOrder, page: $page, limit: $limit) { ${TASK_FIELDS} } }`,
        { filter, sortBy: "CREATED_AT", sortOrder: "DESC", page, limit: PAGE_SIZE + 1 },
        session.token
      );
      setHasNextPage(data.getTasks.length > PAGE_SIZE);
      setTasks(data.getTasks.slice(0, PAGE_SIZE));
      setSearchResults(null);
    } catch (requestError) {
      if (requestError.message.includes("Authentication required") || requestError.message.includes("jwt expired")) {
        signOut();
      } else {
        setError(requestError.message);
      }
    } finally {
      setLoading(false);
    }
  }, [page, session.token, signOut, status]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const mutate = async (query, variables) => {
    setBusy(true);
    setError("");
    setSearch("");
    try {
      await graphqlRequest(query, variables, session.token);
      await loadTasks();
      return true;
    } catch (requestError) {
      if (requestError.message.includes("Authentication required") || requestError.message.includes("jwt expired")) {
        signOut();
      } else {
        setError(requestError.message);
      }
      return false;
    } finally {
      setBusy(false);
    }
  };

  const addTask = (values) =>
    mutate(
      `mutation CreateTask($title: String!, $description: String) { createTask(title: $title, description: $description) { id } }`,
      values
    );

  const updateTask = (id, values) =>
    mutate(
      `mutation UpdateTask($id: ID!, $title: String, $description: String, $completed: Boolean) { updateTask(id: $id, title: $title, description: $description, completed: $completed) { id } }`,
      { id, ...values }
    );

  const toggleTask = (task) => updateTask(task.id, { completed: !task.completed });

  const deleteTask = async (id) => {
    if (!window.confirm("Delete this task? This can’t be undone.")) return;
    await mutate("mutation DeleteTask($id: ID!) { deleteTask(id: $id) }", { id });
  };

  const submitSearch = async (event) => {
    event.preventDefault();
    const keyword = search.trim();
    if (!keyword) {
      setSearchResults(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await graphqlRequest(
        `query SearchTasks($keyword: String!) { searchTasks(keyword: $keyword) { ${TASK_FIELDS} } }`,
        { keyword },
        session.token
      );
      setSearchResults(data.searchTasks);
    } catch (requestError) {
      if (requestError.message.includes("Authentication required") || requestError.message.includes("jwt expired")) {
        signOut();
      } else {
        setError(requestError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = (nextStatus) => {
    setStatus(nextStatus);
    setPage(1);
    setSearch("");
    setSearchResults(null);
  };

  const visibleTasks = searchResults ?? tasks;
  const completedCount = tasks.filter((task) => task.completed).length;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a aria-label="Task management home" className="wordmark" href="#">
          <span className="brand-mark small">✓</span>
          <span>Task Management</span>
        </a>
        <div className="topbar-right">
          <span className="user-avatar">{session.user.name.slice(0, 1).toUpperCase()}</span>
          <span className="user-name">{session.user.name}</span>
          <button className="button quiet signout" onClick={signOut} type="button">
            Sign out <span aria-hidden="true">↗</span>
          </button>
        </div>
      </header>

      <main className="dashboard">
        <section className="welcome">
          <div>
            <p className="eyebrow">YOUR PERSONAL SPACE</p>
            <h1>
              Good things take <em>one step.</em>
            </h1>
            <p className="welcome-copy">A little progress adds up. What’s on your mind today?</p>
          </div>
          <div className="progress-card">
            <div className="progress-ring">
              <span>
                {tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0}
                <small>%</small>
              </span>
            </div>
            <div>
              <strong>Page progress</strong>
              <small>
                {completedCount} of {tasks.length} tasks on this page
              </small>
            </div>
          </div>
        </section>

        <section aria-label="Add a task" className="add-section">
          <div className="section-heading">
            <div>
              <span className="section-icon">✳</span>
              <h2>Start with a task</h2>
            </div>
            <span className="hint">Keep it simple. You’ve got this.</span>
          </div>
          <TaskEditor busy={busy} onSave={addTask} />
        </section>

        <section aria-label="Your tasks" className="tasks-section">
          <div className="section-heading task-heading">
            <div>
              <span className="section-icon list-icon">☷</span>
              <h2>Your tasks</h2>
              <span className="task-total">{searchResults ? searchResults.length : tasks.length}</span>
            </div>
            <form className="search-form" onSubmit={submitSearch}>
              <span aria-hidden="true">⌕</span>
              <label className="sr-only" htmlFor="task-search">
                Search tasks
              </label>
              <input
                id="task-search"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search your tasks"
                value={search}
              />
              {searchResults && (
                <button
                  aria-label="Clear search"
                  className="clear-search"
                  onClick={() => {
                    setSearch("");
                    setSearchResults(null);
                  }}
                  type="button"
                >
                  ×
                </button>
              )}
            </form>
          </div>

          <div className="task-toolbar">
            <div className="filters" aria-label="Filter tasks" role="group">
              {[
                ["ALL", "All"],
                ["ACTIVE", "To do"],
                ["COMPLETED", "Completed"]
              ].map(([value, label]) => (
                <button
                  aria-pressed={status === value}
                  className={`filter-button${status === value ? " selected" : ""}`}
                  key={value}
                  onClick={() => changeStatus(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            {searchResults && <span className="search-label">Search results for “{search.trim()}”</span>}
          </div>

          {error && (
            <p className="notice error page-notice" role="alert">
              {error}
            </p>
          )}

          {loading ? (
            <div aria-label="Loading tasks" className="loading-state">
              <span className="spinner" /> Loading your tasks…
            </div>
          ) : visibleTasks.length ? (
            <>
              <ul className="task-list">
                {visibleTasks.map((task) => (
                  <TaskRow
                    busy={busy}
                    key={task.id}
                    onDelete={deleteTask}
                    onEdit={updateTask}
                    onToggle={toggleTask}
                    task={task}
                  />
                ))}
              </ul>
              {!searchResults && (
                <div className="pagination">
                  <span>Page {page}</span>
                  <div>
                    <button
                      className="button quiet"
                      disabled={page <= 1 || loading}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      type="button"
                    >
                      ← Previous
                    </button>
                    <button
                      className="button quiet"
                      disabled={!hasNextPage || loading}
                      onClick={() => setPage((current) => current + 1)}
                      type="button"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <span className="empty-mark">{searchResults ? "⌕" : "✳"}</span>
              <h3>
                {searchResults
                  ? "No matching tasks"
                  : status === "COMPLETED"
                  ? "Nothing completed just yet"
                  : "A clean slate"}
              </h3>
              <p>
                {searchResults
                  ? "Try another keyword or check your spelling."
                  : status === "ACTIVE"
                  ? "You’re all caught up on active tasks."
                  : "Add a task above and make today count."}
              </p>
            </div>
          )}
        </section>

        <footer className="dashboard-footer">
          <span>Made for steady progress.</span>
          <span>
            TASK MANAGEMENT <b>·</b> TASKS WITH INTENTION
          </span>
        </footer>
      </main>
    </div>
  );
}

