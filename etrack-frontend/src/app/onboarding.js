const KEY = "onboarding_seen";

export function hasSeenOnboarding() {
  return localStorage.getItem(KEY) === "1";
}

export function setSeenOnboarding() {
  localStorage.setItem(KEY, "1");
}