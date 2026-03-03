const base = () => import.meta.env.VITE_API_BASE_URL;

function getAccess() {
  return localStorage.getItem("access_token");
}

function getRefresh() {
  return localStorage.getItem("refresh_token");
}

function authHeaders(token = getAccess()) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function refreshAccessToken() {
  const refresh = getRefresh();
  if (!refresh) throw new Error("Session expired. Please login again.");

  const res = await fetch(`${base()}/api/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.access) {
    throw new Error(data?.detail || "Session expired. Please login again.");
  }

  localStorage.setItem("access_token", data.access);
  return data.access;
}

async function fetchWithAuth(path, options = {}) {
  let token = getAccess();

  const doFetch = (tok) =>
    fetch(`${base()}${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...authHeaders(tok),
      },
    });

  let res = await doFetch(token);

  if (res.status === 401) {
    const newAccess = await refreshAccessToken();
    res = await doFetch(newAccess);
  }

  // ✅ Try JSON, else fallback to text (important for 500)
  let data = null;
  let text = "";
  const ct = res.headers.get("content-type") || "";

  if (ct.includes("application/json")) {
    data = await res.json().catch(() => null);
  } else {
    text = await res.text().catch(() => "");
  }

  if (!res.ok) {
    let msg =
      data?.detail ||
      data?.error ||
      (data && typeof data === "object"
        ? Object.entries(data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
            .join(" | ")
        : null) ||
      (text ? text.slice(0, 300) : null) ||
      `Request failed (${res.status})`;

    throw new Error(msg);
  }

  return data;
}

export function fetchStations() {
  return fetchWithAuth("/api/stations/", { method: "GET" });
}

export function searchTrains({ fromId, toId, date }) {
  const qs = new URLSearchParams({
    from: String(fromId),
    to: String(toId),
    date: String(date),
  }).toString();

  return fetchWithAuth(`/api/search-trains/?${qs}`, { method: "GET" });
}

export function createBooking(payload) {
  return fetchWithAuth("/api/bookings/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchMyBookings(type = "upcoming") {
  const qs = new URLSearchParams({ type }).toString();
  return fetchWithAuth(`/api/my-bookings/?${qs}`, { method: "GET" });
}

export function cancelBooking(bookingId) {
  return fetchWithAuth(`/api/bookings/${bookingId}/cancel/`, {
    method: "POST",
  });
}

export function fetchBookingDetail(id) {
  return fetchWithAuth(`/api/bookings/${id}/`, { method: "GET" });
}

// ✅ Notifications (use fetchWithAuth so token refresh works)
export function fetchNotificationBadge() {
  return fetchWithAuth("/api/notification-badge/", { method: "GET" });
}

export function fetchNotifications() {
  return fetchWithAuth("/api/my-notifications/", { method: "GET" });
}

export function markNotificationRead(id) {
  return fetchWithAuth(`/api/my-notifications/${id}/read/`, { method: "POST" });
}

// assumes you already have fetchWithAuth implemented

export function parcelSearch({ fromId, toId, date, startTime, endTime }) {
  const qs = new URLSearchParams({
    from: String(fromId),
    to: String(toId),
    date: String(date),
    ...(startTime ? { start_time: startTime } : {}),
    ...(endTime ? { end_time: endTime } : {}),
  }).toString();

  return fetchWithAuth(`/api/parcel/search/?${qs}`, { method: "GET" });
}

export function createParcelBooking(payload) {
  return fetchWithAuth("/api/parcel/bookings/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchMyParcels(type = "all") {
  const qs = new URLSearchParams({ type }).toString();
  return fetchWithAuth(`/api/my-parcels/?${qs}`, { method: "GET" });
}

export function fetchParcelDetail(id) {
  return fetchWithAuth(`/api/parcel/bookings/${id}/`, { method: "GET" });
}

export function cancelParcel(id) {
  return fetchWithAuth(`/api/parcel/bookings/${id}/cancel/`, { method: "POST" });
}

export function fetchMyPayments() {
  return fetchWithAuth("/api/my-payments/", { method: "GET" });
}