import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Edit3, Trash2, Printer, FileText } from "lucide-react";
import { Shell, Card } from "../../hooks/shared";
import {
  useGetSiteRecceByIdQuery,
  useDeleteSiteRecceMutation,
} from "../../api/reki.api";

const statusBadgeClass = (status) => {
  switch (status) {
    case "approved":
      return "bg-[#E4F3E8] text-[#1F7A3D]";
    case "submitted":
      return "bg-[#FDEFD9] text-[#B0740F]";
    default:
      return "bg-[#EAEEF0] text-[#333333]";
  }
};

export function SiteRekiView() {
  const { id } = useParams();
  const nav = useNavigate();
  const [lightbox, setLightbox] = useState(null);

  const {
    data: recce,
    isFetching,
    isError,
  } = useGetSiteRecceByIdQuery(id, { skip: !id });

  const [deleteSiteRecce, { isLoading: deleting }] =
    useDeleteSiteRecceMutation();

  const removeRecce = async () => {
    if (!window.confirm("Delete this site recce? This cannot be undone.")) return;
    try {
      await deleteSiteRecce(id).unwrap();
      toast.success("Site recce deleted");
      nav("/site-recce");
    } catch (e) {
      toast.error(e?.data?.detail || "Failed to delete");
    }
  };

  const printReport = () => {
    window.print();
  };

  if (isFetching) {
    return (
      <Shell title="Site Recce">
        <div className="text-[13px] text-[#6B7B7C]">Loading…</div>
      </Shell>
    );
  }

  if (isError || !recce) {
    return (
      <Shell title="Site Recce">
        <Card>
          <div className="text-center text-[#B5C4B6] py-8">
            Site recce not found, or you don't have access to it.
          </div>
        </Card>
      </Shell>
    );
  }

  const floors = recce.floors || [];
  const layoutAttachments = recce.layoutAttachments || [];
  const documents = recce.documents || []; // ✅ Correctly using top-level documents
  const project = recce.project || {};

  return (
    <Shell
      title="Site Recce Report"
      subtitle={`${project.name || "Project"} • ${recce.recce_date || ""}`}
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => nav("/site-recce")}
            className="h-10 px-4 rounded-lg border border-[#DDD8CE] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <button
            onClick={() => nav(`/site-recce/${id}/edit`)}
            className="h-10 px-4 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5"
          >
            <Edit3 size={14} /> Edit
          </button>
          <button
            onClick={printReport}
            className="h-10 px-4 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5"
          >
            <Printer size={14} /> Print
          </button>
          <button
            onClick={removeRecce}
            disabled={deleting}
            className="h-10 px-4 rounded-lg border border-[#E3B7A4] text-[13px] font-semibold text-[#B04D26] inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      }
    >
      {/* A4 Styled Document Container */}
      <div className="max-w-4xl mx-auto bg-white shadow-sm border border-[#E5E5E5] print:shadow-none print:border-none">
        {/* Header */}
        <div className="border-b border-[#E5E5E5] px-10 py-8 bg-[#F8F9F8]">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-2xl font-semibold tracking-tight text-[#1F2937]">
                SITE RECONNAISSANCE REPORT
              </div>
              <div className="text-lg text-[#4B5563] mt-1">{project.name}</div>
              <div className="text-sm text-[#6B7280] mt-0.5">{project.site_location}</div>
            </div>
            <div className="text-right">
              <div className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${statusBadgeClass(recce.status)}`}>
                {recce.status?.toUpperCase() || "DRAFT"}
              </div>
              <div className="mt-4 text-sm text-[#6B7280]">
                Recce Date: <span className="font-medium text-[#1F2937]">{recce.recce_date}</span>
              </div>
              <div className="text-sm text-[#6B7280]">
                Time: <span className="font-medium text-[#1F2937]">{recce.time_of_visit}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Site Information */}
        <div className="px-10 py-8 border-b border-[#E5E5E5]">
          <h2 className="text-lg font-semibold mb-6 text-[#1F2937] border-b pb-2">Site Information</h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-sm">
            <div>
              <span className="text-[#6B7280] block mb-1">Site Accessibility</span>
              <span className="font-medium">{recce.site_accessibility}</span>
            </div>
            <div>
              <span className="text-[#6B7280] block mb-1">Road Width Near Site</span>
              <span className="font-medium">{recce.road_width_near_site} ft</span>
            </div>
            <div>
              <span className="text-[#6B7280] block mb-1">Vehicle Entry Available</span>
              <span className="font-medium">{recce.vehicle_entry_available}</span>
            </div>
            <div>
              <span className="text-[#6B7280] block mb-1">Loading / Unloading Space</span>
              <span className="font-medium">{recce.loading_unloading_space}</span>
            </div>
            <div>
              <span className="text-[#6B7280] block mb-1">Lift Available</span>
              <span className="font-medium">{recce.lift_available}</span>
            </div>
            <div>
              <span className="text-[#6B7280] block mb-1">Service Lift Available</span>
              <span className="font-medium">{recce.service_lift_available}</span>
            </div>
            <div>
              <span className="text-[#6B7280] block mb-1">Staircase Width</span>
              <span className="font-medium">{recce.staircase_width} ft</span>
            </div>
            <div>
              <span className="text-[#6B7280] block mb-1">Parking Availability</span>
              <span className="font-medium">{recce.parking_availability}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[#6B7280] block mb-1">Access Restrictions</span>
              <span className="font-medium">{recce.access_restrictions || "—"}</span>
            </div>
          </div>
        </div>

        {/* Existing Site Condition */}
        <div className="px-10 py-8 border-b border-[#E5E5E5]">
          <h2 className="text-lg font-semibold mb-6 text-[#1F2937] border-b pb-2">Existing Site Condition</h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-sm">
            <div>
              <span className="text-[#6B7280] block mb-1">Current Site Status</span>
              <span className="font-medium">{recce.current_site_status}</span>
            </div>
            <div>
              <span className="text-[#6B7280] block mb-1">Existing Flooring Condition</span>
              <span className="font-medium">{recce.existing_flooring_condition}</span>
            </div>
            <div>
              <span className="text-[#6B7280] block mb-1">Existing Wall Condition</span>
              <span className="font-medium">{recce.existing_wall_condition}</span>
            </div>
            <div>
              <span className="text-[#6B7280] block mb-1">Existing Ceiling Condition</span>
              <span className="font-medium">{recce.existing_ceiling_condition}</span>
            </div>
            <div>
              <span className="text-[#6B7280] block mb-1">Doors &amp; Windows Condition</span>
              <span className="font-medium">{recce.existing_doors_windows_condition}</span>
            </div>
            <div>
              <span className="text-[#6B7280] block mb-1">Leakage / Dampness Observed</span>
              <span className="font-medium">{recce.leakage_dampness_observed}</span>
            </div>
            <div>
              <span className="text-[#6B7280] block mb-1">Cracks Observed</span>
              <span className="font-medium">{recce.cracks_observed || "No"}</span>
            </div>
          </div>
        </div>

        {/* Utilities */}
        <div className="px-10 py-8 border-b border-[#E5E5E5]">
          <h2 className="text-lg font-semibold mb-6 text-[#1F2937] border-b pb-2">Utilities</h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-sm">
            <div>
              <span className="text-[#6B7280] block mb-1">Power Supply Status</span>
              <span className="font-medium">{recce.power_supply_status}</span>
            </div>
            <div>
              <span className="text-[#6B7280] block mb-1">Main DB Location</span>
              <span className="font-medium">{recce.main_db_location}</span>
            </div>
            <div>
              <span className="text-[#6B7280] block mb-1">Meter Location</span>
              <span className="font-medium">{recce.meter_location}</span>
            </div>
            <div>
              <span className="text-[#6B7280] block mb-1">Water Supply Available</span>
              <span className="font-medium">{recce.water_supply_available}</span>
            </div>
            <div>
              <span className="text-[#6B7280] block mb-1">Drainage Line Available</span>
              <span className="font-medium">{recce.drainage_line_available}</span>
            </div>
            <div>
              <span className="text-[#6B7280] block mb-1">Existing Plumbing Condition</span>
              <span className="font-medium">{recce.existing_plumbing_condition}</span>
            </div>
            <div>
              <span className="text-[#6B7280] block mb-1">Kitchen Plumbing Checked</span>
              <span className="font-medium">{recce.kitchen_plumbing_checked}</span>
            </div>
            <div>
              <span className="text-[#6B7280] block mb-1">Bathroom Plumbing Checked</span>
              <span className="font-medium">{recce.bathroom_plumbing_checked}</span>
            </div>
          </div>
        </div>

        {/* Floors & Rooms */}
        <div className="px-10 py-8 border-b border-[#E5E5E5]">
          <h2 className="text-lg font-semibold mb-6 text-[#1F2937] border-b pb-2 flex justify-between">
            Floors &amp; Rooms
            <span className="text-sm font-normal text-[#6B7280]">{floors.length} Floor{floors.length !== 1 ? "s" : ""}</span>
          </h2>

          {floors.length === 0 ? (
            <p className="text-[#6B7280]">No floors recorded.</p>
          ) : (
            <div className="space-y-10">
              {floors.map((floor, idx) => (
                <div key={floor.id} className="border border-[#E5E5E5] rounded-xl overflow-hidden">
                  <div className="bg-[#F8F9F8] px-6 py-4 border-b flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-[#1F2937]">Floor {idx + 1}:</span>{" "}
                      <span className="font-medium">{floor.floor_name}</span>
                    </div>
                    <div className="text-sm text-[#6B7280]">
                      Approx. Area: <span className="font-medium text-[#1F2937]">{floor.approx_area_sqft} sqft</span>
                    </div>
                  </div>

                  {floor.rooms && floor.rooms.length > 0 && (
                    <div className="divide-y">
                      {floor.rooms.map((room) => (
                        <div key={room.id} className="px-6 py-5">
                          <div className="font-medium text-[#1F2937] mb-3 flex items-center gap-3">
                            {room.room_name}
                            <span className="text-xs px-2.5 py-0.5 bg-[#F1F5F9] rounded-full text-[#475569]">
                              {room.room_type}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 text-sm">
                            <div>
                              <span className="text-[#6B7280]">Ceiling Height</span>
                              <div className="font-medium mt-0.5">{room.ceiling_height} ft</div>
                            </div>
                            <div>
                              <span className="text-[#6B7280]">Dimensions (L × W)</span>
                              <div className="font-medium mt-0.5">
                                {room.length} × {room.width} ft
                              </div>
                            </div>
                            <div>
                              <span className="text-[#6B7280]">Beam / Column Details</span>
                              <div className="font-medium mt-0.5">{room.beam_column_details || "—"}</div>
                            </div>
                            <div className="col-span-2 md:col-span-3">
                              <span className="text-[#6B7280]">Remarks</span>
                              <div className="font-medium mt-0.5 text-[#374151]">{room.remarks || "—"}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Layout Attachments */}
        {layoutAttachments.length > 0 && (
          <div className="px-10 py-8 border-b border-[#E5E5E5]">
            <h2 className="text-lg font-semibold mb-6 text-[#1F2937] border-b pb-2">Layout Attachments</h2>
            <div className="space-y-12">
              {layoutAttachments.map((layout) => {
                const images = layout.images || [];
                return (
                  <div key={layout.id}>
                    <div className="font-medium mb-4 text-[#1F2937]">{layout.title}</div>
                    {images.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {images.map((img) => (
                          <div
                            key={img.id}
                            className="border border-[#E5E5E5] rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => img.document?.url && setLightbox(img.document)}
                          >
                            {img.document?.url ? (
                              <img
                                src={img.document.url}
                                alt={img.caption}
                                className="w-full h-64 object-cover"
                              />
                            ) : (
                              <div className="h-64 bg-[#F8F9F8] flex items-center justify-center">
                                <span className="text-[#9CA3AF]">No Preview</span>
                              </div>
                            )}
                            {img.caption && (
                              <div className="p-4 text-sm border-t bg-white">
                                {img.caption}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Documents - Correctly integrated top-level documents */}
        {documents.length > 0 && (
          <div className="px-10 py-8 border-b border-[#E5E5E5]">
            <h2 className="text-lg font-semibold mb-6 text-[#1F2937] border-b pb-2 flex items-center gap-2">
              <FileText size={20} />
              Additional Documents
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group border border-[#E5E5E5] rounded-xl p-5 hover:border-[#B5C4B6] hover:shadow-md transition-all flex gap-4 items-start"
                >
                  <div className="text-4xl text-[#6B7280] group-hover:text-[#1F2937] transition-colors">📄</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[#1F2937] group-hover:underline">{doc.title || doc.filename}</div>
                    <div className="text-sm text-[#6B7280] mt-1 truncate">{doc.filename}</div>
                    {doc.documentDate && (
                      <div className="text-xs text-[#9CA3AF] mt-2">
                        Date: {doc.documentDate}
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-10 py-6 border-t text-xs text-[#6B7280] flex justify-between bg-[#F8F9F8]">
          <div>Generated on {new Date().toLocaleDateString()}</div>
          <div>Site Recce ID: {recce.id}</div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox.url}
            alt={lightbox.caption || "Document preview"}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </Shell>
  );
}