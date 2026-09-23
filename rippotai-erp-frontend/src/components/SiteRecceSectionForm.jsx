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

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Shell } from "../hooks/shared";

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

// ============================================================
// INFO
// ============================================================

function Info({ label, value }) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>

      <div className="text-sm text-foreground mt-1 whitespace-pre-wrap">
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
    <div className="rounded-lg bg-muted/50 p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>

      <div className="text-sm font-medium text-foreground mt-1">
        {hasValue ? (
          <>
            {value}
            {unit ? ` ${unit}` : ""}
          </>
        ) : (
          <span className="text-muted-foreground">Not recorded</span>
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
    <div className="border rounded-xl overflow-hidden bg-muted/30">
      <div className="px-3 py-2 border-b text-xs font-medium text-muted-foreground">
        {label}
      </div>

      <div className="aspect-video bg-muted">
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
    <div className="border rounded-xl bg-muted/20 p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="font-semibold text-foreground">
            {room?.id ? "Edit Room" : "Add Room"}
          </div>

          <div className="text-xs text-muted-foreground mt-1">
            Enter the room information and site measurements.
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={onCancel} title="Close">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* ROOM NAME */}
        <div className="space-y-2">
          <Label>
            Room Name <span className="text-destructive">*</span>
          </Label>

          <Input
            value={room.room_name || ""}
            placeholder="e.g. Master Bedroom"
            onChange={(e) => update("room_name", e.target.value)}
          />
        </div>

        {/* ROOM NUMBER */}
        <div className="space-y-2">
          <Label>Room Number</Label>

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
        <div className="space-y-2">
          <Label>Room Type</Label>

          <Select
            value={room.room_type || "OTHER"}
            onValueChange={(value) => update("room_type", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>

            <SelectContent>
              {ROOM_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* UNIT */}
        <div className="space-y-2">
          <Label>Measurement Unit</Label>

          <Select
            value={room.measurement_unit || "FT"}
            onValueChange={(value) => update("measurement_unit", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>

            <SelectContent>
              {MEASUREMENT_UNIT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* LENGTH */}
        <div className="space-y-2">
          <Label>Length</Label>

          <Input
            type="number"
            step="0.01"
            min="0"
            value={room.length ?? ""}
            onChange={(e) => update("length", e.target.value)}
          />
        </div>

        {/* WIDTH */}
        <div className="space-y-2">
          <Label>Width</Label>

          <Input
            type="number"
            step="0.01"
            min="0"
            value={room.width ?? ""}
            onChange={(e) => update("width", e.target.value)}
          />
        </div>

        {/* HEIGHT */}
        <div className="space-y-2">
          <Label>Height</Label>

          <Input
            type="number"
            step="0.01"
            min="0"
            value={room.height ?? ""}
            onChange={(e) => update("height", e.target.value)}
          />
        </div>

        {/* FLOORING */}
        <div className="space-y-2">
          <Label>Existing Flooring</Label>

          <Input
            value={room.existing_flooring || ""}
            placeholder="e.g. Italian marble"
            onChange={(e) => update("existing_flooring", e.target.value)}
          />
        </div>

        {/* CEILING */}
        <div className="space-y-2">
          <Label>Existing Ceiling</Label>

          <Input
            value={room.existing_ceiling || ""}
            placeholder="e.g. POP false ceiling"
            onChange={(e) => update("existing_ceiling", e.target.value)}
          />
        </div>

        {/* NOTES */}
        <div className="md:col-span-2 space-y-2">
          <Label>Notes</Label>

          <Textarea
            rows={4}
            value={room.notes || ""}
            placeholder="Any site observations for this room..."
            onChange={(e) => update("notes", e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-5 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>

        <Button onClick={onSave} disabled={!room?.room_name?.trim()}>
          <Save className="mr-2 h-4 w-4" />
          Save Room
        </Button>
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
    <div className="border rounded-xl bg-muted/20 p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="font-semibold text-foreground">
            {photo?.id ? "Edit Photo / Layout Shot" : "Add Photo / Layout Shot"}
          </div>

          <div className="text-xs text-muted-foreground mt-1">
            Associate the shot with a room and record the camera position.
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={onCancel} title="Close">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* ROOM */}
        <div className="space-y-2">
          <Label>
            Room <span className="text-destructive">*</span>
          </Label>

          <Select
            value={photo.room_id || ""}
            onValueChange={(value) => update("room_id", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Room" />
            </SelectTrigger>

            <SelectContent>
              {rooms.map((room, index) => (
                <SelectItem key={room.id || index} value={String(room.id)}>
                  {room.room_name}
                  {room.room_number ? ` • ${room.room_number}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* SHOT NUMBER */}
        <div className="space-y-2">
          <Label>
            Shot Number <span className="text-destructive">*</span>
          </Label>

          <Input
            type="number"
            min="1"
            value={photo.shot_number ?? ""}
            onChange={(e) => update("shot_number", e.target.value)}
          />
        </div>

        {/* ACTUAL PHOTO */}
        <div className="space-y-2">
          <Label>Actual Photo</Label>

          {photo.photo_url && (
            <div className="mb-2">
              <Preview label="Current Photo" url={photo.photo_url} />
            </div>
          )}

          <Button
            variant="outline"
            asChild
            disabled={uploadingPhoto || !onFileUpload}
          >
            <label className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />

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
          </Button>

          {!onFileUpload && (
            <p className="text-[11px] text-muted-foreground">
              File upload callback is not configured.
            </p>
          )}
        </div>

        {/* LAYOUT */}
        <div className="space-y-2">
          <Label>Layout Image</Label>

          {photo.layout_image_url && (
            <div className="mb-2">
              <Preview label="Current Layout" url={photo.layout_image_url} />
            </div>
          )}

          <Button
            variant="outline"
            asChild
            disabled={uploadingLayout || !onFileUpload}
          >
            <label className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />

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
          </Button>
        </div>

        {/* PHOTO URL */}
        <div className="space-y-2">
          <Label>Photo URL</Label>

          <Input
            value={photo.photo_url || ""}
            placeholder="https://..."
            onChange={(e) => update("photo_url", e.target.value)}
          />
        </div>

        {/* LAYOUT URL */}
        <div className="space-y-2">
          <Label>Layout URL</Label>

          <Input
            value={photo.layout_image_url || ""}
            placeholder="https://..."
            onChange={(e) => update("layout_image_url", e.target.value)}
          />
        </div>

        {/* STANDING POSITION */}
        <div className="space-y-2">
          <Label>Standing Position</Label>

          <Input
            value={photo.standing_position || ""}
            placeholder="e.g. Entrance door"
            onChange={(e) => update("standing_position", e.target.value)}
          />
        </div>

        {/* CAMERA DIRECTION */}
        <div className="space-y-2">
          <Label>Camera Direction</Label>

          <Input
            value={photo.camera_direction || ""}
            placeholder="e.g. North / towards TV wall"
            onChange={(e) => update("camera_direction", e.target.value)}
          />
        </div>

        {/* FILE NAMES */}
        <div className="space-y-2">
          <Label>Photo File Name</Label>

          <Input
            value={photo.photo_file_name || ""}
            onChange={(e) => update("photo_file_name", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Layout File Name</Label>

          <Input
            value={photo.layout_file_name || ""}
            onChange={(e) => update("layout_file_name", e.target.value)}
          />
        </div>

        {/* NOTES */}
        <div className="md:col-span-2 space-y-2">
          <Label>Notes</Label>

          <Textarea
            rows={4}
            value={photo.notes || ""}
            placeholder="Add observations about this shot..."
            onChange={(e) => update("notes", e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-5 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>

        <Button
          onClick={onSave}
          disabled={
            !photo?.room_id ||
            !photo?.shot_number ||
            uploadingPhoto ||
            uploadingLayout
          }
        >
          <Save className="mr-2 h-4 w-4" />
          Save Shot
        </Button>
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
  onFileUpload,
}) {
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
      <div className="space-y-4">
        {/* EMPTY STATE */}
        {restrictions.length === 0 ? (
          <div className="border border-dashed rounded-xl p-8 text-center">
            <div className="mx-auto h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <Plus className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="font-medium text-foreground">
              No site restrictions added
            </div>

            <div className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Add society, RWA, access, working-hour, material movement, utility
              or other site restrictions found during the recce.
            </div>

            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={handleAddRestriction}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Restriction
            </Button>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="border rounded-xl overflow-hidden">
              <div className="hidden md:grid md:grid-cols-[1fr_1.5fr_auto] gap-4 px-4 py-3 bg-muted/50 border-b">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Restriction Type
                </div>

                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Details / Notes
                </div>

                <div className="w-10" />
              </div>

              <div className="divide-y">
                {restrictions.map((restriction, index) => (
                  <div
                    key={restriction.id || `restriction-${index}`}
                    className="grid md:grid-cols-[1fr_1.5fr_auto] gap-4 p-4"
                  >
                    {/* TYPE */}
                    <div className="space-y-2">
                      <Label className="md:hidden">Restriction Type</Label>

                      <Select
                        value={restriction?.type || ""}
                        onValueChange={(value) =>
                          handleUpdateRestriction(index, "type", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select restriction" />
                        </SelectTrigger>

                        <SelectContent>
                          {(field.restrictionOptions || []).map((option) => (
                            <SelectItem
                              key={option.value}
                              value={String(option.value)}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* DETAILS */}
                    <div className="space-y-2">
                      <Label className="md:hidden">Details / Notes</Label>

                      <Input
                        value={restriction?.details || ""}
                        placeholder="Enter details / notes"
                        onChange={(event) =>
                          handleUpdateRestriction(
                            index,
                            "details",
                            event.target.value,
                          )
                        }
                      />
                    </div>

                    {/* DELETE */}
                    <div className="flex items-end justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteRestriction(index)}
                        title="Delete restriction"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ADD BUTTON */}
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddRestriction}
              >
                <Plus className="mr-2 h-4 w-4" />
                {field.addLabel || "Add Restriction"}
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };

  // ============================================================
  // RENDER ROOMS
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
                <div className="font-semibold text-foreground">Rooms</div>

                <div className="text-xs text-muted-foreground mt-1">
                  {rooms.length} room
                  {rooms.length !== 1 ? "s" : ""} added
                </div>
              </div>

              <Button onClick={handleAddRoom}>
                <Plus className="mr-2 h-4 w-4" />
                Add Room
              </Button>
            </div>

            {rooms.length === 0 ? (
              <div className="border border-dashed rounded-xl p-8 text-center">
                <Ruler className="mx-auto h-7 w-7 text-muted-foreground mb-3" />

                <div className="font-medium text-foreground">
                  No rooms added
                </div>

                <div className="text-xs text-muted-foreground mt-1">
                  Add the rooms found during the site recce.
                </div>

                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleAddRoom}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Room
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {rooms.map((room, index) => (
                  <div
                    key={room.id || index}
                    className="border rounded-xl p-4 bg-background"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-primary">
                          <Ruler className="h-4 w-4" />
                        </div>

                        <div>
                          <div className="font-semibold text-foreground">
                            {room.room_name}
                          </div>

                          <div className="text-xs text-muted-foreground mt-1">
                            {getRoomTypeLabel(room.room_type)}

                            {room.room_number
                              ? ` • Room ${room.room_number}`
                              : ""}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditRoom(room)}
                          title="Edit room"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteRoom(room.id)}
                          title="Delete room"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
                      <div className="mt-4 pt-4 border-t grid md:grid-cols-3 gap-4">
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
  // RENDER PHOTOS
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
                <div className="font-semibold text-foreground">
                  Photos & Layout References
                </div>

                <div className="text-xs text-muted-foreground mt-1">
                  {photos.length} shot
                  {photos.length !== 1 ? "s" : ""} added
                </div>
              </div>

              <Button onClick={handleAddPhoto} disabled={rooms.length === 0}>
                <Plus className="mr-2 h-4 w-4" />
                Add Shot
              </Button>
            </div>

            {rooms.length === 0 ? (
              <div className="border border-dashed rounded-xl p-8 text-center">
                <ImageIcon className="mx-auto h-7 w-7 text-muted-foreground mb-3" />

                <div className="font-medium text-foreground">
                  Add rooms first
                </div>

                <div className="text-xs text-muted-foreground mt-1">
                  Every photo/layout shot must be associated with a room.
                </div>
              </div>
            ) : photos.length === 0 ? (
              <div className="border border-dashed rounded-xl p-8 text-center">
                <ImageIcon className="mx-auto h-7 w-7 text-muted-foreground mb-3" />

                <div className="font-medium text-foreground">
                  No photos or layouts added
                </div>

                <div className="text-xs text-muted-foreground mt-1">
                  Add the photographs and layout references from the site visit.
                </div>

                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleAddPhoto}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Shot
                </Button>
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
                      className="border rounded-xl p-4 bg-background"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-primary">
                            <ImageIcon className="h-4 w-4" />
                          </div>

                          <div>
                            <div className="font-semibold text-foreground">
                              Shot #{photo.shot_number}
                            </div>

                            <div className="text-xs text-muted-foreground mt-1">
                              {room?.room_name || "Unknown Room"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditPhoto(photo)}
                            title="Edit shot"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeletePhoto(photo.id)}
                            title="Delete shot"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
                        <div className="mt-4 pt-4 border-t">
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
  // GENERIC FIELDS
  // ============================================================

  const renderFields = (section) => (
    <div className="grid md:grid-cols-2 gap-4">
      {(section.fields || []).map((field) => {
        // restriction-table is handled
        // separately by renderSectionBody
        if (field.type === "restriction-table") {
          return null;
        }

        const fieldValue = values?.[field.key] ?? "";

        return (
          <div
            key={field.key}
            className={
              field.type === "textarea"
                ? "md:col-span-2 space-y-2"
                : "space-y-2"
            }
          >
            <Label>
              {field.label}

              {field.required && (
                <span className="text-destructive ml-1">*</span>
              )}
            </Label>

            {/* TEXTAREA */}
            {field.type === "textarea" ? (
              <Textarea
                rows={field.rows || 4}
                value={fieldValue}
                placeholder={field.placeholder || ""}
                onChange={(e) =>
                  handleFieldChange(section.title, field.key, e.target.value)
                }
              />
            ) : /* DATE */
            field.type === "date" ? (
              <Input
                type="date"
                value={fieldValue}
                onChange={(e) =>
                  handleFieldChange(section.title, field.key, e.target.value)
                }
              />
            ) : /* TIME */
            field.type === "time" ? (
              <Input
                type="time"
                value={fieldValue}
                onChange={(e) =>
                  handleFieldChange(section.title, field.key, e.target.value)
                }
              />
            ) : /* SELECT */
            field.type === "select" ? (
              <Select
                value={
                  fieldValue === null || fieldValue === undefined
                    ? ""
                    : String(fieldValue)
                }
                onValueChange={(value) => {
                  const selectedOption = (field.options || []).find(
                    (option) => {
                      if (typeof option === "object" && option !== null) {
                        return String(option.value) === value;
                      }

                      return String(option) === value;
                    },
                  );

                  const finalValue =
                    typeof selectedOption === "object" &&
                    selectedOption !== null
                      ? selectedOption.value
                      : value;

                  handleFieldChange(section.title, field.key, finalValue);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>

                <SelectContent>
                  {(field.options || []).map((option, index) => {
                    if (typeof option === "object" && option !== null) {
                      return (
                        <SelectItem
                          key={`${option.value}-${index}`}
                          value={String(option.value)}
                        >
                          {option.label}
                        </SelectItem>
                      );
                    }

                    return (
                      <SelectItem
                        key={`${option}-${index}`}
                        value={String(option)}
                      >
                        {option}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            ) : (
              /* DEFAULT INPUT */
              <Input
                type={field.type || "text"}
                value={fieldValue}
                placeholder={field.placeholder || ""}
                onChange={(e) =>
                  handleFieldChange(section.title, field.key, e.target.value)
                }
              />
            )}
          </div>
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
  // RENDER
  // ============================================================

  return (
    <Shell title={title} subtitle={subtitle}>
      {/* ====================================================== */}
      {/* PROJECT SELECTOR */}
      {/* ====================================================== */}

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2 max-w-lg">
            <Label>Project *</Label>

            <Select value={projectId || ""} onValueChange={onProjectChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>

              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={String(project.id)}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ====================================================== */}
      {/* ALL SECTIONS */}
      {/* ====================================================== */}

      <div className="space-y-5 mt-5">
        {sections.map((section, index) => {
          let count = 0;

          if (section.type === "rooms") {
            count = rooms.length;
          }

          if (section.type === "roomPhotos") {
            count = photos.length;
          }

          if (
            section.fields?.some((field) => field.type === "restriction-table")
          ) {
            const restrictionField = section.fields.find(
              (field) => field.type === "restriction-table",
            );

            const restrictionValue = values?.[restrictionField?.key];

            if (Array.isArray(restrictionValue)) {
              count = restrictionValue.length;
            }
          }

          return (
            <Card key={section.key || section.title}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {index + 1}. {section.title}
                    </CardTitle>

                    {section.description && (
                      <CardDescription className="mt-1">
                        {section.description}
                      </CardDescription>
                    )}
                  </div>

                  {count > 0 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-primary">
                      {count}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent>{renderSectionBody(section)}</CardContent>
            </Card>
          );
        })}
      </div>

      {/* ====================================================== */}
      {/* BOTTOM SAVE BUTTON */}
      {/* ====================================================== */}

      <div className="mt-6 flex justify-end">
        <Button onClick={onSubmit} disabled={isSubmitting} size="lg">
          <Save className="mr-2 h-4 w-4" />

          {isSubmitting
            ? "Saving..."
            : title?.includes("Recce")
              ? "Save Site Recce"
              : "Generate Brief"}
        </Button>
      </div>

      {/* ====================================================== */}
      {/* AUTOSAVE STATUS */}
      {/* ====================================================== */}

      <div className="mt-4 text-xs text-muted-foreground text-center">
        Draft autosaved locally • {filledCount} item
        {filledCount !== 1 ? "s" : ""} completed
      </div>

      {children}
    </Shell>
  );
}

export default SiteRecceSectionForm;
