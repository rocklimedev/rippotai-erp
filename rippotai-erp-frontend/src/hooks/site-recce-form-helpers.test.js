import test from "node:test";
import assert from "node:assert/strict";
import {
  utilityFormValues,
  utilityPayloadValue,
  changeSiteRecceField,
  commitRoomDraft,
  changeRoomField,
  SITE_UTILITY_FIELDS,
} from "./site-recce-form-helpers.js";
import { SITE_RECCE_FORM_SECTIONS } from "./reki-sections.js";
test("room area updates from length and width with decimal rounding", () => {
  const room = changeRoomField({ width: "12", area: 50 }, "length", "14");
  assert.equal(room.area, 168);
  assert.equal(changeRoomField(room, "width", "10.25").area, 143.5);
  assert.equal(changeRoomField({ width: "3.33" }, "length", "2.22").area, 7.39);
  assert.equal(changeRoomField(room, "height", "10").area, 168);
  assert.equal(changeRoomField(room, "area", "160").area, "160");
});
test("incomplete or invalid room measurements clear stale calculated area", () => {
  for (const value of ["", " ", "invalid", "-1"]) {
    assert.equal(changeRoomField({ width: "12", area: 168 }, "length", value).area, "");
  }
  assert.equal(changeRoomField({ width: "12" }, "length", "0").area, 0);
});
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
