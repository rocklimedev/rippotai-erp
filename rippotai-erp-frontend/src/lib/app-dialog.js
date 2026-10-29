// Keep requests queued so concurrent operations never overwrite an open dialog.
const requests = [];
const listeners = new Set();
let nextId = 0;

export const subscribeDialogs = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const getDialog = () => requests[0] ?? null;
const notify = () => listeners.forEach((listener) => listener());

function request(type, message, defaultValue = "") {
  return new Promise((resolve) => {
    requests.push({ id: ++nextId, type, message: String(message ?? ""), defaultValue: String(defaultValue ?? ""), resolve });
    notify();
  });
}

export function resolveDialog(id, value) {
  if (requests[0]?.id !== id) return;
  const current = requests.shift();
  notify();
  current.resolve(value);
}

export const appAlert = (message) => request("alert", message);
export const appConfirm = (message) => request("confirm", message);
export const appPrompt = (message, defaultValue) => request("prompt", message, defaultValue);
