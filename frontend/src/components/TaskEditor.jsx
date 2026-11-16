import { useState } from "react";

export default function TaskEditor({ initialTask, onCancel, onSave, busy }) {
  const [title, setTitle] = useState(initialTask?.title || "");
  const [description, setDescription] = useState(initialTask?.description || "");

  const submit = async (event) => {
    event.preventDefault();
    const saved = await onSave({ title: title.trim(), description: description.trim() });
    if (saved && !initialTask) {
      setTitle("");
      setDescription("");
    }
  };

  return (
    <form className="task-editor" onSubmit={submit}>
      <label className="sr-only" htmlFor={initialTask ? `edit-title-${initialTask.id}` : "new-task-title"}>
        Task title
      </label>
      <input
        autoFocus
        id={initialTask ? `edit-title-${initialTask.id}` : "new-task-title"}
        maxLength="160"
        onChange={(event) => setTitle(event.target.value)}
        placeholder="What needs to get done?"
        required
        value={title}
      />
      <label className="sr-only" htmlFor={initialTask ? `edit-description-${initialTask.id}` : "new-task-description"}>
        Task description
      </label>
      <textarea
        id={initialTask ? `edit-description-${initialTask.id}` : "new-task-description"}
        maxLength="2000"
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Add a few details (optional)"
        rows="2"
        value={description}
      />
      <div className="editor-actions">
        <button className="button primary" disabled={busy} type="submit">
          {busy ? "Saving…" : initialTask ? "Save changes" : "Add task"}
        </button>
        {onCancel && (
          <button className="button quiet" onClick={onCancel} type="button">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

