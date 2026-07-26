import { api } from "./client";

/**
 * @typedef {Object} Tag
 * @property {number} id
 * @property {string} name
 */

/**
 * @typedef {Object} Note
 * @property {number} id
 * @property {string} title
 * @property {string} content
 * @property {string} createdAt
 * @property {number|null} categoryId
 * @property {string|null} categoryName
 * @property {Tag[]} tags
 */

/**
 * @typedef {Object} CreateNotePayload
 * @property {string} title
 * @property {string} content
 */

/**
 * @typedef {Object} UpdateNotePayload
 * @property {number} id
 * @property {string} title
 * @property {string} content
 */

/**
 * Notes API service. Every method accepts the caller's JWT as the final
 * argument so it can be forwarded as an `Authorization: Bearer <token>`
 * header by the shared `api` client.
 *
 * Routes/verbs below are matched exactly against the backend's live
 * OpenAPI doc (http://localhost:5050/swagger/v1/swagger.json) - notably
 * `update` is a POST (not PUT) at `/Notes/update-notes`.
 */
export const notesAPI = {
  /** @returns {Promise<Note[]>} */
  getAll: (token) => api.get("/Notes", token),

  /** @param {CreateNotePayload} note @returns {Promise<Note>} */
  create: (note, token) => api.post("/Notes", note, token),

  /** @param {UpdateNotePayload} note @returns {Promise<Note>} */
  update: (note, token) => api.post("/Notes/update-notes", note, token),

  /** @param {number} id */
  delete: (id, token) => api.delete(`/Notes/${id}`, token),

  /** @param {number} categoryId @returns {Promise<Note[]>} */
  filterByCategory: (categoryId, token) =>
    api.get(`/Notes/filter/category/${categoryId}`, token),

  /** @param {number} tagId @returns {Promise<Note[]>} */
  filterByTag: (tagId, token) => api.get(`/Notes/filter/tag/${tagId}`, token),

  /** @param {number} noteId @param {number} categoryId */
  assignCategory: (noteId, categoryId, token) =>
    api.put("/Notes/assign-category", { noteId, categoryId }, token),

  /** @param {number} noteId @param {number} folderId */
  moveToFolder: (noteId, folderId, token) =>
    api.post("/Notes/move-to-folder", { noteId, folderId }, token),
};
