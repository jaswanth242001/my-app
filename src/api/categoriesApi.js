import { api } from "./client";

/**
 * @typedef {Object} Category
 * @property {number} id
 * @property {string} name
 */

/**
 * Categories/folders API service. Every method accepts the caller's JWT as
 * the final argument so it can be forwarded as an `Authorization: Bearer
 * <token>` header by the shared `api` client.
 */
export const categoriesAPI = {
  /** @param {{ name: string }} category @returns {Promise<Category>} */
  create: (category, token) => api.post("/Categories", category, token),

  /** @returns {Promise<Category[]>} */
  getAll: (token) => api.get("/Categories", token),

  /** @param {number} id @param {{ name: string }} category @returns {Promise<Category>} */
  update: (id, category, token) => api.put(`/Categories/${id}`, category, token),

  /** @param {number} id @returns {Promise<void>} */
  delete: (id, token) => api.delete(`/Categories/${id}`, token),
};
