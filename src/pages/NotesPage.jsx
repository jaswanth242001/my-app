import { useState } from "react";
import { useNotes } from "../hooks/useNotes";
import { useCategories } from "../hooks/useCategories";
import NoteCard from "../components/NoteCard";
import NoteFormModal from "../components/NoteFormModal";

function NotesPage() {
  const {
    visibleNotes,
    availableTags,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    creating,
    creatingTag,
    tagging,
    updating,
    activeFilter,
    createNote,
    updateNote,
    deleteNote,
    createTag,
    assignCategoryToNote,
    assignTagToNote,
    removeTagFromNote,
    filterByCategory,
    filterByTag,
    clearFilter,
  } = useNotes();

  const {
    categories,
    error: categoriesError,
    creating: creatingCategory,
    createCategory,
  } = useCategories();

  const [editingNote, setEditingNote] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newTagName, setNewTagName] = useState("");

  const openCreate = () => {
    setEditingNote(null);
    setShowForm(true);
  };

  const openEdit = (note) => {
    setEditingNote(note);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingNote(null);
  };

  const resolveTagByName = async (name) => {
    const key = name.toLowerCase();
    const existing = availableTags.find((tag) => tag.name.toLowerCase() === key);
    if (existing) return existing;
    return createTag(name);
  };

  const syncTagsForNote = async (noteId, currentTags, desiredTagNames) => {
    const desiredTags = [];
    for (const tagName of desiredTagNames) {
      // Create missing tags first, then assign to this note.
      const resolved = await resolveTagByName(tagName);
      if (resolved?.id != null) desiredTags.push(resolved);
    }

    const currentById = new Map(
      (currentTags || [])
        .map((tag) => [tag?.id ?? tag?.tagId, tag])
        .filter(([id]) => id != null)
    );
    const desiredById = new Map(desiredTags.map((tag) => [tag.id, tag]));

    for (const [id, tag] of desiredById) {
      if (!currentById.has(id)) {
        await assignTagToNote(noteId, tag);
      }
    }

    for (const id of currentById.keys()) {
      if (!desiredById.has(id)) {
        await removeTagFromNote(noteId, id);
      }
    }
  };

  const handleSave = async ({ title, content, categoryId, tagNames }) => {
    if (editingNote) {
      const id = editingNote.id ?? editingNote.noteId;
      await updateNote({ id, title, content });
      const currentCategoryId = editingNote.categoryId ?? null;
      if (categoryId !== currentCategoryId) {
        await assignCategoryToNote(id, categoryId);
      }

      await syncTagsForNote(id, editingNote.tags || [], tagNames || []);
    } else {
      const created = await createNote({ title, content });
      const createdId = created.id ?? created.noteId;
      if (categoryId) {
        await assignCategoryToNote(createdId, categoryId);
      }
      await syncTagsForNote(createdId, [], tagNames || []);
    }
    closeForm();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      await deleteNote(id);
    } catch {
      // error already surfaced via `error` state from useNotes
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      await createCategory({ name });
      setNewCategoryName("");
    } catch {
      // error already surfaced via `categoriesError` state
    }
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    const name = newTagName.trim();
    if (!name) return;
    try {
      await createTag(name);
      setNewTagName("");
    } catch {
      // error already surfaced via `error` state from useNotes
    }
  };

  return (
    <div className="notes-page">
      <div className="category-bar">
        <button
          type="button"
          className={`category-chip ${!activeFilter ? "active" : ""}`}
          onClick={clearFilter}
        >
          All notes
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`category-chip ${
              activeFilter?.type === "category" && activeFilter.value === category.id
                ? "active"
                : ""
            }`}
            onClick={() => filterByCategory(category.id)}
          >
            {category.name}
          </button>
        ))}

        <form className="category-add-form" onSubmit={handleCreateCategory}>
          <input
            placeholder="New category"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <button type="submit" disabled={creatingCategory || !newCategoryName.trim()}>
            +
          </button>
        </form>
      </div>

      <div className="tag-bar">
        {availableTags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            className={`tag-chip ${
              activeFilter?.type === "tag" && activeFilter.value === tag.id
                ? "active"
                : ""
            }`}
            onClick={() => filterByTag(tag.id)}
          >
            #{tag.name}
          </button>
        ))}

        <form className="tag-add-form" onSubmit={handleCreateTag}>
          <input
            placeholder="New tag"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
          />
          <button type="submit" disabled={creatingTag || !newTagName.trim()}>
            +
          </button>
        </form>
      </div>

      {categoriesError && <p className="form-error">{categoriesError}</p>}
      {tagging && <p className="notes-status">Updating tags...</p>}

      <div className="notes-toolbar">
        <input
          className="notes-search"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && <p className="notes-status">Loading notes...</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && visibleNotes.length === 0 && (
        <div className="notes-empty">
          <p>No notes yet. Create your first one!</p>
        </div>
      )}

      <div className="notes-grid">
        {visibleNotes.map((note) => (
          <NoteCard
            key={note.id ?? note.noteId}
            note={note}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <button className="fab" onClick={openCreate} aria-label="New note">
        +
      </button>

      {showForm && (
        <NoteFormModal
          key={editingNote?.id ?? editingNote?.noteId ?? "new"}
          initialNote={editingNote}
          categories={categories}
          availableTags={availableTags}
          onSave={handleSave}
          onClose={closeForm}
          saving={creating || updating}
        />
      )}
    </div>
  );
}

export default NotesPage;

