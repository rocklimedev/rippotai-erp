export const SITE_UTILITY_FIELDS = [
  "water_connection",
  "power_load_available",
  "drainage_point_location",
];
export function utilityFormValues(data) {
  return Object.fromEntries(
    SITE_UTILITY_FIELDS.flatMap((key) => {
      const raw = String(data[key] ?? "").trim();
      const answer = !raw ? "" : raw.toLowerCase() === "no" ? "NO" : "YES";
      return [
        [`${key}_available`, answer],
        [key, /^(yes|no)$/i.test(raw) ? "" : raw],
      ];
    }),
  );
}
export function utilityPayloadValue(values, key) {
  if (values[`${key}_available`] === "NO") return "No";
  if (values[`${key}_available`] === "YES") return values[key]?.trim() || "Yes";
  return values[key] || undefined;
}
export function changeSiteRecceField(current, key, value) {
  const next = { ...current, [key]: value };
  if (key.endsWith("_available") && value === "NO") {
    const detailKey = key.slice(0, -"_available".length);
    if (SITE_UTILITY_FIELDS.includes(detailKey)) next[detailKey] = "";
  }
  return next;
}
export function commitRoomDraft(rooms, photos, draft) {
  const { _photos = [], _draftId, ...room } = draft;
  room.id = room.id || _draftId;
  if (room.room_type !== "OTHER") room.room_type_other = "";
  return {
    rooms: draft.id
      ? rooms.map((item) => (item.id === room.id ? room : item))
      : [...rooms, { ...room, sort_order: rooms.length }],
    photos: [
      ...photos.filter((photo) => photo.room_id !== room.id),
      ..._photos.map((photo) => ({ ...photo, room_id: room.id })),
    ],
  };
}
