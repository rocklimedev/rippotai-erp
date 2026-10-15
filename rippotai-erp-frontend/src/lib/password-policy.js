export function newPasswordError(password) {
  if (Array.from(password).length < 12) return "Use at least 12 characters.";
  if (new TextEncoder().encode(password).length > 72) return "Use no more than 72 UTF-8 bytes.";
  return "";
}
