import { useState } from "react";
import { useNotes } from "../hooks/useNotes";
import { useCategories } from "../hooks/useCategories";
import NoteCard from "../components/NoteCard";
import NoteFormModal from "../components/NoteFormModal";

function NotesPage() {
  const {
    notes,
    visibleNotes,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    creating,
    updating,
    activeFilter,
    createNote,
    updateNote,
    deleteNote,
    assignCategoryToNote,
    filterByCategory,
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

  const handleSave = async ({ title, content, categoryId }) => {
    if (editingNote) {
      const id = editingNote.id ?? editingNote.noteId;
      await updateNote({ id, title, content });
      const currentCategoryId = editingNote.categoryId ?? null;
      if (categoryId !== currentCategoryId) {
        await assignCategoryToNote(id, categoryId);
      }
    } else {
      const created = await createNote({ title, content });
      if (categoryId) {
        await assignCategoryToNote(created.id ?? created.noteId, categoryId);
      }
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

      {categoriesError && <p className="form-error">{categoriesError}</p>}

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
          onSave={handleSave}
          onClose={closeForm}
          saving={creating || updating}
        />
      )}
    </div>
  );
}

export default NotesPage;

