import React, { useMemo, useState } from "react";
import {
  Image as ImageIcon,
  Pencil,
  Plus,
  Ruler,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { Shell, Card, Input, TextArea } from "../hooks/shared";

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
  measurement_unit: "FT", // uppercase now
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

  if (typeof value === "string") {
    return value.trim() === "";
  }

  return false;
};

// ============================================================
// INFO
// ============================================================

function Info({ label, value }) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-[#94A3A5]">
        {label}
      </div>

      <div className="text-sm text-[#333] mt-1 whitespace-pre-wrap">
        {value}
      </div>
    </div>
  );
}

// ============================================================
// MEASUREMENT
// ============================================================

function Measurement({ label, value, unit }) {
  const hasValue =
    value !== null && value !== undefined && String(value).trim() !== "";

  return (
    <div className="rounded-lg bg-[#F7F9F8] p-3">
      <div className="text-[11px] uppercase tracking-wide text-[#94A3A5]">
        {label}
      </div>

      <div className="text-sm font-medium text-[#333] mt-1">
        {hasValue ? (
          <>
            {value}
            {unit ? ` ${unit}` : ""}
          </>
        ) : (
          <span className="text-[#A8B2B3]">Not recorded</span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// PREVIEW
// ============================================================

function Preview({ label, url }) {
  if (!url) return null;

  return (
    <div className="border border-[#DCE4E2] rounded-xl overflow-hidden bg-[#F8FAF9]">
      <div className="px-3 py-2 border-b border-[#EDF1F0] text-xs font-medium text-[#586566]">
        {label}
      </div>

      <div className="aspect-video bg-[#F1F4F3]">
        <img
          src={url}
          alt={label}
          className="w-full h-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      </div>
    </div>
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
    <div className="border border-[#DCE4E2] rounded-xl bg-[#FAFCFB] p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="font-semibold text-[#333]">
            {room?.id ? "Edit Room" : "Add Room"}
          </div>

          <div className="text-xs text-[#7B8788] mt-1">
            Enter the room information and site measurements.
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="h-8 w-8 rounded-lg hover:bg-[#EEF2F1] flex items-center justify-center"
          title="Close"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* ROOM NAME */}

        <div>
          <label className="field-label">
            Room Name <span className="text-red-500">*</span>
          </label>

          <Input
            value={room.room_name || ""}
            placeholder="e.g. Master Bedroom"
            onChange={(e) => update("room_name", e.target.value)}
          />
        </div>

        {/* ROOM NUMBER */}

        <div>
          <label className="field-label">Room Number</label>

          <Input
            type="number"
            min="0"
            step="1"
            value={room.room_number ?? ""}
            placeholder="e.g. 1"
            onChange={(e) => update("room_number", e.target.value)}
          />
        </div>

        {/* ROOM TYPE */}

        <div>
          <label className="field-label">Room Type</label>

          <select
            className="bc-input h-10 w-full"
            value={room.room_type || "OTHER"}
            onChange={(e) => update("room_type", e.target.value)}
          >
            {ROOM_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* UNIT */}

        <div>
          <label className="field-label">Measurement Unit</label>

          <select
            className="bc-input h-10 w-full"
            value={room.measurement_unit || "FT"}
            onChange={(e) => update("measurement_unit", e.target.value)}
          >
            {MEASUREMENT_UNIT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* LENGTH */}

        <div>
          <label className="field-label">Length</label>

          <Input
            type="number"
            step="0.01"
            min="0"
            value={room.length ?? ""}
            onChange={(e) => update("length", e.target.value)}
          />
        </div>

        {/* WIDTH */}

        <div>
          <label className="field-label">Width</label>

          <Input
            type="number"
            step="0.01"
            min="0"
            value={room.width ?? ""}
            onChange={(e) => update("width", e.target.value)}
          />
        </div>

        {/* HEIGHT */}

        <div>
          <label className="field-label">Height</label>

          <Input
            type="number"
            step="0.01"
            min="0"
            value={room.height ?? ""}
            onChange={(e) => update("height", e.target.value)}
          />
        </div>

        {/* FLOORING */}

        <div>
          <label className="field-label">Existing Flooring</label>

          <Input
            value={room.existing_flooring || ""}
            placeholder="e.g. Italian marble"
            onChange={(e) => update("existing_flooring", e.target.value)}
          />
        </div>

        {/* CEILING */}

        <div>
          <label className="field-label">Existing Ceiling</label>

          <Input
            value={room.existing_ceiling || ""}
            placeholder="e.g. POP false ceiling"
            onChange={(e) => update("existing_ceiling", e.target.value)}
          />
        </div>

        {/* NOTES */}

        <div className="md:col-span-2">
          <label className="field-label">Notes</label>

          <TextArea
            rows={4}
            value={room.notes || ""}
            placeholder="Any site observations for this room..."
            onChange={(e) => update("notes", e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-[#EDF1F0]">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 px-4 rounded-lg border border-[#DCE4E2] text-sm"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={!room?.room_name?.trim()}
          className="h-9 px-4 rounded-lg bg-[#1F453B] text-white text-sm disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-2">
            <Save size={14} />
            Save Room
          </span>
        </button>
      </div>
    </div>
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

  return (
    <div className="border border-[#DCE4E2] rounded-xl bg-[#FAFCFB] p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="font-semibold text-[#333]">
            {photo?.id ? "Edit Photo / Layout Shot" : "Add Photo / Layout Shot"}
          </div>

          <div className="text-xs text-[#7B8788] mt-1">
            Associate the shot with a room and record the camera position.
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="h-8 w-8 rounded-lg hover:bg-[#EEF2F1] flex items-center justify-center"
          title="Close"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* ROOM */}

        <div>
          <label className="field-label">
            Room <span className="text-red-500">*</span>
          </label>

          <select
            className="bc-input h-10 w-full"
            value={photo.room_id || ""}
            onChange={(e) => update("room_id", e.target.value)}
          >
            <option value="">Select Room</option>

            {rooms.map((room, index) => (
              <option key={room.id || index} value={room.id}>
                {room.room_name}
                {room.room_number ? ` • ${room.room_number}` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* SHOT NUMBER */}

        <div>
          <label className="field-label">
            Shot Number <span className="text-red-500">*</span>
          </label>

          <Input
            type="number"
            min="1"
            value={photo.shot_number ?? ""}
            onChange={(e) => update("shot_number", e.target.value)}
          />
        </div>

        {/* ACTUAL PHOTO */}

        <div>
          <label className="field-label">Actual Photo</label>

          {photo.photo_url && (
            <div className="mb-2">
              <Preview label="Current Photo" url={photo.photo_url} />
            </div>
          )}

          <label className="h-10 px-3 rounded-lg border border-[#CBD8D5] bg-white text-sm inline-flex items-center gap-2 cursor-pointer hover:bg-[#F7F9F8]">
            <Upload size={15} />

            {uploadingPhoto ? "Uploading..." : "Upload Photo"}

            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingPhoto || !onFileUpload}
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (file) {
                  uploadFile(file, "photo");
                }

                e.target.value = "";
              }}
            />
          </label>

          {!onFileUpload && (
            <div className="text-[11px] text-[#94A3A5] mt-1">
              File upload callback is not configured.
            </div>
          )}
        </div>

        {/* LAYOUT */}

        <div>
          <label className="field-label">Layout Image</label>

          {photo.layout_image_url && (
            <div className="mb-2">
              <Preview label="Current Layout" url={photo.layout_image_url} />
            </div>
          )}

          <label className="h-10 px-3 rounded-lg border border-[#CBD8D5] bg-white text-sm inline-flex items-center gap-2 cursor-pointer hover:bg-[#F7F9F8]">
            <Upload size={15} />

            {uploadingLayout ? "Uploading..." : "Upload Layout"}

            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              disabled={uploadingLayout || !onFileUpload}
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (file) {
                  uploadFile(file, "layout");
                }

                e.target.value = "";
              }}
            />
          </label>
        </div>

        {/* PHOTO URL */}

        <div>
          <label className="field-label">Photo URL</label>

          <Input
            value={photo.photo_url || ""}
            placeholder="https://..."
            onChange={(e) => update("photo_url", e.target.value)}
          />
        </div>

        {/* LAYOUT URL */}

        <div>
          <label className="field-label">Layout URL</label>

          <Input
            value={photo.layout_image_url || ""}
            placeholder="https://..."
            onChange={(e) => update("layout_image_url", e.target.value)}
          />
        </div>

        {/* STANDING POSITION */}

        <div>
          <label className="field-label">Standing Position</label>

          <Input
            value={photo.standing_position || ""}
            placeholder="e.g. Entrance door"
            onChange={(e) => update("standing_position", e.target.value)}
          />
        </div>

        {/* CAMERA DIRECTION */}

        <div>
          <label className="field-label">Camera Direction</label>

          <Input
            value={photo.camera_direction || ""}
            placeholder="e.g. North / towards TV wall"
            onChange={(e) => update("camera_direction", e.target.value)}
          />
        </div>

        {/* FILE NAMES */}

        <div>
          <label className="field-label">Photo File Name</label>

          <Input
            value={photo.photo_file_name || ""}
            onChange={(e) => update("photo_file_name", e.target.value)}
          />
        </div>

        <div>
          <label className="field-label">Layout File Name</label>

          <Input
            value={photo.layout_file_name || ""}
            onChange={(e) => update("layout_file_name", e.target.value)}
          />
        </div>

        {/* NOTES */}

        <div className="md:col-span-2">
          <label className="field-label">Notes</label>

          <TextArea
            rows={4}
            value={photo.notes || ""}
            placeholder="Add observations about this shot..."
            onChange={(e) => update("notes", e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-[#EDF1F0]">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 px-4 rounded-lg border border-[#DCE4E2] text-sm"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={
            !photo?.room_id ||
            !photo?.shot_number ||
            uploadingPhoto ||
            uploadingLayout
          }
          className="h-9 px-4 rounded-lg bg-[#1F453B] text-white text-sm disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-2">
            <Save size={14} />
            Save Shot
          </span>
        </button>
      </div>
    </div>
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

  // Expected:
  //
  // const url = await onFileUpload(file, "photo");
  //
  // or:
  //
  // const url = await onFileUpload(file, "layout");
  onFileUpload,
}) {
  const [active, setActive] = useState(0);

  const [editingRoom, setEditingRoom] = useState(null);

  const [editingPhoto, setEditingPhoto] = useState(null);

  const currentSection = sections?.[active];

  // ============================================================
  // CHILD COLLECTIONS
  // ============================================================

  const rooms = values?.rooms || [];

  const photos = values?.photos || [];

  // ============================================================
  // FILLED COUNT
  // ============================================================

  const filledCount = useMemo(() => {
    let count = 0;

    Object.entries(values || {}).forEach(([key, val]) => {
      // Child collections have their own counts.
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

  // ============================================================
  // SIMPLE FIELD CHANGE
  // ============================================================

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

        // Temporary frontend ID.
        // Backend can replace/remove this when
        // creating the actual UUID.
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
  // ROOM SECTION
  // ============================================================

  const renderRooms = () => {
    return (
      <div>
        {editingRoom ? (
          <RoomEditor
            room={editingRoom}
            onChange={setEditingRoom}
            onCancel={() => setEditingRoom(null)}
            onSave={handleSaveRoom}
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-semibold text-[#333]">Rooms</div>

                <div className="text-xs text-[#7B8788] mt-1">
                  {rooms.length} room
                  {rooms.length !== 1 ? "s" : ""} added
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddRoom}
                className="h-9 px-3 rounded-lg bg-[#1F453B] text-white text-sm inline-flex items-center gap-2"
              >
                <Plus size={15} />
                Add Room
              </button>
            </div>

            {rooms.length === 0 ? (
              <div className="border border-dashed border-[#CBD8D5] rounded-xl p-8 text-center">
                <Ruler size={28} className="mx-auto text-[#94A3A5] mb-3" />

                <div className="font-medium text-[#333]">No rooms added</div>

                <div className="text-xs text-[#7B8788] mt-1">
                  Add the rooms found during the site recce.
                </div>

                <button
                  type="button"
                  onClick={handleAddRoom}
                  className="mt-4 h-9 px-4 rounded-lg border border-[#1F453B] text-[#1F453B] text-sm"
                >
                  + Add First Room
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {rooms.map((room, index) => (
                  <div
                    key={room.id || index}
                    className="border border-[#DCE4E2] rounded-xl p-4 bg-white"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-[#EEF4F1] flex items-center justify-center text-[#1F453B]">
                          <Ruler size={17} />
                        </div>

                        <div>
                          <div className="font-semibold text-[#333]">
                            {room.room_name}
                          </div>

                          <div className="text-xs text-[#7B8788] mt-1">
                            {getRoomTypeLabel(room.room_type)}

                            {room.room_number
                              ? ` • Room ${room.room_number}`
                              : ""}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditRoom(room)}
                          className="h-8 w-8 rounded-lg hover:bg-[#F4F6F7] flex items-center justify-center"
                          title="Edit room"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRoom(room.id)}
                          className="h-8 w-8 rounded-lg hover:bg-red-50 text-red-600 flex items-center justify-center"
                          title="Delete room"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      <Measurement
                        label="Length"
                        value={room.length}
                        unit={room.measurement_unit}
                      />

                      <Measurement
                        label="Width"
                        value={room.width}
                        unit={room.measurement_unit}
                      />

                      <Measurement
                        label="Height"
                        value={room.height}
                        unit={room.measurement_unit}
                      />

                      <Measurement
                        label="Photos"
                        value={
                          photos.filter(
                            (photo) =>
                              String(photo.room_id) === String(room.id),
                          ).length
                        }
                      />
                    </div>

                    {(room.existing_flooring ||
                      room.existing_ceiling ||
                      room.notes) && (
                      <div className="mt-4 pt-4 border-t border-[#EDF1F0] grid md:grid-cols-3 gap-4">
                        {room.existing_flooring && (
                          <Info
                            label="Existing Flooring"
                            value={room.existing_flooring}
                          />
                        )}

                        {room.existing_ceiling && (
                          <Info
                            label="Existing Ceiling"
                            value={room.existing_ceiling}
                          />
                        )}

                        {room.notes && (
                          <Info label="Notes" value={room.notes} />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // ============================================================
  // PHOTO SECTION
  // ============================================================

  const renderPhotos = () => {
    return (
      <div>
        {editingPhoto ? (
          <PhotoEditor
            photo={editingPhoto}
            rooms={rooms}
            onChange={setEditingPhoto}
            onCancel={() => setEditingPhoto(null)}
            onSave={handleSavePhoto}
            onFileUpload={onFileUpload}
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-semibold text-[#333]">
                  Photos & Layout References
                </div>

                <div className="text-xs text-[#7B8788] mt-1">
                  {photos.length} shot
                  {photos.length !== 1 ? "s" : ""} added
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddPhoto}
                disabled={rooms.length === 0}
                className="h-9 px-3 rounded-lg bg-[#1F453B] text-white text-sm inline-flex items-center gap-2 disabled:opacity-40"
              >
                <Plus size={15} />
                Add Shot
              </button>
            </div>

            {rooms.length === 0 ? (
              <div className="border border-dashed border-[#CBD8D5] rounded-xl p-8 text-center">
                <ImageIcon size={28} className="mx-auto text-[#94A3A5] mb-3" />

                <div className="font-medium text-[#333]">Add rooms first</div>

                <div className="text-xs text-[#7B8788] mt-1">
                  Every photo/layout shot must be associated with a room.
                </div>
              </div>
            ) : photos.length === 0 ? (
              <div className="border border-dashed border-[#CBD8D5] rounded-xl p-8 text-center">
                <ImageIcon size={28} className="mx-auto text-[#94A3A5] mb-3" />

                <div className="font-medium text-[#333]">
                  No photos or layouts added
                </div>

                <div className="text-xs text-[#7B8788] mt-1">
                  Add the photographs and layout references from the site visit.
                </div>

                <button
                  type="button"
                  onClick={handleAddPhoto}
                  className="mt-4 h-9 px-4 rounded-lg border border-[#1F453B] text-[#1F453B] text-sm"
                >
                  + Add First Shot
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {photos.map((photo, index) => {
                  const room = rooms.find(
                    (item) => String(item.id) === String(photo.room_id),
                  );

                  return (
                    <div
                      key={photo.id || index}
                      className="border border-[#DCE4E2] rounded-xl p-4 bg-white"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-lg bg-[#EEF4F1] flex items-center justify-center text-[#1F453B]">
                            <ImageIcon size={17} />
                          </div>

                          <div>
                            <div className="font-semibold text-[#333]">
                              Shot #{photo.shot_number}
                            </div>

                            <div className="text-xs text-[#7B8788] mt-1">
                              {room?.room_name || "Unknown Room"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditPhoto(photo)}
                            className="h-8 w-8 rounded-lg hover:bg-[#F4F6F7] flex items-center justify-center"
                            title="Edit shot"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="h-8 w-8 rounded-lg hover:bg-red-50 text-red-600 flex items-center justify-center"
                            title="Delete shot"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3 mt-4">
                        {photo.photo_url && (
                          <Preview label="Actual Photo" url={photo.photo_url} />
                        )}

                        {photo.layout_image_url && (
                          <Preview
                            label="Layout"
                            url={photo.layout_image_url}
                          />
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mt-4">
                        {photo.standing_position && (
                          <Info
                            label="Standing Position"
                            value={photo.standing_position}
                          />
                        )}

                        {photo.camera_direction && (
                          <Info
                            label="Camera Direction"
                            value={photo.camera_direction}
                          />
                        )}

                        {photo.photo_file_name && (
                          <Info
                            label="Photo File"
                            value={photo.photo_file_name}
                          />
                        )}

                        {photo.layout_file_name && (
                          <Info
                            label="Layout File"
                            value={photo.layout_file_name}
                          />
                        )}
                      </div>

                      {photo.notes && (
                        <div className="mt-4 pt-4 border-t border-[#EDF1F0]">
                          <Info label="Notes" value={photo.notes} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // ============================================================
  // CUSTOM SECTION
  // ============================================================

  const renderCurrentSection = () => {
    if (!currentSection) {
      return null;
    }

    if (currentSection.type === "rooms") {
      return renderRooms();
    }

    if (currentSection.type === "roomPhotos") {
      return renderPhotos();
    }

    if (renderSection && currentSection.type) {
      return renderSection(currentSection);
    }

    return (
      <div className="grid md:grid-cols-2 gap-4">
        {(currentSection.fields || []).map((field) => {
          const fieldValue = values?.[field.key] ?? "";

          return (
            <div
              key={field.key}
              className={field.type === "textarea" ? "md:col-span-2" : ""}
            >
              <label className="field-label">
                {field.label}

                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.type === "textarea" ? (
                <TextArea
                  rows={field.rows || 4}
                  value={fieldValue}
                  placeholder={field.placeholder || ""}
                  onChange={(e) =>
                    handleFieldChange(
                      currentSection.title,
                      field.key,
                      e.target.value,
                    )
                  }
                />
              ) : field.type === "date" ? (
                <Input
                  type="date"
                  value={fieldValue}
                  onChange={(e) =>
                    handleFieldChange(
                      currentSection.title,
                      field.key,
                      e.target.value,
                    )
                  }
                />
              ) : field.type === "time" ? (
                <Input
                  type="time"
                  value={fieldValue}
                  onChange={(e) =>
                    handleFieldChange(
                      currentSection.title,
                      field.key,
                      e.target.value,
                    )
                  }
                />
              ) : field.type === "select" ? (
                <select
                  className="bc-input h-10 w-full"
                  value={
                    fieldValue === null || fieldValue === undefined
                      ? ""
                      : String(fieldValue)
                  }
                  onChange={(e) => {
                    const rawValue = e.target.value;

                    const selectedOption = (field.options || []).find(
                      (option) => {
                        if (typeof option === "object" && option !== null) {
                          return String(option.value) === rawValue;
                        }

                        return String(option) === rawValue;
                      },
                    );

                    const value =
                      typeof selectedOption === "object" &&
                      selectedOption !== null
                        ? selectedOption.value
                        : rawValue;

                    handleFieldChange(currentSection.title, field.key, value);
                  }}
                >
                  <option value="">Select...</option>

                  {(field.options || []).map((option, index) => {
                    if (typeof option === "object" && option !== null) {
                      return (
                        <option
                          key={`${option.value}-${index}`}
                          value={String(option.value)}
                        >
                          {option.label}
                        </option>
                      );
                    }

                    return (
                      <option key={`${option}-${index}`} value={option}>
                        {option}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <Input
                  type={field.type || "text"}
                  value={fieldValue}
                  placeholder={field.placeholder || ""}
                  onChange={(e) =>
                    handleFieldChange(
                      currentSection.title,
                      field.key,
                      e.target.value,
                    )
                  }
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Shell
      title={title}
      subtitle={subtitle}
      action={
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Save size={15} />

          {isSubmitting
            ? "Saving..."
            : title?.includes("Recce")
              ? "Save Site Recce"
              : "Generate Brief"}
        </button>
      }
    >
      {/* ========================================================
          PROJECT
      ======================================================== */}

      <Card>
        <label className="field-label">Project *</label>

        <select
          className="bc-input h-10 max-w-lg"
          value={projectId || ""}
          onChange={(e) => onProjectChange(e.target.value)}
        >
          <option value="">Select Project</option>

          {projects?.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </Card>

      {/* ========================================================
          SECTIONS
      ======================================================== */}

      <div className="grid md:grid-cols-[240px_1fr] gap-5">
        {/* SIDEBAR */}

        <Card>
          <div className="text-xs uppercase tracking-widest text-[#6B7B7C] mb-3">
            Sections
          </div>

          <div className="flex flex-col gap-1">
            {sections.map((section, index) => {
              const isActive = active === index;

              let count = 0;

              if (section.type === "rooms") {
                count = rooms.length;
              }

              if (section.type === "roomPhotos") {
                count = photos.length;
              }

              return (
                <button
                  key={section.title}
                  type="button"
                  onClick={() => setActive(index)}
                  className={`text-left rounded-lg px-3 py-2 text-sm transition flex items-center justify-between gap-2 ${
                    isActive
                      ? "bg-[#1F453B] text-white"
                      : "hover:bg-[#F4F6F7] text-[#333]"
                  }`}
                >
                  <span>
                    {index + 1}. {section.title}
                  </span>

                  {count > 0 && (
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-[#EEF4F1] text-[#1F453B]"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* MAIN */}

        <Card>
          <div className="mb-5">
            <div className="text-lg font-semibold text-[#333333]">
              {currentSection?.title}
            </div>

            {currentSection?.description && (
              <div className="text-sm text-[#7B8788] mt-1">
                {currentSection.description}
              </div>
            )}
          </div>

          {renderCurrentSection()}

          {/* ======================================================
              NAVIGATION
          ====================================================== */}

          <div className="flex justify-between mt-6 pt-5 border-t border-[#EDF1F0]">
            <button
              type="button"
              disabled={active === 0}
              onClick={() => setActive((prev) => Math.max(0, prev - 1))}
              className="h-9 px-4 rounded-lg border border-[rgba(31,69,59,0.14)] text-sm disabled:opacity-50"
            >
              ← Previous
            </button>

            <button
              type="button"
              disabled={active === sections.length - 1}
              onClick={() =>
                setActive((prev) => Math.min(sections.length - 1, prev + 1))
              }
              className="h-9 px-4 rounded-lg border border-[rgba(31,69,59,0.14)] text-sm disabled:opacity-50"
            >
              Next →
            </button>
          </div>

          <div className="mt-4 text-xs text-[#94A3A5]">
            Draft autosaved locally • {filledCount} item
            {filledCount !== 1 ? "s" : ""} completed
          </div>
        </Card>
      </div>

      {children}
    </Shell>
  );
}

export default SiteRecceSectionForm;
