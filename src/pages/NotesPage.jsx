import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import NoteCard from "../components/NoteCard";
import NoteFormModal from "../components/NoteFormModal";

function normalizeNotes(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.notes)) return data.notes;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function NotesPage() {
  const { token } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/Notes", token);
      setNotes(normalizeNotes(data));
    } catch (err) {
      setError(err.message || "Could not load notes.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

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

  const handleSave = async ({ title, content }) => {
    setSaving(true);
    try {
      if (editingNote) {
        const id = editingNote.id ?? editingNote.noteId;
        await api.post("/Notes/update-notes", { id, title, content }, token);
      } else {
        await api.post("/Notes", { title, content }, token);
      }
      closeForm();
      await loadNotes();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      await api.delete(`/Notes/${id}`, token);
      setNotes((prev) => prev.filter((n) => (n.id ?? n.noteId) !== id));
    } catch (err) {
      setError(err.message || "Could not delete note.");
    }
  };

  const filteredNotes = notes.filter((note) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      note.title?.toLowerCase().includes(q) ||
      note.content?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="notes-page">
      <div className="notes-toolbar">
        <input
          className="notes-search"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <p className="notes-status">Loading notes...</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && filteredNotes.length === 0 && (
        <div className="notes-empty">
          <p>No notes yet. Create your first one!</p>
        </div>
      )}

      <div className="notes-grid">
        {filteredNotes.map((note) => (
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
          initialNote={editingNote}
          onSave={handleSave}
          onClose={closeForm}
          saving={saving}
        />
      )}
    </div>
  );
}

export default NotesPage;
