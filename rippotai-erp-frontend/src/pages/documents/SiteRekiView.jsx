import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { Shell, Card } from "../../hooks/shared";

export function SiteRekiView() {
  const { id } = useParams();
  const nav = useNavigate();
  const [doc, setDoc] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [imgUrls, setImgUrls] = useState({});
  useEffect(() => {
    api
      .get(`/documents/${id}/reki`)
      .then(async (r) => {
        setDoc(r.data);
        // Preload image blobs (auth required — can't use raw URLs)
        const urls = {};
        for (const a of r.data.attachments || []) {
          if ((a.mime || "").startsWith("image/")) {
            try {
              const resp = await api.get(
                `/documents/${id}/attachments/${a.id}`,
                { responseType: "blob" },
              );
              urls[a.id] = URL.createObjectURL(resp.data);
            } catch {}
          }
        }
        setImgUrls(urls);
      })
      .catch(() => toast.error("Failed to load Site Reki"));
    return () => {
      Object.values(imgUrls).forEach(URL.revokeObjectURL);
    };
    // eslint-disable-next-line
  }, [id]);
  const download = async (att) => {
    try {
      const resp = await api.get(`/documents/${id}/attachments/${att.id}`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(resp.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = att.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed");
    }
  };
  if (!doc)
    return (
      <Shell title="Site Reki">
        <div className="text-[13px] text-[#6B7B7C]">Loading…</div>
      </Shell>
    );
  const attachments = doc.attachments || [];
  return (
    <Shell
      title={doc.title || "Site Reki"}
      subtitle={`${doc.filename || ""} · ${doc.uploaded_by_name || ""} · ${(doc.document_date || doc.created_at || "").slice(0, 10)}`}
      action={
        <button
          onClick={() => nav("/documents/all")}
          className="h-10 px-4 rounded-lg border border-[#DDD8CE] text-[13px] font-semibold text-[#333333]"
        >
          Back to Documents
        </button>
      }
    >
      <Card>
        <div className="text-[15px] font-semibold text-[#333333] mb-2">
          Report
        </div>
        <div className="grid gap-3">
          {Object.entries(doc.sections || {}).map(([sec, fields]) => (
            <div key={sec} className="border border-[#EAEEF0] rounded-lg p-3">
              <div className="text-[13px] font-semibold text-[#333333] mb-1.5">
                {sec}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(fields || {}).map(([k, v]) => (
                  <div key={k} className="text-[12.5px]">
                    <span className="text-[#6B7B7C]">{k}:</span>{" "}
                    <span className="text-[#333333]">{String(v || "—")}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(doc.sections || {}).length === 0 && (
            <div className="text-[12.5px] text-[#6B7B7C]">
              No sections captured.
            </div>
          )}
        </div>
      </Card>
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[15px] font-semibold text-[#333333]">
            Attachments
          </div>
          <div className="text-[12px] text-[#6B7B7C]">
            {attachments.length} file{attachments.length !== 1 ? "s" : ""}
          </div>
        </div>
        {attachments.length === 0 ? (
          <div className="text-[12.5px] text-[#6B7B7C]">
            No attachments were added to this Site Reki.
          </div>
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
            data-testid="reki-view-grid"
          >
            {attachments.map((a) => {
              const isImg = (a.mime || "").startsWith("image/");
              return (
                <div
                  key={a.id}
                  className="border border-[#EAEEF0] rounded-lg overflow-hidden bg-white"
                  data-testid={`reki-view-attach-${a.id}`}
                >
                  {isImg ? (
                    <button
                      onClick={() => setLightbox(a)}
                      className="block w-full aspect-[4/3] bg-[#F4F6F7]"
                    >
                      {imgUrls[a.id] ? (
                        <img
                          alt={a.filename}
                          src={imgUrls[a.id]}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[12px] text-[#6B7B7C]">
                          Loading…
                        </div>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => download(a)}
                      className="w-full h-32 flex flex-col items-center justify-center gap-1 bg-[#F4F6F7] hover:bg-[#EAEEF0]"
                    >
                      <FileText size={30} className="text-[#6B7B7C]" />
                      <div className="text-[12.5px] font-semibold text-[#333333] px-2 truncate max-w-full">
                        {a.filename}
                      </div>
                      <div className="text-[11px] text-[#6B7B7C]">
                        {(a.size / 1024).toFixed(1)} KB · click to download
                      </div>
                    </button>
                  )}
                  <div className="p-2.5">
                    <div className="text-[12px] font-semibold text-[#333333] truncate">
                      {a.filename}
                    </div>
                    <div className="text-[12.5px] text-[#333333] mt-0.5">
                      {a.remark || (
                        <span className="text-[#B5C4B6] italic">No remark</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )} 
      </Card>
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-6"
          onClick={() => setLightbox(null)}
          data-testid="reki-lightbox"
        >
          <img
            alt={lightbox.filename}
            src={imgUrls[lightbox.id]}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </Shell>
  );
}