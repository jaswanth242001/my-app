import { useState } from "react";

// Note: the parent passes a `key` prop keyed by note id/"new" so this
// component remounts (and re-runs these initializers) whenever the note
// being edited changes, instead of syncing state via a useEffect.
function NoteFormModal({ initialNote, categories = [], onSave, onClose, saving }) {
  const [title, setTitle] = useState(initialNote?.title ?? "");
  const [content, setContent] = useState(initialNote?.content ?? "");
  const [categoryId, setCategoryId] = useState(initialNote?.categoryId ?? "");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setError("");
    try {
      await onSave({
        title: title.trim(),
        content: content.trim(),
        categoryId: categoryId ? Number(categoryId) : null,
      });
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
          <div className="field">
            <label htmlFor="note-category">Category</label>
            <select
              id="note-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
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
