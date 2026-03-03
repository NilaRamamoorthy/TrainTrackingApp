const base = () => import.meta.env.VITE_API_BASE_URL;

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${base()}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      data?.detail ||
      (typeof data === "string" ? data : null) ||
      data?.non_field_errors?.[0] ||
      "Request failed";
    throw new Error(message);
  }
  return data;
}

export const api = {
  register: (payload) => request("/api/auth/register/", { method: "POST", body: payload }),
  login: (payload) => request("/api/auth/login/", { method: "POST", body: payload }),
  forgotPassword: (payload) =>
    request("/api/auth/forgot-password/", { method: "POST", body: payload }),
};