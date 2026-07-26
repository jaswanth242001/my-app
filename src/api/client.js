const BASE_URL = "/api";

// Registered by AuthContext so the API layer can react to an expired/invalid
// session (401) without importing the context here (would create a cycle).
let unauthorizedHandler = null;
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(
  path,
  { method = "GET", body, token, headers = {}, retries = method === "GET" ? 1 : 0 } = {}
) {
  let attempt = 0;

  while (true) {
    let response;
    try {
      response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (networkError) {
      if (attempt < retries) {
        attempt += 1;
        await delay(300 * attempt);
        continue;
      }
      throw new Error(networkError.message || "Network error. Please check your connection.", {
        cause: networkError,
      });
    }

    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (response.status === 401) {
      unauthorizedHandler?.();
    }

    if (!response.ok) {
      const message =
        (data && (data.message || data.title || data.error)) ||
        `Request failed (${response.status})`;
      throw new Error(message);
    }

    return data;
  }
}

export const api = {
  get: (path, token) => request(path, { method: "GET", token }),
  post: (path, body, token) => request(path, { method: "POST", body, token }),
  put: (path, body, token) => request(path, { method: "PUT", body, token }),
  delete: (path, token) => request(path, { method: "DELETE", token }),
};
