import { createContext, useContext } from "react";
import { useNotes } from "../hooks/useNotes";
import { useCategories } from "../hooks/useCategories";

const NotesContext = createContext(null);

/**
 * Optional global-state provider so multiple components (e.g. a sidebar of
 * folders + a notes grid) can share one `useNotes()`/`useCategories()`
 * instance instead of each fetching independently. Wrap a subtree with
 * `<NotesProvider>` and read state with `useNotesContext()`.
 */
export function NotesProvider({ children }) {
  const notesStore = useNotes();
  const categoriesStore = useCategories();

  return (
    <NotesContext.Provider value={{ notesStore, categoriesStore }}>
      {children}
    </NotesContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotesContext() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error("useNotesContext must be used within a NotesProvider");
  }
  return context;
}
