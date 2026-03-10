import axios from "axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URI || "http://localhost:8080";

/**
 * Lightweight error class carrying the server's errorCode + message.
 * Components can catch this and read err.message / err.errorCode.
 */
export class ApiError extends Error {
  constructor(message, errorCode, status) {
    super(message);
    this.errorCode = errorCode;
    this.status = status;
  }
}

// ─── Axios instance ──────────────────────────────────────────────────────────
const client = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ─── Response interceptor ────────────────────────────────────────────────────
client.interceptors.response.use(
  // On success: unwrap to response.data so callers get parsed JSON directly
  (response) => response.data,

  // On error: normalise into an ApiError
  (error) => {
    // Network / timeout errors (no response at all)
    if (!error.response) {
      return Promise.reject(
        new ApiError("Network error — check your connection", "NETWORK_ERROR", 0),
      );
    }

    const { status, data } = error.response;

    // Auto-redirect on 401 (session expired / not logged in)
    if (status === 401) {
      window.location.href = "/login";
      return Promise.reject(
        new ApiError(
          data?.error || "Session expired",
          data?.errorCode || "AUTH_REQUIRED",
          401,
        ),
      );
    }

    // Server returned a structured error
    const message = data?.error || `Request failed (${status})`;
    const errorCode = data?.errorCode || "UNKNOWN_ERROR";

    return Promise.reject(new ApiError(message, errorCode, status));
  },
);

// ─── Public helpers (return parsed data directly, throw ApiError on failure) ─
export async function apiGet(endpoint) {
  return client.get(endpoint);
}

export async function apiPost(endpoint, body) {
  return client.post(endpoint, body);
}

export async function apiPatch(endpoint, body) {
  return client.patch(endpoint, body);
}

export async function apiDelete(endpoint, body) {
  return client.delete(endpoint, { data: body });
}

export { BASE_URL, client };
