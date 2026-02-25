const BASE_URL = import.meta.env.VITE_BACKEND_URI || "http://localhost:8080";

async function request(endpoint, options = {}) {
  const { method = "GET", body, headers = {} } = options;

  const config = {
    method,
    credentials: "include",
    headers: { ...headers },
  };

  if (body !== undefined) {
    config.headers["Content-Type"] = "application/json";
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  return response;
}

export async function apiGet(endpoint) {
  return request(endpoint);
}

export async function apiPost(endpoint, body) {
  return request(endpoint, { method: "POST", body });
}

export async function apiPatch(endpoint, body) {
  return request(endpoint, { method: "PATCH", body });
}

export async function apiDelete(endpoint, body) {
  return request(endpoint, { method: "DELETE", body });
}

export { BASE_URL };
