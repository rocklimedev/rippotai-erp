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
// Supports decimal feet and architectural notation: 7'-6", 7i-6ii.
export function parseFeetInches(value) {
  const text = String(value ?? "").trim();
  if (!text) return NaN;
  if (/^\d+(?:\.\d+)?$/.test(text)) return Number(text);
  const match = text.match(/^(\d+)\s*(?:i(?!i)|['′])\s*-?\s*(\d+(?:\.\d+)?)\s*(?:ii|["″])$/i);
  return match ? Number(match[1]) + Number(match[2]) / 12 : NaN;
}

export function formatFeetInches(value) {
  if (value === "" || value === null || value === undefined) return "";
  const totalInches = Math.round(Number(value) * 12 * 100) / 100;
  const feet = Math.floor(totalInches / 12);
  const inches = Number((totalInches - feet * 12).toFixed(2));
  return `${feet}'-${inches}"`;
}

export function calculatedRoomArea(room) {
  const parse = !room.measurement_unit || room.measurement_unit === "FT" ? parseFeetInches : Number;
  const length = parse(room.length);
  const width = parse(room.width);
  return String(room.length ?? "").trim() && String(room.width ?? "").trim() &&
    Number.isFinite(length * width) && length >= 0 && width >= 0
    ? Number((length * width).toFixed(2)) : "";
}

export function roomFeetInchesDraft(room) {
  const factor = { FT: 1, IN: 1 / 12, M: 1 / 0.3048, CM: 1 / 30.48 }[room.measurement_unit || "FT"] || 1;
  const next = { ...room, measurement_unit: "FT" };
  for (const key of ["length", "width", "height"]) {
    next[key] = String(room[key] ?? "").trim() ? formatFeetInches(Number(room[key]) * factor) : "";
  }
  next.area = String(room.area ?? "").trim() ? Number((Number(room.area) * factor * factor).toFixed(2)) : calculatedRoomArea(next);
  next._manualArea = room._manualArea ?? (next.area !== "" && next.area !== calculatedRoomArea(next));
  return next;
}

export function changeRoomField(room, key, value) {
  const next = { ...room, [key]: value };
  if (key === "area") next._manualArea = true;
  if (key === "_manualArea" && !value) next.area = calculatedRoomArea(next);
  if ((key === "length" || key === "width") && !room._manualArea) {
    next.area = calculatedRoomArea(next);
  }
  return next;
}

export function commitRoomDraft(rooms, photos, draft) {
  const { _photos = [], _draftId, ...room } = draft;
  if (!room.measurement_unit || room.measurement_unit === "FT") {
    for (const key of ["length", "width", "height"]) {
      if (String(room[key] ?? "").trim()) room[key] = parseFeetInches(room[key]);
    }
  }
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
