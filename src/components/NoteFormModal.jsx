import { useEffect, useState } from "react";

// Note: the parent passes a `key` prop keyed by note id/"new" so this
// component remounts (and re-runs these initializers) whenever the note
// being edited changes, instead of syncing state via a useEffect.
function NoteFormModal({
  initialNote,
  categories = [],
  availableTags = [],
  onSave,
  onClose,
  saving,
}) {
  const [title, setTitle] = useState(initialNote?.title ?? "");
  const [content, setContent] = useState(initialNote?.content ?? "");
  const [categoryId, setCategoryId] = useState(initialNote?.categoryId ?? "");
  const [selectedTagNames, setSelectedTagNames] = useState(() => {
    if (!Array.isArray(initialNote?.tags)) return [];
    return initialNote.tags.map((tag) => tag?.name).filter(Boolean);
  });
  const [error, setError] = useState("");

  useEffect(() => {
    setTitle(initialNote?.title ?? "");
    setContent(initialNote?.content ?? "");
    setCategoryId(initialNote?.categoryId ?? "");
    setSelectedTagNames(
      Array.isArray(initialNote?.tags)
        ? initialNote.tags.map((tag) => tag?.name).filter(Boolean)
        : []
    );
    setError("");
  }, [initialNote]);

  const toggleTag = (tagName) => {
    setSelectedTagNames((prev) => {
      if (prev.includes(tagName)) {
        return prev.filter((name) => name !== tagName);
      }
      return [...prev, tagName];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setError("");
    try {
      const seen = new Set();
      const tagNames = selectedTagNames
        .map((tag) => tag.trim())
        .filter(Boolean)
        .filter((tag) => {
          const key = tag.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

      await onSave({
        title: title.trim(),
        content: content.trim(),
        categoryId: categoryId ? Number(categoryId) : null,
        tagNames,
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
          <div className="field">
            <label>Tags</label>
            <div className="tag-selector" role="group" aria-label="Select tags">
              {(() => {
                const tagOptions = Array.from(
                  new Set([
                    ...selectedTagNames,
                    ...availableTags.map((tag) => tag.name).filter(Boolean),
                  ])
                ).sort((a, b) => a.localeCompare(b));

                if (tagOptions.length === 0) {
                  return <p className="form-hint">Create a tag from the tag bar first.</p>;
                }

                return tagOptions.map((tagName) => (
                  <label key={tagName} style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.35rem" }}>
                    <input
                      type="checkbox"
                      checked={selectedTagNames.includes(tagName)}
                      onChange={() => toggleTag(tagName)}
                    />
                    <span>{tagName}</span>
                  </label>
                ));
              })()}
            </div>
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
