import test from "node:test";
import assert from "node:assert/strict";
import {
  utilityFormValues,
  utilityPayloadValue,
  changeSiteRecceField,
  commitRoomDraft,
  SITE_UTILITY_FIELDS,
} from "./site-recce-form-helpers.js";
import { SITE_RECCE_FORM_SECTIONS } from "./reki-sections.js";
test("all three utilities round-trip Yes, No and details without stale input", () => {
  for (const key of SITE_UTILITY_FIELDS) {
    const no = changeSiteRecceField(
      { [key]: "Old details" },
      `${key}_available`,
      "NO",
    );
    assert.equal(no[key], "");
    assert.equal(utilityPayloadValue(no, key), "No");
    assert.equal(utilityFormValues({ [key]: "No" })[`${key}_available`], "NO");
    assert.equal(
      utilityFormValues({ [key]: "10 KW" })[`${key}_available`],
      "YES",
    );
    assert.equal(
      utilityPayloadValue({ [`${key}_available`]: "YES" }, key),
      "Yes",
    );
  }
});
test("form combines room and photo entry and hides utility details until Yes", () => {
  assert.equal(
    SITE_RECCE_FORM_SECTIONS.filter((item) => item.type === "rooms").length,
    1,
  );
  assert.equal(
    SITE_RECCE_FORM_SECTIONS.some((item) => item.type === "roomPhotos"),
    false,
  );
  assert.equal(
    SITE_RECCE_FORM_SECTIONS.find((item) => item.type === "rooms").fields.some(
      (item) => item.key === "room_number",
    ),
    false,
  );
  const utilities = SITE_RECCE_FORM_SECTIONS.find(
    (item) => item.title === "Site Utilities",
  );
  assert.equal(utilities.fields.length, 6);
  for (const field of utilities.fields.filter((item) => item.showWhen))
    assert.equal(field.showWhen.value, "YES");
});
test("photos uploaded during room creation attach to that room and preserve other rooms", () => {
  const oldPhoto = { id: "old", room_id: "existing" };
  const saved = commitRoomDraft([{ id: "existing" }], [oldPhoto], {
    id: null,
    _draftId: "new-room",
    room_name: "Study",
    room_type: "OTHER",
    room_type_other: "Study",
    _photos: [
      {
        id: "new-photo",
        photo_url: "https://cdn/photo.jpg",
        layout_image_url: "https://cdn/layout.jpg",
      },
    ],
  });
  assert.equal(saved.rooms[1].id, "new-room");
  assert.equal(saved.rooms[1]._photos, undefined);
  assert.equal(saved.photos[1].room_id, "new-room");
  assert.equal(saved.photos[0], oldPhoto);
  assert.equal(saved.rooms[1].room_type_other, "Study");
});
