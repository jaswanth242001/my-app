import { useCallback, useEffect, useMemo, useState } from "react";
import { categoriesAPI } from "../api/categoriesApi";
import { useAuth } from "../context/AuthContext";

/**
 * Fetches all categories from the backend and manages category creation.
 * Merges categories fetched from the backend with any created during the session.
 *
 * @returns {{
 *   categories: import("../api/categoriesApi").Category[],
 *   loading: boolean,
 *   creating: boolean,
 *   error: string,
 *   createCategory: (category: { name: string }) => Promise<any>,
 *   refetchCategories: () => Promise<void>,
 * }}
 */
export function useCategories() {
  const { token } = useAuth();
  const [backendCategories, setBackendCategories] = useState([]);
  const [createdCategories, setCreatedCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const fetchCategories = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await categoriesAPI.getAll(token);
      setBackendCategories(data || []);
    } catch (err) {
      setError(err.message || "Could not fetch categories.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const categories = useMemo(() => {
    const map = new Map();
    [...backendCategories, ...createdCategories].forEach((category) => {
      if (category?.id != null) map.set(category.id, category);
    });
    return [...map.values()];
  }, [backendCategories, createdCategories]);

  const createCategory = useCallback(
    async (category) => {
      setCreating(true);
      setError("");
      try {
        const created = await categoriesAPI.create(category, token);
        if (created?.id != null) {
          setCreatedCategories((prev) => [...prev, created]);
        }
        return created;
      } catch (err) {
        setError(err.message || "Could not create category.");
        throw err;
      } finally {
        setCreating(false);
      }
    },
    [token]
  );

  return { categories, loading, creating, error, createCategory, refetchCategories: fetchCategories };
}
