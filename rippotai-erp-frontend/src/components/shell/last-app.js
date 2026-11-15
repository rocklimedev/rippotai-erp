export const LAST_APP_KEY = "inos.lastApp";

/** The app whose sidebar was shown last (for app-independent pages such as My approvals). */
export function lastApp() {
  try {
    return sessionStorage.getItem(LAST_APP_KEY) || "projects";
  } catch {
    return "projects";
  }
}
