import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2, Upload, X } from "lucide-react";

import { SiteRecceSectionForm } from "../../components/SiteRecceSectionForm";
import { useAutoSave } from "../../hooks/use-autosave";

import { useGetProjectsQuery } from "../../api/project.api";
import { useGetUsersByRoleNameQuery } from "../../api/user.api";

import {
  useCreateSiteRecceMutation,
  useGetSiteRecceQuery,
  useUpdateSiteRecceMutation,
  useUploadSiteRecceImageMutation,
} from "../../api/site-recce.api";

import { REKI_SECTIONS } from "../../hooks/reki-sections";

const SAVE_KEY = "bc.site-recce";

// ============================================================
// BACKEND ENUM CONSTANTS
// ============================================================

const ROOM_TYPE_VALUES = [
  "LIVING_DINING",
  "MASTER_BEDROOM",
  "BEDROOM",
  "KITCHEN",
  "BATHROOM",
  "BALCONY",
  "OTHER",
];

const MEASUREMENT_UNIT_VALUES = ["FT", "M", "IN", "CM"];

// ============================================================
// NORMALIZATION HELPERS
// ============================================================

const toNumberOrUndefined = (v) => {
  if (v === "" || v === null || v === undefined) return undefined;

  const n = Number(v);

  return Number.isNaN(n) ? undefined : n;
};

const toIntOrUndefined = (v) => {
  const n = toNumberOrUndefined(v);

  return n === undefined ? undefined : Math.trunc(n);
};

const strOrUndefined = (v) =>
  v === "" || v === null || v === undefined ? undefined : v;

const boolOrUndefined = (v) => {
  if (v === "" || v === null || v === undefined) return undefined;

  if (typeof v === "boolean") return v;

  if (v === "true") return true;

  if (v === "false") return false;

  return Boolean(v);
};

const normalizeRoomType = (type) =>
  ROOM_TYPE_VALUES.includes(type) ? type : "OTHER";

const normalizeMeasurementUnit = (unit) => {
  const upper = String(unit || "FT").toUpperCase();

  return MEASUREMENT_UNIT_VALUES.includes(upper) ? upper : "FT";
};

// ============================================================
// BACKEND -> FORM
//
// Converts the GET /site-recces/:id response into the structure
// expected by SiteRecceSectionForm.
// ============================================================

const mapBackendToFormValues = (data) => {
  if (!data) {
    return {
      status: "draft",
      floors: [],
      layoutAttachments: [],
      documents: [],
      rooms: [],
      photos: [],
    };
  }

  const rooms = (data.rooms || []).map((room) => ({
    id: room.id,

    room_name: room.room_name || "",
    room_type: room.room_type || "OTHER",
    room_number:
      room.room_number === null || room.room_number === undefined
        ? ""
        : String(room.room_number),

    length:
      room.length === null || room.length === undefined
        ? ""
        : String(room.length),

    width:
      room.width === null || room.width === undefined ? "" : String(room.width),

    height:
      room.height === null || room.height === undefined
        ? ""
        : String(room.height),

    measurement_unit: room.measurement_unit || "FT",

    existing_flooring: room.existing_flooring || "",
    existing_ceiling: room.existing_ceiling || "",
    notes: room.notes || "",

    sort_order: room.sort_order ?? 0,
  }));

  // ----------------------------------------------------------
  // Convert nested backend photos back into the flat
  // values.photos structure used by the form.
  // ----------------------------------------------------------

  const photos = [];

  (data.rooms || []).forEach((room) => {
    (room.photos || []).forEach((photo) => {
      photos.push({
        id: photo.id,

        room_id: room.id,

        shot_number:
          photo.shot_number === null || photo.shot_number === undefined
            ? ""
            : String(photo.shot_number),

        layout_image_url: photo.layout_image_url || "",
        layout_file_name: photo.layout_file_name || "",

        photo_url: photo.photo_url || "",
        photo_file_name: photo.photo_file_name || "",

        standing_position: photo.standing_position || "",
        camera_direction: photo.camera_direction || "",
        notes: photo.notes || "",

        // Existing backend images do not need an object URL.
        // Keep the CDN URL as the preview.
        preview: photo.photo_url || "",
        layout_preview: photo.layout_image_url || "",
      });
    });
  });

  // ----------------------------------------------------------
  // The backend currently stores rooms directly under SiteRecce.
  //
  // The UI has a Floors & Rooms structure, so create one
  // logical floor containing all backend rooms.
  //
  // This keeps the current UI usable without inventing backend
  // floor data that does not exist.
  // ----------------------------------------------------------

  const floors =
    rooms.length > 0
      ? [
          {
            id: `backend-floor-${data.id}`,
            floor_name: data.unit_floor_no
              ? `Floor ${data.unit_floor_no}`
              : "Site Floor",

            floor_order: 1,

            approx_area_sqft:
              data.carpet_area_sqft !== null &&
              data.carpet_area_sqft !== undefined
                ? String(data.carpet_area_sqft)
                : "",

            remarks: "",

            rooms: rooms.map((room) => ({
              id: room.id,

              room_name: room.room_name,
              room_type: room.room_type,

              ceiling_height: room.height || "",
              beam_column_details: "",

              length: room.length || "",
              width: room.width || "",
              height: room.height || "",

              unit: String(room.measurement_unit || "FT").toLowerCase(),

              remarks: room.notes || "",
            })),
          },
        ]
      : [];

  // ----------------------------------------------------------
  // Layout attachments
  //
  // Existing layout images are represented through room photos
  // in the backend.
  // ----------------------------------------------------------

  const layoutAttachments = [];

  (data.rooms || []).forEach((room) => {
    (room.photos || []).forEach((photo) => {
      if (!photo.layout_image_url) return;

      layoutAttachments.push({
        id: `layout-${photo.id}`,

        title: photo.layout_file_name || `${room.room_name || "Room"} Layout`,

        remark: photo.notes || "",

        floor_id: "",

        images: [
          {
            id: photo.id,

            preview: photo.layout_image_url,

            url: photo.layout_image_url,

            file_name: photo.layout_file_name || "",

            caption: photo.notes || "",
          },
        ],
      });
    });
  });

  return {
    status: "draft",

    // ========================================================
    // MAIN SITE RECCE FIELDS
    // ========================================================

    project_id: data.project_id || "",

    project_name: data.project_name || "",

    client_name: data.client_name || "",

    site_address: data.site_address || "",

    recce_date: data.recce_date || "",

    site_engineer_id: data.site_engineer_id || "",

    accompanied_by: data.accompanied_by || "",

    unit_floor_no: data.unit_floor_no || "",

    carpet_area_sqft:
      data.carpet_area_sqft === null || data.carpet_area_sqft === undefined
        ? ""
        : String(data.carpet_area_sqft),

    built_up_area_sqft:
      data.built_up_area_sqft === null || data.built_up_area_sqft === undefined
        ? ""
        : String(data.built_up_area_sqft),

    number_of_rooms:
      data.number_of_rooms === null || data.number_of_rooms === undefined
        ? rooms.length
        : String(data.number_of_rooms),

    number_of_floors:
      data.number_of_floors === null || data.number_of_floors === undefined
        ? ""
        : String(data.number_of_floors),

    site_type: data.site_type || "",

    lift_available:
      data.lift_available === null || data.lift_available === undefined
        ? ""
        : data.lift_available,

    lift_size: data.lift_size || "",

    staircase_width: data.staircase_width || "",

    material_entry_point: data.material_entry_point || "",

    water_connection: data.water_connection || "",

    power_load_available: data.power_load_available || "",

    drainage_point_location:
      data.draining_point_location || data.drainage_point_location || "",

    society_rwa_restrictions: data.society_rwa_restrictions || "",

    working_hours_allowed: data.working_hours_allowed || "",

    material_movement_rule: data.material_movement_rule || "",

    existing_condition: data.existing_condition || "",

    // ========================================================
    // ROOM / PHOTO DATA
    // ========================================================

    rooms,

    photos,

    // ========================================================
    // UI-ONLY DATA
    // ========================================================

    floors,

    layoutAttachments,

    documents: [],
  };
};

// ============================================================
// FORM -> BACKEND ROOMS
// ============================================================

const buildRoomsPayload = (rooms, photos) => {
  return (rooms || []).map((room, index) => {
    const roomPhotos = (photos || [])
      .filter((photo) => String(photo.room_id) === String(room.id))
      .map((photo) => ({
        shot_number: toIntOrUndefined(photo.shot_number),

        layout_image_url: strOrUndefined(photo.layout_image_url),

        layout_file_name: strOrUndefined(photo.layout_file_name),

        photo_url: strOrUndefined(photo.photo_url),

        photo_file_name: strOrUndefined(photo.photo_file_name),

        standing_position: strOrUndefined(photo.standing_position),

        camera_direction: strOrUndefined(photo.camera_direction),

        notes: strOrUndefined(photo.notes),
      }));

    return {
      // Do not send frontend-only UUID if this is a new room.
      ...(room.id && !String(room.id).startsWith("room-")
        ? { id: room.id }
        : {}),

      room_name: room.room_name,

      room_type: normalizeRoomType(room.room_type),

      room_number: toIntOrUndefined(room.room_number),

      length: toNumberOrUndefined(room.length),

      width: toNumberOrUndefined(room.width),

      height: toNumberOrUndefined(room.height),

      measurement_unit: normalizeMeasurementUnit(room.measurement_unit),

      existing_flooring: strOrUndefined(room.existing_flooring),

      existing_ceiling: strOrUndefined(room.existing_ceiling),

      notes: strOrUndefined(room.notes),

      sort_order: index,

      ...(roomPhotos.length ? { photos: roomPhotos } : {}),
    };
  });
};

// ============================================================
// BUILD CREATE / UPDATE PAYLOAD
// ============================================================

const buildSiteReccePayload = (projectId, values) => {
  const rooms = buildRoomsPayload(values.rooms, values.photos);

  return {
    project_id: projectId,

    project_name: strOrUndefined(values.project_name),

    client_name: strOrUndefined(values.client_name),

    site_address: strOrUndefined(values.site_address),

    recce_date: values.recce_date,

    site_engineer_id: strOrUndefined(values.site_engineer_id),

    accompanied_by: strOrUndefined(values.accompanied_by),

    unit_floor_no: strOrUndefined(values.unit_floor_no),

    carpet_area_sqft: toNumberOrUndefined(values.carpet_area_sqft),

    built_up_area_sqft: toNumberOrUndefined(values.built_up_area_sqft),

    number_of_rooms: toIntOrUndefined(values.number_of_rooms) ?? rooms.length,

    number_of_floors: toIntOrUndefined(values.number_of_floors),

    site_type: strOrUndefined(values.site_type),

    lift_available: boolOrUndefined(values.lift_available),

    lift_size: strOrUndefined(values.lift_size),

    staircase_width: strOrUndefined(values.staircase_width),

    material_entry_point: strOrUndefined(values.material_entry_point),

    water_connection: strOrUndefined(values.water_connection),

    power_load_available: strOrUndefined(values.power_load_available),

    drainage_point_location: strOrUndefined(values.drainage_point_location),

    society_rwa_restrictions: strOrUndefined(values.society_rwa_restrictions),

    working_hours_allowed: strOrUndefined(values.working_hours_allowed),

    material_movement_rule: strOrUndefined(values.material_movement_rule),

    existing_condition: strOrUndefined(values.existing_condition),

    rooms,
  };
};

// ============================================================
// COMPONENT
// ============================================================

export function SiteRekiForm() {
  const navigate = useNavigate();

  const { id: siteRecceId } = useParams();

  const isEditMode = Boolean(siteRecceId);

  // ==========================================================
  // PROJECTS
  // ==========================================================

  const { data: projects = [] } = useGetProjectsQuery();

  // ==========================================================
  // SITE ENGINEERS
  // ==========================================================

  const { data: siteEngineers = [] } =
    useGetUsersByRoleNameQuery("SITE_ENGINEER");

  // ==========================================================
  // CREATE
  // ==========================================================

  const [createSiteRecce, { isLoading: isCreating }] =
    useCreateSiteRecceMutation();

  // ==========================================================
  // UPDATE
  // ==========================================================

  const [updateSiteRecce, { isLoading: isUpdating }] =
    useUpdateSiteRecceMutation();

  // ==========================================================
  // GET EXISTING SITE RECCE
  //
  // skip prevents GET /site-recces/undefined when creating.
  // ==========================================================

  const {
    data: existingSiteRecce,
    isLoading: isLoadingSiteRecce,
    isFetching: isFetchingSiteRecce,
    isError: isSiteRecceError,
  } = useGetSiteRecceQuery(siteRecceId, {
    skip: !isEditMode,
  });

  // ==========================================================
  // IMAGE UPLOAD
  // ==========================================================

  const [uploadSiteRecceImage] = useUploadSiteRecceImageMutation();

  // ==========================================================
  // PROJECT ID
  // ==========================================================

  const [projectId, setProjectId] = useState("");

  // ==========================================================
  // FORM STATE
  // ==========================================================

  const [values, setValues] = useAutoSave(SAVE_KEY, {
    status: "draft",

    project_id: "",

    project_name: "",
    client_name: "",
    site_address: "",
    recce_date: "",

    site_engineer_id: "",
    accompanied_by: "",

    unit_floor_no: "",
    carpet_area_sqft: "",
    built_up_area_sqft: "",
    number_of_rooms: "",
    number_of_floors: "",

    site_type: "",

    lift_available: "",
    lift_size: "",
    staircase_width: "",
    material_entry_point: "",

    water_connection: "",
    power_load_available: "",
    drainage_point_location: "",

    society_rwa_restrictions: "",
    working_hours_allowed: "",
    material_movement_rule: "",

    existing_condition: "",

    rooms: [],
    photos: [],

    floors: [],
    layoutAttachments: [],
    documents: [],
  });

  // ==========================================================
  // LOAD EXISTING SITE RECCE INTO FORM
  // ==========================================================

  useEffect(() => {
    if (!isEditMode) return;

    if (!existingSiteRecce) return;

    console.log("========== EXISTING SITE RECCE ==========", existingSiteRecce);

    const mappedValues = mapBackendToFormValues(existingSiteRecce);

    setProjectId(existingSiteRecce.project_id || "");

    setValues(mappedValues);
  }, [isEditMode, existingSiteRecce, setValues]);

  // ==========================================================
  // ERROR WHILE LOADING
  // ==========================================================

  useEffect(() => {
    if (!isSiteRecceError) return;

    toast.error("Failed to load Site Recce.");

    navigate("/site-recce");
  }, [isSiteRecceError, navigate]);

  // ==========================================================
  // SITE ENGINEER OPTIONS
  // ==========================================================

  const sections = useMemo(() => {
    const engineerOptions = siteEngineers.map((user) => ({
      label: user.name || user.full_name || user.email,

      value: user.id,
    }));

    return REKI_SECTIONS.map((section) => {
      if (!section.fields?.some((field) => field.key === "site_engineer_id")) {
        return section;
      }

      return {
        ...section,

        fields: section.fields.map((field) =>
          field.key === "site_engineer_id"
            ? {
                ...field,
                options: engineerOptions,
              }
            : field,
        ),
      };
    });
  }, [siteEngineers]);

  // ==========================================================
  // FIELD CHANGE
  // ==========================================================

  const handleFieldChange = (_section, key, value) => {
    setValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // ==========================================================
  // IMAGE UPLOAD
  // ==========================================================

  const handleFileUpload = async (file, type) => {
    try {
      const result = await uploadSiteRecceImage(file).unwrap();

      console.log("SITE RECCE UPLOAD RESULT:", result);

      const url =
        result?.url ||
        result?.data?.url ||
        result?.file?.url ||
        result?.data?.file?.url;

      if (!url) {
        throw new Error("Upload succeeded but no file URL was returned.");
      }

      return url;
    } catch (error) {
      console.error("SITE RECCE IMAGE UPLOAD FAILED:", error);

      throw error;
    }
  };

  // ==========================================================
  // FLOORS & ROOMS
  // ==========================================================

  const renderFloorsSection = () => {
    const floors = values.floors || [];

    const addFloor = () => {
      setValues((prev) => ({
        ...prev,

        floors: [
          ...(prev.floors || []),

          {
            id: crypto.randomUUID(),

            floor_name: "",

            floor_order: (prev.floors?.length || 0) + 1,

            approx_area_sqft: "",

            remarks: "",

            rooms: [],
          },
        ],
      }));
    };

    const updateFloor = (floorIndex, field, value) => {
      setValues((prev) => {
        const newFloors = [...(prev.floors || [])];

        newFloors[floorIndex] = {
          ...newFloors[floorIndex],
          [field]: value,
        };

        return {
          ...prev,
          floors: newFloors,
        };
      });
    };

    const removeFloor = (floorIndex) => {
      setValues((prev) => ({
        ...prev,

        floors: prev.floors.filter((_, i) => i !== floorIndex),
      }));
    };

    const addRoom = (floorIndex) => {
      setValues((prev) => {
        const newFloors = [...(prev.floors || [])];

        const floor = newFloors[floorIndex];

        floor.rooms = [
          ...(floor.rooms || []),

          {
            id: `room-${crypto.randomUUID()}`,

            room_name: "",

            room_type: "OTHER",

            ceiling_height: "",

            beam_column_details: "",

            length: "",

            width: "",

            height: "",

            unit: "ft",

            remarks: "",
          },
        ];

        return {
          ...prev,
          floors: newFloors,
        };
      });
    };

    const updateRoom = (floorIndex, roomIndex, field, value) => {
      setValues((prev) => {
        const newFloors = [...(prev.floors || [])];

        const floor = newFloors[floorIndex];

        floor.rooms[roomIndex] = {
          ...floor.rooms[roomIndex],
          [field]: value,
        };

        return {
          ...prev,
          floors: newFloors,
        };
      });
    };

    const removeRoom = (floorIndex, roomIndex) => {
      setValues((prev) => {
        const newFloors = [...(prev.floors || [])];

        newFloors[floorIndex].rooms = newFloors[floorIndex].rooms.filter(
          (_, i) => i !== roomIndex,
        );

        return {
          ...prev,
          floors: newFloors,
        };
      });
    };

    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Floors & Rooms Survey</h3>

          <button
            type="button"
            onClick={addFloor}
            className="flex items-center gap-2 bg-[#1F453B] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#1a3a32]"
          >
            <Plus size={16} />
            Add Floor
          </button>
        </div>

        {floors.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
            <p className="text-gray-500">No floors added yet.</p>

            <button
              type="button"
              onClick={addFloor}
              className="mt-4 text-[#1F453B] hover:underline"
            >
              Add your first floor
            </button>
          </div>
        ) : (
          floors.map((floor, floorIndex) => (
            <div
              key={floor.id}
              className="border border-gray-200 rounded-xl p-6 bg-white"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <span className="text-xl font-bold text-[#1F453B]">
                    Floor {floorIndex + 1}
                  </span>

                  <input
                    type="text"
                    value={floor.floor_name || ""}
                    onChange={(e) =>
                      updateFloor(floorIndex, "floor_name", e.target.value)
                    }
                    placeholder="Floor Name"
                    className="bc-input w-80"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={floor.approx_area_sqft || ""}
                    onChange={(e) =>
                      updateFloor(
                        floorIndex,
                        "approx_area_sqft",
                        e.target.value,
                      )
                    }
                    placeholder="Area (sqft)"
                    className="bc-input w-40"
                  />

                  <button
                    type="button"
                    onClick={() => removeFloor(floorIndex)}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <textarea
                value={floor.remarks || ""}
                onChange={(e) =>
                  updateFloor(floorIndex, "remarks", e.target.value)
                }
                rows={2}
                className="bc-input w-full mb-6"
                placeholder="Floor remarks..."
              />

              <div className="mt-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold">Rooms</h4>

                  <button
                    type="button"
                    onClick={() => addRoom(floorIndex)}
                    className="text-[#1F453B] flex items-center gap-1 text-sm hover:underline"
                  >
                    <Plus size={16} />
                    Add Room
                  </button>
                </div>

                {floor.rooms?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {[
                            "Room Name",
                            "Type",
                            "Ceiling Height",
                            "Length (ft)",
                            "Width (ft)",
                            "Beam/Column",
                            "Remarks",
                            "",
                          ].map((heading, index) => (
                            <th
                              key={index}
                              className="px-4 py-3 text-left text-xs font-medium text-gray-600"
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-200">
                        {floor.rooms.map((room, roomIndex) => (
                          <tr key={room.id}>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={room.room_name || ""}
                                onChange={(e) =>
                                  updateRoom(
                                    floorIndex,
                                    roomIndex,
                                    "room_name",
                                    e.target.value,
                                  )
                                }
                                className="bc-input w-full"
                              />
                            </td>

                            <td className="px-4 py-2">
                              <select
                                value={room.room_type || "OTHER"}
                                onChange={(e) =>
                                  updateRoom(
                                    floorIndex,
                                    roomIndex,
                                    "room_type",
                                    e.target.value,
                                  )
                                }
                                className="bc-input w-full"
                              >
                                {ROOM_TYPE_VALUES.map((type) => (
                                  <option key={type} value={type}>
                                    {type.replace(/_/g, " ")}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={room.ceiling_height || ""}
                                onChange={(e) =>
                                  updateRoom(
                                    floorIndex,
                                    roomIndex,
                                    "ceiling_height",
                                    e.target.value,
                                  )
                                }
                                className="bc-input w-full"
                              />
                            </td>

                            <td className="px-4 py-2">
                              <input
                                type="number"
                                value={room.length || ""}
                                onChange={(e) =>
                                  updateRoom(
                                    floorIndex,
                                    roomIndex,
                                    "length",
                                    e.target.value,
                                  )
                                }
                                className="bc-input w-full"
                              />
                            </td>

                            <td className="px-4 py-2">
                              <input
                                type="number"
                                value={room.width || ""}
                                onChange={(e) =>
                                  updateRoom(
                                    floorIndex,
                                    roomIndex,
                                    "width",
                                    e.target.value,
                                  )
                                }
                                className="bc-input w-full"
                              />
                            </td>

                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={room.beam_column_details || ""}
                                onChange={(e) =>
                                  updateRoom(
                                    floorIndex,
                                    roomIndex,
                                    "beam_column_details",
                                    e.target.value,
                                  )
                                }
                                className="bc-input w-full"
                              />
                            </td>

                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={room.remarks || ""}
                                onChange={(e) =>
                                  updateRoom(
                                    floorIndex,
                                    roomIndex,
                                    "remarks",
                                    e.target.value,
                                  )
                                }
                                className="bc-input w-full"
                              />
                            </td>

                            <td className="px-4 py-2">
                              <button
                                type="button"
                                onClick={() =>
                                  removeRoom(floorIndex, roomIndex)
                                }
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">
                    No rooms added yet.
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  // ============================================================
  // LAYOUT DRAWINGS
  // ============================================================

  const renderLayoutSection = () => {
    const layouts = values.layoutAttachments || [];

    const addLayout = () => {
      setValues((prev) => ({
        ...prev,

        layoutAttachments: [
          ...(prev.layoutAttachments || []),

          {
            id: crypto.randomUUID(),

            title: "",

            remark: "",

            floor_id: "",

            images: [],
          },
        ],
      }));
    };

    const updateLayout = (index, field, value) => {
      setValues((prev) => {
        const newLayouts = [...(prev.layoutAttachments || [])];

        newLayouts[index] = {
          ...newLayouts[index],
          [field]: value,
        };

        return {
          ...prev,
          layoutAttachments: newLayouts,
        };
      });
    };

    const removeLayout = (index) => {
      setValues((prev) => ({
        ...prev,

        layoutAttachments: prev.layoutAttachments.filter((_, i) => i !== index),
      }));
    };

    const handleImageUpload = (layoutIndex, e) => {
      const files = Array.from(e.target.files || []);

      setValues((prev) => {
        const newLayouts = [...(prev.layoutAttachments || [])];

        const layout = newLayouts[layoutIndex];

        const newImages = files.map((file) => ({
          id: crypto.randomUUID(),

          file,

          preview: URL.createObjectURL(file),

          caption: "",
        }));

        layout.images = [...(layout.images || []), ...newImages];

        return {
          ...prev,
          layoutAttachments: newLayouts,
        };
      });

      e.target.value = "";
    };

    const updateImageCaption = (layoutIndex, imageIndex, caption) => {
      setValues((prev) => {
        const newLayouts = [...(prev.layoutAttachments || [])];

        if (newLayouts[layoutIndex]?.images?.[imageIndex]) {
          newLayouts[layoutIndex].images[imageIndex].caption = caption;
        }

        return {
          ...prev,
          layoutAttachments: newLayouts,
        };
      });
    };

    const removeImage = (layoutIndex, imageIndex) => {
      setValues((prev) => {
        const newLayouts = [...(prev.layoutAttachments || [])];

        const image = newLayouts[layoutIndex]?.images?.[imageIndex];

        if (image?.preview && image?.file) {
          URL.revokeObjectURL(image.preview);
        }

        if (newLayouts[layoutIndex]?.images) {
          newLayouts[layoutIndex].images = newLayouts[
            layoutIndex
          ].images.filter((_, i) => i !== imageIndex);
        }

        return {
          ...prev,
          layoutAttachments: newLayouts,
        };
      });
    };

    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Layout Drawings</h3>

          <button
            type="button"
            onClick={addLayout}
            className="flex items-center gap-2 bg-[#1F453B] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#1a3a32]"
          >
            <Plus size={16} />
            Add Layout
          </button>
        </div>

        {layouts.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
            <p className="text-gray-500">No layout drawings added yet.</p>

            <button
              type="button"
              onClick={addLayout}
              className="mt-4 text-[#1F453B] hover:underline"
            >
              Add first layout
            </button>
          </div>
        ) : (
          layouts.map((layout, layoutIndex) => (
            <div
              key={layout.id}
              className="border border-gray-200 rounded-xl p-6 bg-white"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    value={layout.title || ""}
                    onChange={(e) =>
                      updateLayout(layoutIndex, "title", e.target.value)
                    }
                    placeholder="Layout Title"
                    className="bc-input text-lg font-semibold w-full mb-3"
                  />

                  <select
                    value={layout.floor_id || ""}
                    onChange={(e) =>
                      updateLayout(layoutIndex, "floor_id", e.target.value)
                    }
                    className="bc-input w-full max-w-xs"
                  >
                    <option value="">No specific floor</option>

                    {(values.floors || []).map((f, i) => (
                      <option key={f.id} value={f.id}>
                        {f.floor_name || `Floor ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => removeLayout(layoutIndex)}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <textarea
                value={layout.remark || ""}
                onChange={(e) =>
                  updateLayout(layoutIndex, "remark", e.target.value)
                }
                rows={3}
                className="bc-input w-full mb-6"
                placeholder="Remarks about this layout..."
              />

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold">Images</h4>

                  <label className="cursor-pointer flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm">
                    <Upload size={16} />
                    Upload Images
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(layoutIndex, e)}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {(layout.images || []).map((image, imgIndex) => (
                    <div
                      key={image.id}
                      className="border rounded-lg overflow-hidden bg-gray-50"
                    >
                      <div className="relative">
                        {image.preview ? (
                          <img
                            src={image.preview}
                            alt="Layout"
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400">
                            No Preview
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => removeImage(layoutIndex, imgIndex)}
                          className="absolute top-2 right-2 bg-white rounded-full p-1 text-red-500 hover:bg-red-50"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <div className="p-3">
                        <input
                          type="text"
                          value={image.caption || ""}
                          onChange={(e) =>
                            updateImageCaption(
                              layoutIndex,
                              imgIndex,
                              e.target.value,
                            )
                          }
                          placeholder="Caption"
                          className="bc-input text-sm w-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  // ============================================================
  // SECTION RENDERER
  // ============================================================

  const renderSection = (section) => {
    if (section.type === "floors") {
      return renderFloorsSection();
    }

    if (section.type === "layoutAttachments") {
      return renderLayoutSection();
    }

    if (section.type === "documents") {
      return (
        <div className="py-12 text-center text-gray-500">
          Additional Documents section coming soon...
        </div>
      );
    }

    return null;
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async () => {
    if (!projectId) {
      toast.error("Please select a project.");

      return;
    }

    if (!values.recce_date) {
      toast.error("Please select a recce date.");

      return;
    }

    try {
      const payload = buildSiteReccePayload(projectId, values);

      console.log("========== SITE RECCE VALUES ==========", values);

      console.log(
        "========== SITE RECCE PAYLOAD ==========",
        JSON.stringify(payload, null, 2),
      );

      // ========================================================
      // UPDATE
      // ========================================================

      if (isEditMode) {
        console.log("UPDATING SITE RECCE:", siteRecceId);

        const updated = await updateSiteRecce({
          id: siteRecceId,
          ...payload,
        }).unwrap();

        toast.success("Site Recce updated successfully.");

        localStorage.removeItem(SAVE_KEY);

        navigate(`/site-recce/${siteRecceId}`);

        return;
      }

      // ========================================================
      // CREATE
      // ========================================================

      const recce = await createSiteRecce(payload).unwrap();

      toast.success("Site Recce created successfully.");

      localStorage.removeItem(SAVE_KEY);

      navigate(`/site-recce/${recce.id}`);
    } catch (error) {
      console.error("SITE RECCE SAVE ERROR:", error);

      const backendMessage = error?.data?.message;

      if (Array.isArray(backendMessage) && backendMessage.length) {
        toast.error(backendMessage[0]);
      } else if (typeof backendMessage === "string") {
        toast.error(backendMessage);
      } else {
        toast.error(
          isEditMode
            ? "Failed to update Site Recce."
            : "Failed to create Site Recce.",
        );
      }
    }
  };

  // ============================================================
  // LOADING STATE FOR EDIT
  // ============================================================

  if (isEditMode && (isLoadingSiteRecce || isFetchingSiteRecce)) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#1F453B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />

          <p className="text-gray-500">Loading Site Recce...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <SiteRecceSectionForm
      title={isEditMode ? "Edit Site Recce" : "Site Recce"}
      subtitle={
        isEditMode
          ? "Update site inspection details"
          : "Complete site inspection form"
      }
      sections={sections}
      values={values}
      onFieldChange={handleFieldChange}
      projects={projects}
      projectId={projectId}
      onProjectChange={setProjectId}
      onSubmit={handleSubmit}
      isSubmitting={isCreating || isUpdating}
      renderSection={renderSection}
      onFileUpload={handleFileUpload}
    />
  );
}
