import { useState } from "react";
import { useNotes } from "../hooks/useNotes";
import { useCategories } from "../hooks/useCategories";
import { NotesProvider, useNotesContext } from "../context/NotesContext";

/**
 * Usage examples for `useNotes` / `useCategories`. These are not wired into
 * any route - they exist purely as reference implementations you can copy
 * into real pages/components.
 */

// ---------------------------------------------------------------------------
// 1. Basic list with loading / error states, search and sort.
// ---------------------------------------------------------------------------
export function NotesListExample() {
  const {
    visibleNotes,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    deletingId,
    deleteNote,
    refetch,
  } = useNotes();

  if (loading) return <p>Loading notes...</p>;
  if (error) {
    return (
      <div>
        <p role="alert">{error}</p>
        <button type="button" onClick={refetch}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        placeholder="Search notes..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
        <option value="date">Date</option>
        <option value="title">Title</option>
        <option value="category">Category</option>
      </select>
      <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
        <option value="desc">Descending</option>
        <option value="asc">Ascending</option>
      </select>

      <ul>
        {visibleNotes.map((note) => (
          <li key={note.id}>
            <strong>{note.title}</strong> ({note.categoryName ?? "Uncategorized"})
            <button
              type="button"
              disabled={deletingId === note.id}
              onClick={() => deleteNote(note.id)}
            >
              {deletingId === note.id ? "Deleting..." : "Delete"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Creating a note and assigning it a category (two API calls, since the
//    create endpoint only accepts { title, content }).
// ---------------------------------------------------------------------------
export function CreateNoteWithCategoryExample() {
  const { notes, createNote, assignCategoryToNote, creating, assigning, error } = useNotes();
  const { categories } = useCategories();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const created = await createNote({ title, content });
    if (categoryId) {
      await assignCategoryToNote(created.id, Number(categoryId));
    }
    setTitle("");
    setContent("");
    setCategoryId("");
  };

  const busy = creating || assigning;

  return (
    <form onSubmit={handleSubmit}>
      {error && <p role="alert">{error}</p>}
      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        placeholder="Content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <select
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
      <button type="submit" disabled={busy}>
        {busy ? "Saving..." : "Create note"}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// 3. Filtering notes by category or tag.
// ---------------------------------------------------------------------------
export function FilterNotesExample() {
  const { notes, visibleNotes, loading, activeFilter, filterByCategory, filterByTag, clearFilter } =
    useNotes();
  const { categories } = useCategories();

  return (
    <div>
      <div>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            disabled={activeFilter?.type === "category" && activeFilter.value === category.id}
            onClick={() => filterByCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => filterByTag(1)}
          disabled={activeFilter?.type === "tag" && activeFilter.value === 1}
        >
          Tag #1
        </button>
        {activeFilter && (
          <button type="button" onClick={clearFilter}>
            Clear filter
          </button>
        )}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {visibleNotes.map((note) => (
            <li key={note.id}>{note.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. Moving a note into a different folder/category.
// ---------------------------------------------------------------------------
export function MoveNoteExample({ noteId }) {
  const { notes, moving, moveNoteToFolder, error } = useNotes();
  const { categories } = useCategories();

  return (
    <div>
      {error && <p role="alert">{error}</p>}
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          disabled={moving}
          onClick={() => moveNoteToFolder(noteId, category.id)}
        >
          Move to {category.name}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. Sharing one notes/categories instance across a subtree via context.
// ---------------------------------------------------------------------------
function CategorySidebar() {
  const { categoriesStore } = useNotesContext();
  return (
    <ul>
      {categoriesStore.categories.map((category) => (
        <li key={category.id}>{category.name}</li>
      ))}
    </ul>
  );
}

function NotesGrid() {
  const { notesStore } = useNotesContext();
  if (notesStore.loading) return <p>Loading notes...</p>;
  return (
    <ul>
      {notesStore.visibleNotes.map((note) => (
        <li key={note.id}>{note.title}</li>
      ))}
    </ul>
  );
}

export function SharedStateExample() {
  return (
    <NotesProvider>
      <CategorySidebar />
      <NotesGrid />
    </NotesProvider>
  );
}
