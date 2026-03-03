const ACCESS = "access_token";
const REFRESH = "refresh_token";
const USER = "user";

export function isLoggedIn() {
  return Boolean(localStorage.getItem(ACCESS));
}

export function saveAuth({ tokens, user }) {
  localStorage.setItem(ACCESS, tokens.access);
  localStorage.setItem(REFRESH, tokens.refresh);
  localStorage.setItem(USER, JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
  localStorage.removeItem(USER);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS);
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER) || "null");
  } catch {
    return null;
  }
}