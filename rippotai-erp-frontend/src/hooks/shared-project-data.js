export const missingSharedValue = (value) =>
  value == null || (typeof value === "string" && value.trim() === "");

export function fillSharedProjectFields(values, shared, mapping) {
  const patch = {};
  for (const [field, key] of Object.entries(mapping)) {
    if (missingSharedValue(values[field]) && !missingSharedValue(shared[key]))
      patch[field] = shared[key];
  }
  return Object.keys(patch).length ? { ...values, ...patch } : values;
}
