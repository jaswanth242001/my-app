import { api } from "./client";

/**
 * @typedef {Object} Tag
 * @property {number} id
 * @property {string} name
 */

/**
 * Tags API service.
 * Backend routes from swagger:
 * - POST /api/Tags
 * - POST /api/Tags/assign
 * - POST /api/Tags/remove
 */
export const tagsAPI = {
  /** @param {{ name: string }} tag @returns {Promise<Tag>} */
  create: (tag, token) => api.post("/Tags", tag, token),

  /** @param {number} noteId @param {number} tagId */
  assign: (noteId, tagId, token) => api.post("/Tags/assign", { noteId, tagId }, token),

  /** @param {number} noteId @param {number} tagId */
  remove: (noteId, tagId, token) => api.post("/Tags/remove", { noteId, tagId }, token),
};
