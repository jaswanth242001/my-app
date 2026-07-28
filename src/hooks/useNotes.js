import { useCallback, useEffect, useMemo, useState } from "react";
import { notesAPI } from "../api/notesApi";
import { tagsAPI } from "../api/tagsApi";
import { useAuth } from "../context/AuthContext";
import { useDebounce } from "./useDebounce";

const CACHE_TTL_MS = 30_000;
// Module-level cache shared by every `useNotes()` instance, keyed by token,
// so switching between components doesn't trigger a duplicate fetch.
const notesCache = new Map();

function normalizeNotes(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.notes)) return data.notes;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getNoteId(note) {
  return note?.id ?? note?.noteId;
}

function getTagId(tag) {
  return tag?.id ?? tag?.tagId;
}

function getTagName(tag) {
  return (tag?.name ?? "").trim();
}

function normalizeTag(data, fallbackName = "") {
  if (!data) return null;
  const candidate = data.tag ?? data.data ?? data;
  const id = getTagId(candidate);
  const name = getTagName(candidate) || fallbackName.trim();
  if (id == null || !name) return null;
  return { id, name };
}

function normalizeNotePatch(data) {
  const candidate = data?.note ?? data?.data ?? data;
  return candidate && typeof candidate === "object" ? candidate : {};
}

/**
 * Custom hook that owns all Notes state: fetching, CRUD, category/tag
 * filtering, moving between folders, plus local search & sort helpers.
 *
 * @returns {{
 *   notes: import("../api/notesApi").Note[],
 *   visibleNotes: import("../api/notesApi").Note[],
 *   loading: boolean,
 *   error: string,
 *   creating: boolean,
 *   creatingTag: boolean,
 *   updating: boolean,
 *   deletingId: number|string|null,
 *   assigning: boolean,
 *   tagging: boolean,
 *   moving: boolean,
 *   activeFilter: { type: "category"|"tag", value: number } | null,
 *   availableTags: import("../api/tagsApi").Tag[],
 *   searchTerm: string,
 *   setSearchTerm: (term: string) => void,
 *   sortBy: "date"|"title"|"category",
 *   setSortBy: (sortBy: "date"|"title"|"category") => void,
 *   sortOrder: "asc"|"desc",
 *   setSortOrder: (order: "asc"|"desc") => void,
 *   refetch: () => Promise<void>,
 *   createNote: (note: import("../api/notesApi").CreateNotePayload) => Promise<any>,
 *   updateNote: (note: import("../api/notesApi").UpdateNotePayload) => Promise<any>,
 *   deleteNote: (id: number) => Promise<void>,
 *   assignCategoryToNote: (noteId: number, categoryId: number) => Promise<any>,
 *   createTag: (name: string) => Promise<any>,
 *   assignTagToNote: (noteId: number, tag: import("../api/tagsApi").Tag) => Promise<any>,
 *   removeTagFromNote: (noteId: number, tagId: number) => Promise<any>,
 *   moveNoteToFolder: (noteId: number, folderId: number) => Promise<any>,
 *   filterByCategory: (categoryId: number) => Promise<any>,
 *   filterByTag: (tagId: number) => Promise<any>,
 *   clearFilter: () => Promise<void>,
 * }}
 */
export function useNotes() {
  const { token } = useAuth();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [creating, setCreating] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [tagging, setTagging] = useState(false);
  const [moving, setMoving] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [createdTags, setCreatedTags] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Initial load (and reload whenever the auth token changes). setState
  // calls only happen inside the promise callbacks below - never
  // synchronously in the effect body - to stay compiler/lint friendly.
  useEffect(() => {
    let ignore = false;
    const cached = notesCache.get(token);
    const isFresh = cached && Date.now() - cached.timestamp < CACHE_TTL_MS;

    const load = isFresh
      ? Promise.resolve(cached.data)
      : notesAPI.getAll(token).then((data) => {
          const normalized = normalizeNotes(data);
          notesCache.set(token, { data: normalized, timestamp: Date.now() });
          return normalized;
        });

    load
      .then((data) => {
        if (ignore) return;
        setNotes(data);
        setError("");
      })
      .catch((err) => {
        if (ignore) return;
        setError(err.message || "Could not load notes.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [token]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await notesAPI.getAll(token);
      const normalized = normalizeNotes(data);
      setNotes(normalized);
      notesCache.set(token, { data: normalized, timestamp: Date.now() });
      setActiveFilter(null);
    } catch (err) {
      setError(err.message || "Could not load notes.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createNote = useCallback(
    async (note) => {
      setCreating(true);
      setError("");
      const tempId = `temp-${Date.now()}`;
      const optimisticNote = {
        id: tempId,
        title: note.title,
        content: note.content,
        createdAt: new Date().toISOString(),
        categoryId: null,
        categoryName: null,
        tags: [],
      };
      setNotes((prev) => [optimisticNote, ...prev]);

      try {
        const created = await notesAPI.create(note, token);
        const createdPatch = normalizeNotePatch(created);
        setNotes((prev) =>
          prev.map((n) =>
            getNoteId(n) === tempId
              ? {
                  ...n,
                  ...createdPatch,
                  id: getNoteId(createdPatch) ?? getNoteId(n),
                }
              : n
          )
        );
        notesCache.delete(token);
        return createdPatch;
      } catch (err) {
        setNotes((prev) => prev.filter((n) => getNoteId(n) !== tempId));
        setError(err.message || "Could not create note.");
        throw err;
      } finally {
        setCreating(false);
      }
    },
    [token]
  );

  const updateNote = useCallback(
    async (note) => {
      setUpdating(true);
      setError("");
      let previous;
      setNotes((prev) => {
        previous = prev;
        return prev.map((n) =>
          getNoteId(n) === note.id ? { ...n, ...note } : n
        );
      });

      try {
        const updated = await notesAPI.update(note, token);
        const updatedPatch = normalizeNotePatch(updated);
        setNotes((prev) =>
          prev.map((n) =>
            getNoteId(n) === note.id
              ? {
                  ...n,
                  ...updatedPatch,
                  id: getNoteId(updatedPatch) ?? getNoteId(n),
                }
              : n
          )
        );
        notesCache.delete(token);
        return updatedPatch;
      } catch (err) {
        setNotes(previous);
        setError(err.message || "Could not update note.");
        throw err;
      } finally {
        setUpdating(false);
      }
    },
    [token]
  );

  const deleteNote = useCallback(
    async (id) => {
      setDeletingId(id);
      setError("");
      let previous;
      setNotes((prev) => {
        previous = prev;
        return prev.filter((n) => getNoteId(n) !== id);
      });

      try {
        await notesAPI.delete(id, token);
        notesCache.delete(token);
      } catch (err) {
        setNotes(previous);
        setError(err.message || "Could not delete note.");
        throw err;
      } finally {
        setDeletingId(null);
      }
    },
    [token]
  );

  const assignCategoryToNote = useCallback(
    async (noteId, categoryId) => {
      setAssigning(true);
      setError("");
      let previous;
      setNotes((prev) => {
        previous = prev;
        return prev.map((n) =>
          getNoteId(n) === noteId ? { ...n, categoryId } : n
        );
      });

      try {
        const result = await notesAPI.assignCategory(noteId, categoryId, token);
        setNotes((prev) =>
          prev.map((n) => (getNoteId(n) === noteId ? { ...n, ...result } : n))
        );
        notesCache.delete(token);
        return result;
      } catch (err) {
        setNotes(previous);
        setError(err.message || "Could not assign category.");
        throw err;
      } finally {
        setAssigning(false);
      }
    },
    [token]
  );

  const createTag = useCallback(
    async (name) => {
      const cleaned = (name || "").trim();
      if (!cleaned) {
        throw new Error("Tag name is required.");
      }

      setCreatingTag(true);
      setError("");
      try {
        const created = await tagsAPI.create({ name: cleaned }, token);
        const normalized = normalizeTag(created, cleaned) ?? { id: null, name: cleaned };
        if (normalized?.id != null) {
          setCreatedTags((prev) => {
            if (prev.some((tag) => tag.id === normalized.id)) return prev;
            return [...prev, normalized];
          });
        }
        return normalized;
      } catch (err) {
        setError(err.message || "Could not create tag.");
        throw err;
      } finally {
        setCreatingTag(false);
      }
    },
    [token]
  );

  const assignTagToNote = useCallback(
    async (noteId, tag) => {
      const tagId = getTagId(tag);
      const tagName = getTagName(tag);

      if (tagId == null) {
        throw new Error("Cannot assign tag without an id.");
      }

      setTagging(true);
      setError("");
      let previous;
      setNotes((prev) => {
        previous = prev;
        return prev.map((n) => {
          if (getNoteId(n) !== noteId) return n;
          const existing = Array.isArray(n.tags) ? n.tags : [];
          if (existing.some((t) => getTagId(t) === tagId)) return n;
          return {
            ...n,
            tags: [...existing, { id: tagId, name: tagName || `Tag #${tagId}` }],
          };
        });
      });

      try {
        const result = await tagsAPI.assign(noteId, tagId, token);
        notesCache.delete(token);
        return result;
      } catch (err) {
        setNotes(previous);
        setError(err.message || "Could not assign tag.");
        throw err;
      } finally {
        setTagging(false);
      }
    },
    [token]
  );

  const removeTagFromNote = useCallback(
    async (noteId, tagId) => {
      if (tagId == null) {
        throw new Error("Tag id is required.");
      }

      setTagging(true);
      setError("");
      let previous;
      setNotes((prev) => {
        previous = prev;
        return prev.map((n) => {
          if (getNoteId(n) !== noteId) return n;
          const existing = Array.isArray(n.tags) ? n.tags : [];
          return {
            ...n,
            tags: existing.filter((t) => getTagId(t) !== tagId),
          };
        });
      });

      try {
        const result = await tagsAPI.remove(noteId, tagId, token);
        notesCache.delete(token);
        return result;
      } catch (err) {
        setNotes(previous);
        setError(err.message || "Could not remove tag.");
        throw err;
      } finally {
        setTagging(false);
      }
    },
    [token]
  );

  const moveNoteToFolder = useCallback(
    async (noteId, folderId) => {
      setMoving(true);
      setError("");
      let previous;
      setNotes((prev) => {
        previous = prev;
        return prev.map((n) =>
          getNoteId(n) === noteId ? { ...n, categoryId: folderId } : n
        );
      });

      try {
        const result = await notesAPI.moveToFolder(noteId, folderId, token);
        setNotes((prev) =>
          prev.map((n) => (getNoteId(n) === noteId ? { ...n, ...result } : n))
        );
        notesCache.delete(token);
        return result;
      } catch (err) {
        setNotes(previous);
        setError(err.message || "Could not move note.");
        throw err;
      } finally {
        setMoving(false);
      }
    },
    [token]
  );

  const filterByCategory = useCallback(
    async (categoryId) => {
      setLoading(true);
      setError("");
      try {
        const data = await notesAPI.filterByCategory(categoryId, token);
        setNotes(normalizeNotes(data));
        setActiveFilter({ type: "category", value: categoryId });
        return data;
      } catch (err) {
        setError(err.message || "Could not filter notes by category.");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const filterByTag = useCallback(
    async (tagId) => {
      setLoading(true);
      setError("");
      try {
        const data = await notesAPI.filterByTag(tagId, token);
        setNotes(normalizeNotes(data));
        setActiveFilter({ type: "tag", value: tagId });
        return data;
      } catch (err) {
        setError(err.message || "Could not filter notes by tag.");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const clearFilter = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const availableTags = useMemo(() => {
    const byId = new Map();
    createdTags.forEach((tag) => {
      const id = getTagId(tag);
      const name = getTagName(tag);
      if (id != null && name) byId.set(id, { id, name });
    });
    notes.forEach((note) => {
      const tags = Array.isArray(note?.tags) ? note.tags : [];
      tags.forEach((tag) => {
        const id = getTagId(tag);
        const name = getTagName(tag);
        if (id != null && name) byId.set(id, { id, name });
      });
    });
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [createdTags, notes]);

  // Local, instant search + sort over whatever notes are currently loaded
  // (either the full list or the result of a server-side filter above).
  const visibleNotes = useMemo(() => {
    const query = debouncedSearchTerm.trim().toLowerCase();
    let result = notes;

    if (query) {
      result = result.filter((note) => {
        return (
          note.title?.toLowerCase().includes(query) ||
          note.content?.toLowerCase().includes(query) ||
          note.categoryName?.toLowerCase().includes(query) ||
          note.tags?.some((tag) => tag.name?.toLowerCase().includes(query))
        );
      });
    }

    const sorted = [...result].sort((a, b) => {
      const cmp =
        sortBy === "title"
          ? (a.title || "").localeCompare(b.title || "")
          : sortBy === "category"
            ? (a.categoryName || "").localeCompare(b.categoryName || "")
            : new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [notes, debouncedSearchTerm, sortBy, sortOrder]);

  return {
    notes,
    visibleNotes,
    loading,
    error,
    creating,
    creatingTag,
    updating,
    deletingId,
    assigning,
    tagging,
    moving,
    activeFilter,
    availableTags,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    refetch,
    createNote,
    updateNote,
    deleteNote,
    assignCategoryToNote,
    createTag,
    assignTagToNote,
    removeTagFromNote,
    moveNoteToFolder,
    filterByCategory,
    filterByTag,
    clearFilter,
  };
}
