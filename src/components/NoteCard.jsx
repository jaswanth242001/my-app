const CARD_COLORS = ["card-tint-a", "card-tint-b", "card-tint-c", "card-tint-d"];

function colorForId(id) {
  const str = String(id ?? "0");
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash + str.charCodeAt(i)) % CARD_COLORS.length;
  }
  return CARD_COLORS[hash];
}

function NoteCard({ note, onEdit, onDelete }) {
  const id = note.id ?? note.noteId;
  return (
    <article className={`note-card ${colorForId(id)}`}>
      {note.categoryName && (
        <span className="note-card-category">{note.categoryName}</span>
      )}
      <h3>{note.title}</h3>
      <p>{note.content}</p>
      <div className="note-card-actions">
        <button type="button" onClick={() => onEdit(note)}>
          Edit
        </button>
        <button type="button" className="danger" onClick={() => onDelete(id)}>
          Delete
        </button>
      </div>
    </article>
  );
}

export default NoteCard;
