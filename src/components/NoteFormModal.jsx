import { useEffect, useState } from "react";

function NoteFormModal({ initialNote, onSave, onClose, saving }) {
  const [title, setTitle] = useState(initialNote?.title ?? "");
  const [content, setContent] = useState(initialNote?.content ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    setTitle(initialNote?.title ?? "");
    setContent(initialNote?.content ?? "");
  }, [initialNote]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setError("");
    try {
      await onSave({ title: title.trim(), content: content.trim() });
    } catch (err) {
      setError(err.message || "Could not save the note.");
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{initialNote ? "Edit note" : "New note"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="note-title">Title</label>
            <input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="field">
            <label htmlFor="note-content">Content</label>
            <textarea
              id="note-content"
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NoteFormModal;
