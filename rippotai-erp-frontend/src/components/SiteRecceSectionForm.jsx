import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Image as ImageIcon, Pencil, Ruler, Upload, X, ShieldCheck } from "lucide-react";

import { Button, Field, TextInput, TextArea, FormActions } from "@/components/inos";
import {
  DocFormLayout,
  DocSection,
  ProjectPicker,
  Choices,
  OptionSelect,
  RowCard,
  IconButton,
  AddRowButton,
  EmptyRows,
  KV,
  SubHead,
  isFilled,
  slugId,
  useAutosaveNote,
} from "@/components/forms/crm-form-ui";

// ============================================================
// EMPTY VALUES
// ============================================================

const EMPTY_ROOM = {
  room_name: "",
  room_number: "",
  room_type: "OTHER",
  length: "",
  width: "",
  height: "",
  measurement_unit: "FT",
  existing_flooring: "",
  existing_ceiling: "",
  notes: "",
};

const ROOM_TYPE_OPTIONS = [
  { value: "LIVING_DINING", label: "Living / Dining" },
  { value: "MASTER_BEDROOM", label: "Master Bedroom" },
  { value: "BEDROOM", label: "Bedroom" },
  { value: "KITCHEN", label: "Kitchen" },
  { value: "BATHROOM", label: "Bathroom" },
  { value: "BALCONY", label: "Balcony" },
  { value: "OTHER", label: "Other" },
];

const MEASUREMENT_UNIT_OPTIONS = [
  { value: "FT", label: "Feet" },
  { value: "M", label: "Metres" },
  { value: "IN", label: "Inches" },
  { value: "CM", label: "Centimetres" },
];

const getRoomTypeLabel = (type) => {
  const found = ROOM_TYPE_OPTIONS.find((o) => o.value === type);
  return found ? found.label : type || "Other";
};

const EMPTY_PHOTO = {
  room_id: "",
  shot_number: 1,
  photo_url: "",
  photo_file_name: "",
  layout_image_url: "",
  layout_file_name: "",
  standing_position: "",
  camera_direction: "",
  notes: "",
};

// ============================================================
// HELPERS
// ============================================================

const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  return false;
};

const withUnit = (value, unit) =>
  isEmpty(value) ? "" : `${value}${unit ? ` ${String(unit).toLowerCase()}` : ""}`;

// ============================================================
// PREVIEW
// ============================================================

function Preview({ label, url }) {
  if (!url) return null;

  return (
    <div className="crmf-thumb">
      <div className="crmf-thumb__img">
        <img
          src={url}
          alt={label}
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      </div>
      <div className="crmf-thumb__foot inos-hint">{label}</div>
    </div>
  );
}

// ============================================================
// UPLOAD BUTTON (file input styled as a secondary button)
// ============================================================

function UploadButton({ label, busy, disabled, accept, onFile }) {
  return (
    <label
      className="inos-btn inos-btn--secondary"
      style={{ width: "fit-content", opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
    >
      <Upload aria-hidden />
      <span>{busy ? "Uploading…" : label}</span>
      <input
        type="file"
        accept={accept}
        hidden
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}

// ============================================================
// ROOM EDITOR
// ============================================================

function RoomEditor({ room, onChange, onCancel, onSave }) {
  const update = (key, value) => {
    onChange({
      ...room,
      [key]: value,
    });
  };

  return (
    <RowCard
      title={room?.id ? "Edit room" : "New room"}
      meta="Name the room and record its measurements"
      actions={
        <IconButton label="Close" onClick={onCancel}>
          <X />
        </IconButton>
      }
    >
      <div className="inos-form-grid">
        <Field label="Room name" required>
          <TextInput
            value={room.room_name || ""}
            placeholder="e.g. Master bedroom"
            autoFocus
            onChange={(e) => update("room_name", e.target.value)}
          />
        </Field>

        <Field label="Room number" optional>
          <TextInput
            type="number"
            min="0"
            step="1"
            value={room.room_number ?? ""}
            placeholder="e.g. 1"
            onChange={(e) => update("room_number", e.target.value)}
          />
        </Field>

        <Field label="Room type" full>
          <Choices
            name="Room type"
            value={room.room_type || "OTHER"}
            options={ROOM_TYPE_OPTIONS}
            onChange={(value) => update("room_type", value)}
          />
        </Field>

        <Field label="Measurement unit" full>
          <Choices
            name="Measurement unit"
            value={room.measurement_unit || "FT"}
            options={MEASUREMENT_UNIT_OPTIONS}
            columns={4}
            onChange={(value) => update("measurement_unit", value)}
          />
        </Field>
      </div>

      <div className="inos-form-grid inos-form-grid--3">
        {[
          ["length", "Length", "e.g. 14"],
          ["width", "Width", "e.g. 12"],
          ["height", "Height", "e.g. 10"],
        ].map(([key, label, ph]) => (
          <Field key={key} label={label} hint={`In ${(MEASUREMENT_UNIT_OPTIONS.find((o) => o.value === (room.measurement_unit || "FT"))?.label || "feet").toLowerCase()}`}>
            <TextInput
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={room[key] ?? ""}
              placeholder={ph}
              onChange={(e) => update(key, e.target.value)}
            />
          </Field>
        ))}
      </div>

      <div className="inos-form-grid">
        <Field label="Existing flooring">
          <TextInput
            value={room.existing_flooring || ""}
            placeholder="e.g. Italian marble"
            onChange={(e) => update("existing_flooring", e.target.value)}
          />
        </Field>

        <Field label="Existing ceiling">
          <TextInput
            value={room.existing_ceiling || ""}
            placeholder="e.g. POP false ceiling"
            onChange={(e) => update("existing_ceiling", e.target.value)}
          />
        </Field>

        <Field label="Notes" full>
          <TextArea
            rows={3}
            value={room.notes || ""}
            placeholder="Site observations for this room, e.g. seepage near window"
            onChange={(e) => update("notes", e.target.value)}
          />
        </Field>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onSave} disabled={!room?.room_name?.trim()}>
          {room?.id ? "Update room" : "Add room"}
        </Button>
      </div>
    </RowCard>
  );
}

// ============================================================
// PHOTO EDITOR
// ============================================================

function PhotoEditor({
  photo,
  rooms,
  onChange,
  onCancel,
  onSave,
  onFileUpload,
}) {
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [uploadingLayout, setUploadingLayout] = useState(false);

  const update = (key, value) => {
    onChange({
      ...photo,
      [key]: value,
    });
  };

  const uploadFile = async (file, type) => {
    if (!file || !onFileUpload) return;

    const isPhoto = type === "photo";

    try {
      if (isPhoto) {
        setUploadingPhoto(true);
      } else {
        setUploadingLayout(true);
      }

      const url = await onFileUpload(file, type);

      if (!url) return;

      if (isPhoto) {
        onChange((prev) => ({
          ...prev,
          photo_url: url,
          photo_file_name: file.name,
        }));
      } else {
        onChange((prev) => ({
          ...prev,
          layout_image_url: url,
          layout_file_name: file.name,
        }));
      }
    } catch (error) {
      console.error(`Failed to upload ${type}:`, error);

      window.alert(
        `Failed to upload ${isPhoto ? "photo" : "layout"}. Please try again.`,
      );
    } finally {
      if (isPhoto) {
        setUploadingPhoto(false);
      } else {
        setUploadingLayout(false);
      }
    }
  };

  const roomOptions = rooms.map((room) => ({
    value: String(room.id),
    label: `${room.room_name}${room.room_number ? ` · ${room.room_number}` : ""}`,
  }));

  return (
    <RowCard
      title={photo?.id ? "Edit photo / layout shot" : "New photo / layout shot"}
      meta="Link the shot to a room and note where it was taken from"
      actions={
        <IconButton label="Close" onClick={onCancel}>
          <X />
        </IconButton>
      }
    >
      <div className="inos-form-grid">
        <Field label="Room" required>
          <OptionSelect
            value={photo.room_id || ""}
            options={roomOptions}
            placeholder="Select a room"
            onChange={(value) => update("room_id", value)}
          />
        </Field>

        <Field label="Shot number" required hint="Numbering follows the order shots were taken.">
          <TextInput
            type="number"
            min="1"
            value={photo.shot_number ?? ""}
            onChange={(e) => update("shot_number", e.target.value)}
          />
        </Field>

        <Field label="Actual photo" hint={!onFileUpload ? "File upload is not configured." : "JPG or PNG from the site visit."}>
          {photo.photo_url && <Preview label={photo.photo_file_name || "Current photo"} url={photo.photo_url} />}
          <UploadButton
            label={photo.photo_url ? "Replace photo" : "Upload photo"}
            busy={uploadingPhoto}
            disabled={uploadingPhoto || !onFileUpload}
            accept="image/*"
            onFile={(file) => uploadFile(file, "photo")}
          />
        </Field>

        <Field label="Layout image" hint="Marked-up plan showing the camera position. Image or PDF.">
          {photo.layout_image_url && <Preview label={photo.layout_file_name || "Current layout"} url={photo.layout_image_url} />}
          <UploadButton
            label={photo.layout_image_url ? "Replace layout" : "Upload layout"}
            busy={uploadingLayout}
            disabled={uploadingLayout || !onFileUpload}
            accept="image/*,.pdf"
            onFile={(file) => uploadFile(file, "layout")}
          />
        </Field>

        <Field label="Standing position">
          <TextInput
            value={photo.standing_position || ""}
            placeholder="e.g. Entrance door"
            onChange={(e) => update("standing_position", e.target.value)}
          />
        </Field>

        <Field label="Camera direction">
          <TextInput
            value={photo.camera_direction || ""}
            placeholder="e.g. North, towards TV wall"
            onChange={(e) => update("camera_direction", e.target.value)}
          />
        </Field>

        <Field label="Photo URL" optional hint="Filled automatically after upload.">
          <TextInput
            value={photo.photo_url || ""}
            placeholder="https://…"
            onChange={(e) => update("photo_url", e.target.value)}
          />
        </Field>

        <Field label="Layout URL" optional hint="Filled automatically after upload.">
          <TextInput
            value={photo.layout_image_url || ""}
            placeholder="https://…"
            onChange={(e) => update("layout_image_url", e.target.value)}
          />
        </Field>

        <Field label="Photo file name" optional>
          <TextInput
            value={photo.photo_file_name || ""}
            onChange={(e) => update("photo_file_name", e.target.value)}
          />
        </Field>

        <Field label="Layout file name" optional>
          <TextInput
            value={photo.layout_file_name || ""}
            onChange={(e) => update("layout_file_name", e.target.value)}
          />
        </Field>

        <Field label="Notes" full>
          <TextArea
            rows={3}
            value={photo.notes || ""}
            placeholder="What this shot shows, e.g. existing wiring on east wall"
            onChange={(e) => update("notes", e.target.value)}
          />
        </Field>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onSave}
          disabled={
            !photo?.room_id ||
            !photo?.shot_number ||
            uploadingPhoto ||
            uploadingLayout
          }
        >
          {photo?.id ? "Update shot" : "Add shot"}
        </Button>
      </div>
    </RowCard>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function SiteRecceSectionForm({
  title,
  subtitle,
  sections,
  values,
  onFieldChange,
  projects,
  projectId,
  onProjectChange,
  onSubmit,
  isSubmitting,
  renderSection,
  children,
  onFileUpload,
  crumbs,
  submitLabel,
  onSaveDraft,
  onCancel,
}) {
  const navigate = useNavigate();
  const autosaveNote = useAutosaveNote(values);

  const [editingRoom, setEditingRoom] = useState(null);
  const [editingPhoto, setEditingPhoto] = useState(null);

  const rooms = Array.isArray(values?.rooms) ? values.rooms : [];

  const photos = Array.isArray(values?.photos) ? values.photos : [];

  const filledCount = useMemo(() => {
    let count = 0;

    Object.entries(values || {}).forEach(([key, val]) => {
      if (key === "rooms" || key === "photos") {
        return;
      }

      if (Array.isArray(val)) {
        count += val.length > 0 ? 1 : 0;
      } else if (typeof val === "object" && val !== null) {
        count += Object.values(val).filter(
          (v) =>
            v !== "" &&
            v !== null &&
            v !== undefined &&
            !(Array.isArray(v) && v.length === 0),
        ).length;
      } else if (!isEmpty(val)) {
        count++;
      }
    });

    count += rooms.length;
    count += photos.length;

    return count;
  }, [values, rooms.length, photos.length]);

  const handleFieldChange = (sectionTitle, key, value) => {
    onFieldChange(sectionTitle, key, value);
  };

  // ============================================================
  // ROOMS
  // ============================================================

  const handleAddRoom = () => {
    setEditingRoom({
      ...EMPTY_ROOM,
      id: null,
      sort_order: rooms.length,
    });
  };

  const handleEditRoom = (room) => {
    setEditingRoom({
      ...room,
    });
  };

  const handleDeleteRoom = (roomId) => {
    const hasPhotos = photos.some(
      (photo) => String(photo.room_id) === String(roomId),
    );

    if (hasPhotos) {
      const confirmed = window.confirm(
        "This room has photos/layout shots attached to it. Delete the room and its photos?",
      );

      if (!confirmed) return;

      const remainingPhotos = photos.filter(
        (photo) => String(photo.room_id) !== String(roomId),
      );

      onFieldChange(
        "Room Photos & Layout References",
        "photos",
        remainingPhotos,
      );
    }

    const remainingRooms = rooms.filter(
      (room) => String(room.id) !== String(roomId),
    );

    onFieldChange("Room-wise Measurements", "rooms", remainingRooms);

    if (editingRoom && String(editingRoom.id) === String(roomId)) {
      setEditingRoom(null);
    }
  };

  const handleSaveRoom = () => {
    if (!editingRoom?.room_name?.trim()) {
      return;
    }

    let nextRooms;

    if (editingRoom.id) {
      nextRooms = rooms.map((room) =>
        String(room.id) === String(editingRoom.id) ? editingRoom : room,
      );
    } else {
      const newRoom = {
        ...editingRoom,
        id: `tmp-room-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        sort_order: rooms.length,
      };

      nextRooms = [...rooms, newRoom];
    }

    onFieldChange("Room-wise Measurements", "rooms", nextRooms);

    setEditingRoom(null);
  };

  // ============================================================
  // PHOTOS
  // ============================================================

  const handleAddPhoto = () => {
    setEditingPhoto({
      ...EMPTY_PHOTO,
      id: null,
      shot_number: photos.length + 1,
    });
  };

  const handleEditPhoto = (photo) => {
    setEditingPhoto({
      ...photo,
    });
  };

  const handleDeletePhoto = (photoId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this photo/layout record?",
    );

    if (!confirmed) return;

    const remainingPhotos = photos.filter(
      (photo) => String(photo.id) !== String(photoId),
    );

    onFieldChange("Room Photos & Layout References", "photos", remainingPhotos);

    if (editingPhoto && String(editingPhoto.id) === String(photoId)) {
      setEditingPhoto(null);
    }
  };

  const handleSavePhoto = () => {
    if (!editingPhoto?.room_id || !editingPhoto?.shot_number) {
      return;
    }

    let nextPhotos;

    if (editingPhoto.id) {
      nextPhotos = photos.map((photo) =>
        String(photo.id) === String(editingPhoto.id) ? editingPhoto : photo,
      );
    } else {
      const newPhoto = {
        ...editingPhoto,
        id: `tmp-photo-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      };

      nextPhotos = [...photos, newPhoto];
    }

    onFieldChange("Room Photos & Layout References", "photos", nextPhotos);

    setEditingPhoto(null);
  };

  // ============================================================
  // RESTRICTIONS
  // ============================================================

  const renderRestrictionTable = (section) => {
    const field = (section.fields || []).find(
      (item) => item.type === "restriction-table",
    );

    if (!field) {
      return null;
    }

    const restrictions = Array.isArray(values?.[field.key])
      ? values[field.key]
      : [];

    const updateRestrictions = (nextRestrictions) => {
      handleFieldChange(section.title, field.key, nextRestrictions);
    };

    const handleAddRestriction = () => {
      updateRestrictions([
        ...restrictions,
        {
          type: "",
          details: "",
        },
      ]);
    };

    const handleUpdateRestriction = (index, key, value) => {
      const nextRestrictions = restrictions.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: value,
            }
          : item,
      );

      updateRestrictions(nextRestrictions);
    };

    const handleDeleteRestriction = (index) => {
      updateRestrictions(
        restrictions.filter((_, itemIndex) => itemIndex !== index),
      );
    };

    return (
      <>
        {restrictions.length === 0 ? (
          <EmptyRows
            icon={ShieldCheck}
            title="No site restrictions yet"
            text="Add society, RWA, access, working-hour, material movement or utility rules found during the recce."
          />
        ) : (
          <div className="crmf-rows">
            {restrictions.map((restriction, index) => (
              <RowCard
                key={restriction.id || `restriction-${index}`}
                index={index + 1}
                title={
                  (field.restrictionOptions || []).find(
                    (o) => String(o.value) === String(restriction?.type),
                  )?.label || "New restriction"
                }
                onRemove={() => handleDeleteRestriction(index)}
                removeLabel="Delete restriction"
              >
                <div className="inos-form-grid">
                  <Field label="Restriction type" required>
                    <OptionSelect
                      value={restriction?.type || ""}
                      options={field.restrictionOptions || []}
                      placeholder="Select restriction"
                      onChange={(value) =>
                        handleUpdateRestriction(index, "type", String(value))
                      }
                    />
                  </Field>

                  <Field label="Details / notes">
                    <TextInput
                      value={restriction?.details || ""}
                      placeholder="e.g. Work allowed 10am–6pm, no Sundays"
                      onChange={(event) =>
                        handleUpdateRestriction(
                          index,
                          "details",
                          event.target.value,
                        )
                      }
                    />
                  </Field>
                </div>
              </RowCard>
            ))}
          </div>
        )}

        <AddRowButton onClick={handleAddRestriction}>
          {restrictions.length ? field.addLabel || "Add restriction" : "Add first restriction"}
        </AddRowButton>
      </>
    );
  };

  // ============================================================
  // RENDER ROOMS
  // ============================================================

  const renderRooms = () => {
    return (
      <>
        {rooms.length === 0 && !editingRoom ? (
          <EmptyRows
            icon={Ruler}
            title="No rooms yet"
            text="Add each room found during the recce with its dimensions."
          />
        ) : (
          <div className="crmf-rows">
            {rooms.map((room, index) =>
              editingRoom && editingRoom.id && String(editingRoom.id) === String(room.id) ? (
                <RoomEditor
                  key={room.id || index}
                  room={editingRoom}
                  onChange={setEditingRoom}
                  onCancel={() => setEditingRoom(null)}
                  onSave={handleSaveRoom}
                />
              ) : (
                <RowCard
                  key={room.id || index}
                  index={index + 1}
                  title={room.room_name}
                  meta={`${getRoomTypeLabel(room.room_type)}${room.room_number ? ` · Room ${room.room_number}` : ""}`}
                  onRemove={() => handleDeleteRoom(room.id)}
                  removeLabel="Delete room"
                  actions={
                    <IconButton label="Edit room" onClick={() => handleEditRoom(room)}>
                      <Pencil />
                    </IconButton>
                  }
                >
                  <KV
                    items={[
                      ["Length", withUnit(room.length, room.measurement_unit)],
                      ["Width", withUnit(room.width, room.measurement_unit)],
                      ["Height", withUnit(room.height, room.measurement_unit)],
                      [
                        "Photos",
                        String(
                          photos.filter(
                            (photo) => String(photo.room_id) === String(room.id),
                          ).length,
                        ),
                      ],
                      room.existing_flooring && ["Existing flooring", room.existing_flooring],
                      room.existing_ceiling && ["Existing ceiling", room.existing_ceiling],
                      room.notes && ["Notes", room.notes],
                    ]}
                  />
                </RowCard>
              ),
            )}
          </div>
        )}

        {editingRoom && !editingRoom.id && (
          <RoomEditor
            room={editingRoom}
            onChange={setEditingRoom}
            onCancel={() => setEditingRoom(null)}
            onSave={handleSaveRoom}
          />
        )}

        {!editingRoom && (
          <AddRowButton onClick={handleAddRoom}>
            {rooms.length ? "Add room" : "Add first room"}
          </AddRowButton>
        )}
      </>
    );
  };

  // ============================================================
  // RENDER PHOTOS
  // ============================================================

  const renderPhotos = () => {
    return (
      <>
        {rooms.length === 0 ? (
          <EmptyRows
            icon={ImageIcon}
            title="Add rooms first"
            text="Every photo or layout shot is linked to a room from the section above."
          />
        ) : photos.length === 0 && !editingPhoto ? (
          <EmptyRows
            icon={ImageIcon}
            title="No photos or layouts yet"
            text="Add the photographs and layout references from the site visit."
          />
        ) : (
          <div className="crmf-rows">
            {photos.map((photo, index) => {
              const room = rooms.find(
                (item) => String(item.id) === String(photo.room_id),
              );

              if (editingPhoto && editingPhoto.id && String(editingPhoto.id) === String(photo.id)) {
                return (
                  <PhotoEditor
                    key={photo.id || index}
                    photo={editingPhoto}
                    rooms={rooms}
                    onChange={setEditingPhoto}
                    onCancel={() => setEditingPhoto(null)}
                    onSave={handleSavePhoto}
                    onFileUpload={onFileUpload}
                  />
                );
              }

              return (
                <RowCard
                  key={photo.id || index}
                  index={photo.shot_number}
                  title={`Shot ${photo.shot_number}`}
                  meta={room?.room_name || "Unknown room"}
                  onRemove={() => handleDeletePhoto(photo.id)}
                  removeLabel="Delete shot"
                  actions={
                    <IconButton label="Edit shot" onClick={() => handleEditPhoto(photo)}>
                      <Pencil />
                    </IconButton>
                  }
                >
                  {(photo.photo_url || photo.layout_image_url) && (
                    <div className="crmf-thumbs">
                      {photo.photo_url && <Preview label="Actual photo" url={photo.photo_url} />}
                      {photo.layout_image_url && <Preview label="Layout" url={photo.layout_image_url} />}
                    </div>
                  )}
                  <KV
                    items={[
                      ["Standing position", photo.standing_position],
                      ["Camera direction", photo.camera_direction],
                      photo.photo_file_name && ["Photo file", photo.photo_file_name],
                      photo.layout_file_name && ["Layout file", photo.layout_file_name],
                      photo.notes && ["Notes", photo.notes],
                    ]}
                  />
                </RowCard>
              );
            })}
          </div>
        )}

        {editingPhoto && !editingPhoto.id && (
          <PhotoEditor
            photo={editingPhoto}
            rooms={rooms}
            onChange={setEditingPhoto}
            onCancel={() => setEditingPhoto(null)}
            onSave={handleSavePhoto}
            onFileUpload={onFileUpload}
          />
        )}

        {!editingPhoto && rooms.length > 0 && (
          <AddRowButton onClick={handleAddPhoto}>
            {photos.length ? "Add shot" : "Add first shot"}
          </AddRowButton>
        )}
      </>
    );
  };

  // ============================================================
  // GENERIC FIELDS
  // ============================================================

  const renderFields = (section) => (
    <div className="inos-form-grid">
      {(section.fields || []).map((field) => {
        // restriction-table is handled
        // separately by renderSectionBody
        if (field.type === "restriction-table") {
          return null;
        }

        const fieldValue = values?.[field.key] ?? "";
        const set = (value) => handleFieldChange(section.title, field.key, value);
        const options = field.options || [];
        const emptyOptions = field.type === "select" && options.length === 0;

        return (
          <Field
            key={field.key}
            label={field.label}
            required={field.required}
            full={field.type === "textarea"}
            hint={
              emptyOptions && field.key === "site_engineer_id"
                ? "No site engineers found. Add users with the Site Engineer role in Admin Console."
                : field.hint
            }
          >
            {field.type === "textarea" ? (
              <TextArea
                rows={Math.min(field.rows || 3, 4)}
                value={fieldValue}
                placeholder={field.placeholder || ""}
                onChange={(e) => set(e.target.value)}
              />
            ) : field.type === "date" ? (
              <TextInput type="date" value={fieldValue} onChange={(e) => set(e.target.value)} />
            ) : field.type === "time" ? (
              <TextInput type="time" value={fieldValue} onChange={(e) => set(e.target.value)} />
            ) : field.type === "select" ? (
              options.length > 0 && options.length <= 4 ? (
                <Choices
                  name={field.label}
                  value={fieldValue}
                  options={options}
                  columns={options.length}
                  onChange={set}
                />
              ) : (
                <OptionSelect
                  value={fieldValue}
                  options={options}
                  placeholder={emptyOptions ? "None available" : "Select…"}
                  disabled={emptyOptions}
                  onChange={set}
                />
              )
            ) : (
              <TextInput
                type={field.type || "text"}
                inputMode={field.type === "number" ? "decimal" : undefined}
                value={fieldValue}
                placeholder={field.placeholder || ""}
                onChange={(e) => set(e.target.value)}
              />
            )}
          </Field>
        );
      })}
    </div>
  );

  // ============================================================
  // SECTION BODY
  // ============================================================

  const renderSectionBody = (section) => {
    if (section.type === "rooms") {
      return renderRooms();
    }

    if (section.type === "roomPhotos") {
      return renderPhotos();
    }

    if (section.fields?.some((field) => field.type === "restriction-table")) {
      return renderRestrictionTable(section);
    }

    if (renderSection && section.type) {
      return renderSection(section);
    }

    return renderFields(section);
  };

  // ============================================================
  // SECTION COUNTS + COMPLETION
  // ============================================================

  const sectionCount = (section) => {
    if (section.type === "rooms") return rooms.length;
    if (section.type === "roomPhotos") return photos.length;
    const restrictionField = section.fields?.find(
      (field) => field.type === "restriction-table",
    );
    if (restrictionField) {
      const v = values?.[restrictionField.key];
      return Array.isArray(v) ? v.length : 0;
    }
    return 0;
  };

  const sectionDone = (section) => {
    if (section.type === "rooms" || section.type === "roomPhotos") return sectionCount(section) > 0;
    if (section.fields?.some((field) => field.type === "restriction-table")) return sectionCount(section) > 0;
    const fields = section.fields || [];
    const required = fields.filter((f) => f.required);
    if (required.length) return required.every((f) => isFilled(values?.[f.key]));
    return fields.some((f) => isFilled(values?.[f.key]));
  };

  const projectSectionId = "sec-project";
  const nav = [
    { id: projectSectionId, label: "Project", done: Boolean(projectId) },
    ...(sections || []).map((section, i) => ({
      id: slugId(section.key || section.title, i),
      label: section.title,
      done: sectionDone(section),
      count: sectionCount(section),
    })),
  ];

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <DocFormLayout
      crumbs={crumbs || [{ label: "CRM", to: "/crm" }, { label: "Forms" }, { label: "Site recce" }]}
      title={title}
      subtitle={subtitle}
      nav={nav}
    >
      <DocSection
        id={projectSectionId}
        step={1}
        title="Project"
        description="Which project was this site visit for?"
        done={Boolean(projectId)}
      >
        <ProjectPicker
          projects={projects || []}
          value={projectId}
          onChange={onProjectChange}
        />
      </DocSection>

      {(sections || []).map((section, index) => (
        <DocSection
          key={section.key || section.title}
          id={nav[index + 1].id}
          step={index + 2}
          title={section.title}
          description={section.description || SECTION_HINTS[section.title]}
          done={nav[index + 1].done}
        >
          {renderSectionBody(section)}
        </DocSection>
      ))}

      <FormActions
        note={autosaveNote || `${filledCount} item${filledCount !== 1 ? "s" : ""} completed`}
        extra={
          onSaveDraft && (
            <Button variant="secondary" onClick={onSaveDraft}>
              Save draft
            </Button>
          )
        }
        onCancel={onCancel || (() => navigate(-1))}
        submitLabel={isSubmitting ? "Saving…" : submitLabel || (title?.includes("Recce") || title?.includes("recce") ? "Save site recce" : "Generate brief")}
        submitDisabled={isSubmitting}
        onSubmit={onSubmit}
      />

      {children}
    </DocFormLayout>
  );
}

// One-line guidance for sections that don't define a description.
const SECTION_HINTS = {
  "General Information": "When the visit happened and who was there.",
  "Property Details": "Size, layout and type of the property.",
  "Site Access & Material Movement": "How people and material get to the site.",
  "Site Utilities": "Water, power and drainage available on site.",
  "Existing Site Condition": "What the site looks like today.",
};

export default SiteRecceSectionForm;
