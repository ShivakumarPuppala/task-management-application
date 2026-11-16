import { useState } from "react";
import TaskEditor from "./TaskEditor.jsx";

export default function TaskRow({ task, onToggle, onDelete, onEdit, busy }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="task-item editing">
        <TaskEditor
          busy={busy}
          initialTask={task}
          onCancel={() => setEditing(false)}
          onSave={async (values) => {
            const saved = await onEdit(task.id, values);
            if (saved) setEditing(false);
          }}
        />
      </li>
    );
  }

  return (
    <li className={`task-item${task.completed ? " is-complete" : ""}`}>
      <button
        aria-checked={task.completed}
        aria-label={`${task.completed ? "Mark incomplete" : "Mark complete"}: ${task.title}`}
        className="check-button"
        onClick={() => onToggle(task)}
        role="checkbox"
        type="button"
      >
        {task.completed && <span aria-hidden="true">✓</span>}
      </button>
      <div className="task-main">
        <span className="task-title">{task.title}</span>
        {task.description && <p className="task-description">{task.description}</p>}
        <span className="task-date">
          Added {new Date(task.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
      </div>
      <div className="task-actions">
        <button
          aria-label={`Edit ${task.title}`}
          className="icon-button"
          onClick={() => setEditing(true)}
          title="Edit task"
          type="button"
        >
          ✎
        </button>
        <button
          aria-label={`Delete ${task.title}`}
          className="icon-button delete-action"
          disabled={busy}
          onClick={() => onDelete(task.id)}
          title="Delete task"
          type="button"
        >
          ×
        </button>
      </div>
    </li>
  );
}

