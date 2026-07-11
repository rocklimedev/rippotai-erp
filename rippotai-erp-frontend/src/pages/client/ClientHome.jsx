import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { relativeTime } from "@/lib/format";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ClientHome() {
  const [data, setData] = useState(null);
  const { logout, user } = useAuth();

  useEffect(() => {
    api
      .get("/client-home")
      .then((r) => setData(r.data))
      .catch(() => {});
  }, []);

  if (!data)
    return (
      <div className="min-h-screen bg-[#EAEEF0] flex items-center justify-center text-[#6B7B7C]">
        Loading…
      </div>
    );

  return (
    <div className="min-h-screen bg-[#EAEEF0]">
      <div className="border-b border-[#B5C4B6] bg-white/70 backdrop-blur-sm">
        <div className="max-w-[1100px] mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-[#333333] font-bold text-[20px]">INOS</div>
          <div className="flex items-center gap-3">
            <div className="text-[12.5px] text-[#6B7B7C]">{user?.name}</div>
            <button
              onClick={logout}
              className="text-[12px] text-[#6B7B7C] inline-flex items-center gap-1"
            >
              <LogOut size={12} /> Logout
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-[1100px] mx-auto p-6">
        <h1
          className="text-[36px] font-bold text-[#333333]"
          style={{
            fontFamily:
              "'Lato', 'Helvetica Neue', Helvetica, Arial, sans-serif",
          }}
        >
          Welcome, {data.user.name}
        </h1>
        <p className="text-[13px] text-[#6B7B7C] mt-1">
          Your INOS projects and pending approvals.
        </p>

        {data.projects.length > 0 && (
          <div className="mt-6">
            <div className="text-[12px] font-bold uppercase tracking-wider text-[#B5C4B6] mb-2">
              Your Projects
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {data.projects.map((p) => (
                <div
                  key={p.id}
                  className="bg-white/70 border border-[#B5C4B6] rounded-xl p-4"
                >
                  <div className="text-[15px] font-bold text-[#333333]">
                    {p.name}
                  </div>
                  <div className="text-[11.5px] text-[#6B7B7C] mt-1">
                    {p.location} · {p.project_type}
                  </div>
                  <div className="text-[11.5px] text-[#333333] mt-1">
                    Phase: {(p.phase || "—").replace(/_/g, " ")} · Progress:{" "}
                    {p.progress || 0}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.magic_links.length > 0 && (
          <div className="mt-8">
            <div className="text-[12px] font-bold uppercase tracking-wider text-[#B5C4B6] mb-2">
              Pending Actions & Views
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {data.magic_links.map((l) => (
                <a
                  key={l.id}
                  href={`/client/${l.token}`}
                  className="bg-white border border-[#B5C4B6] hover:border-[#1F453B] rounded-xl p-4 flex justify-between items-center"
                  data-testid={`client-link-${l.id}`}
                >
                  <div>
                    <div className="text-[13px] font-bold text-[#333333] capitalize">
                      {l.purpose.replace(/_/g, " ")}
                    </div>
                    <div className="text-[11.5px] text-[#6B7B7C]">
                      {l.project_name} · Expires {relativeTime(l.expires_at)}
                    </div>
                  </div>
                  <div className="text-[#333333] font-semibold">Open →</div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
