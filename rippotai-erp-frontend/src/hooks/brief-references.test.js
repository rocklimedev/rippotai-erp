import test from "node:test";
import assert from "node:assert/strict";
import { normalizeProjectBrief, buildProjectBriefPayload } from "./brief-form-helpers.js";

test("reference images survive editing alongside text and link references", () => {
  const values = normalizeProjectBrief({ references: [
    { id: "image", fileUrl: "https://cdn.test/image.jpg", title: "Living room", description: "Warm tones", sortOrder: 2 },
    { id: "link", referenceUrl: "https://example.test", title: "Inspiration", sortOrder: 1 },
    { description: "Natural materials", sortOrder: 0 },
  ] });
  assert.equal(values.references, "Natural materials\nhttps://example.test");
  assert.equal(values.referenceImages.length, 1);
  const refs = buildProjectBriefPayload("project", values).references;
  assert.equal(refs[1].referenceUrl, "https://example.test");
  assert.equal(refs[1].title, "Inspiration");
  assert.equal(refs[2].fileUrl, "https://cdn.test/image.jpg");
  assert.equal(refs[2].description, "Warm tones");
  assert.deepEqual(refs.map((row) => row.sortOrder), [0, 1, 2]);
});

test("new images save and removed images are excluded", () => {
  const values = normalizeProjectBrief({ references: [{ fileUrl: "https://cdn.test/old.png" }] });
  assert.equal(values.references, "");
  values.referenceImages = [{ title: "New image", fileUrl: "https://cdn.test/new.png" }];
  assert.deepEqual(buildProjectBriefPayload("project", values).references.map((row) => row.fileUrl), ["https://cdn.test/new.png"]);
  values.referenceImages = [];
  assert.deepEqual(buildProjectBriefPayload("project", values).references, []);
});
