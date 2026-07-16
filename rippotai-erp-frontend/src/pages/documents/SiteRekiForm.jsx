import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SectionForm } from "../../components/SectionForm";
import { useAutoSave } from "../../hooks/use-autosave";
import { useGetProjectsQuery } from "../../api/project.api";
import { useCreateSiteRecceMutation } from "../../api/reki.api";
import { REKI_SECTIONS } from "../../hooks/reki-sections";
import { Plus, Trash2, Upload, X } from "lucide-react";

const SAVE_KEY = "bc.site-recce";

export function SiteRekiForm() {
  const navigate = useNavigate();
  const { data: projects = [] } = useGetProjectsQuery();
  const [createSiteRecce, { isLoading }] = useCreateSiteRecceMutation();

  const [projectId, setProjectId] = useState("");
  const [values, setValues] = useAutoSave(SAVE_KEY, {
    status: "draft",
    floors: [],
    layoutAttachments: [],
    documents: [],
  });

  const handleFieldChange = (_section, key, value) => {
    setValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // ====================== FLOORS & ROOMS SECTION ======================
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
        newFloors[floorIndex] = { ...newFloors[floorIndex], [field]: value };
        return { ...prev, floors: newFloors };
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
            id: crypto.randomUUID(),
            room_name: "",
            room_type: "",
            ceiling_height: "",
            beam_column_details: "",
            length: "",
            width: "",
            height: "",
            unit: "ft",
            remarks: "",
          },
        ];
        return { ...prev, floors: newFloors };
      });
    };

    const updateRoom = (floorIndex, roomIndex, field, value) => {
      setValues((prev) => {
        const newFloors = [...(prev.floors || [])];
        const floor = newFloors[floorIndex];
        floor.rooms[roomIndex] = { ...floor.rooms[roomIndex], [field]: value };
        return { ...prev, floors: newFloors };
      });
    };

    const removeRoom = (floorIndex, roomIndex) => {
      setValues((prev) => {
        const newFloors = [...(prev.floors || [])];
        newFloors[floorIndex].rooms = newFloors[floorIndex].rooms.filter(
          (_, i) => i !== roomIndex,
        );
        return { ...prev, floors: newFloors };
      });
    };

    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Floors & Rooms Survey</h3>
          <button
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
              {/* Floor Header */}
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

              {/* Rooms Table */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold">Rooms</h4>
                  <button
                    onClick={() => addRoom(floorIndex)}
                    className="text-[#1F453B] flex items-center gap-1 text-sm hover:underline"
                  >
                    <Plus size={16} /> Add Room
                  </button>
                </div>

                {floor.rooms?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                            Room Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                            Ceiling Height
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                            Length (ft)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                            Width (ft)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                            Beam/Column
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                            Remarks
                          </th>
                          <th className="w-10"></th>
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
                              <input
                                type="text"
                                value={room.room_type || ""}
                                onChange={(e) =>
                                  updateRoom(
                                    floorIndex,
                                    roomIndex,
                                    "room_type",
                                    e.target.value,
                                  )
                                }
                                className="bc-input w-full"
                              />
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

  // ====================== LAYOUT DRAWINGS SECTION (Fixed) ======================
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
        newLayouts[index] = { ...newLayouts[index], [field]: value };
        return { ...prev, layoutAttachments: newLayouts };
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
        return { ...prev, layoutAttachments: newLayouts };
      });
    };

    const updateImageCaption = (layoutIndex, imageIndex, caption) => {
      setValues((prev) => {
        const newLayouts = [...(prev.layoutAttachments || [])];
        if (newLayouts[layoutIndex]?.images?.[imageIndex]) {
          newLayouts[layoutIndex].images[imageIndex].caption = caption;
        }
        return { ...prev, layoutAttachments: newLayouts };
      });
    };

    const removeImage = (layoutIndex, imageIndex) => {
      setValues((prev) => {
        const newLayouts = [...(prev.layoutAttachments || [])];
        const image = newLayouts[layoutIndex]?.images?.[imageIndex];
        if (image?.preview) URL.revokeObjectURL(image.preview);

        if (newLayouts[layoutIndex]?.images) {
          newLayouts[layoutIndex].images = newLayouts[
            layoutIndex
          ].images.filter((_, i) => i !== imageIndex);
        }
        return { ...prev, layoutAttachments: newLayouts };
      });
    };

    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Layout Drawings</h3>
          <button
            onClick={addLayout}
            className="flex items-center gap-2 bg-[#1F453B] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#1a3a32]"
          >
            <Plus size={16} /> Add Layout
          </button>
        </div>

        {layouts.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
            <p className="text-gray-500">No layout drawings added yet.</p>
            <button
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
                    <Upload size={16} /> Upload Images
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
                            alt="preview"
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400">
                            No Preview
                          </div>
                        )}
                        <button
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

  const renderSection = (section) => {
    if (section.type === "floors") return renderFloorsSection();
    if (section.type === "layoutAttachments") return renderLayoutSection();
    if (section.type === "documents")
      return (
        <div className="py-12 text-center text-gray-500">
          Additional Documents section coming soon...
        </div>
      );
    return null;
  };

  const handleSubmit = async () => {
    if (!projectId) return toast.error("Please select a project.");

    try {
      const payload = { project_id: projectId, ...values };
      const recce = await createSiteRecce(payload).unwrap();
      toast.success("Site Recce created successfully.");
      localStorage.removeItem(SAVE_KEY);
      navigate(`/site-recce/${recce.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create Site Recce.");
    }
  };

  return (
    <SectionForm
      title="Site Recce"
      subtitle="Complete site inspection form"
      sections={REKI_SECTIONS}
      values={values}
      onFieldChange={handleFieldChange}
      projects={projects}
      projectId={projectId}
      onProjectChange={setProjectId}
      onSubmit={handleSubmit}
      isSubmitting={isLoading}
      renderSection={renderSection}
    />
  );
}
