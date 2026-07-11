// Client Portal — magic-link, no login.
import React, { useEffect, useState, useRef } from "react";
import {
  useParams,
  useNavigate,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { fmtINR, relativeTime } from "@/lib/format";

const API = `${import.meta.env.VITE_BACKEND_URL || ""}/api`;
// Public axios instance (no auth header)
const publicApi = axios.create({ baseURL: API });

function ClientShell({ children, project, purpose }) {
  return (
    <div
      className="min-h-screen bg-[#EAEEF0]"
      style={{
        fontFamily: "'Lato', 'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
    >
      <div className="border-b border-[#B5C4B6] bg-white/70 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1100px] mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-[#333333] font-bold text-[20px] tracking-tight">
              INOS
            </div>
            <div className="h-5 w-px bg-[#B5C4B6]" />
            <div className="text-[13px] text-[#6B7B7C]">
              {project?.name || "Client Portal"}
            </div>
          </div>
          {purpose && (
            <span className="text-[11px] font-semibold text-[#333333] bg-[#EAEEF0] px-2 py-1 rounded-full uppercase tracking-wider">
              {purpose.replace(/_/g, " ")}
            </span>
          )}
        </div>
      </div>
      <div className="max-w-[1100px] mx-auto p-6">{children}</div>
      <footer className="mt-16 py-6 border-t border-[#B5C4B6]">
        <div className="max-w-[1100px] mx-auto px-6 text-[11px] text-[#B5C4B6]">
          Powered by INOS ERP · This is a secure client portal. All actions
          taken here are logged.
        </div>
      </footer>
    </div>
  );
}

function ErrorScreen({ code, message }) {
  return (
    <div className="min-h-screen bg-[#EAEEF0] flex items-center justify-center p-6">
      <div className="bg-white rounded-xl p-8 max-w-md text-center border border-[#B5C4B6]">
        <div className="text-[64px] font-bold text-[#333333]">{code}</div>
        <div className="text-[15px] font-semibold text-[#333333] mt-2">
          {message}
        </div>
      </div>
    </div>
  );
}

function SignaturePad({ value, onChange }) {
  const ref = useRef(null);
  const drawing = useRef(false);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    ctx.strokeStyle = "#1F453B";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    const pos = (e) => {
      const rect = cv.getBoundingClientRect();
      const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left;
      const y = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top;
      return [x, y];
    };
    const start = (e) => {
      e.preventDefault();
      drawing.current = true;
      const [x, y] = pos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };
    const move = (e) => {
      if (!drawing.current) return;
      e.preventDefault();
      const [x, y] = pos(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    };
    const end = () => {
      if (!drawing.current) return;
      drawing.current = false;
      onChange(cv.toDataURL("image/png"));
    };
    cv.addEventListener("mousedown", start);
    cv.addEventListener("mousemove", move);
    cv.addEventListener("mouseup", end);
    cv.addEventListener("mouseleave", end);
    cv.addEventListener("touchstart", start);
    cv.addEventListener("touchmove", move);
    cv.addEventListener("touchend", end);
    return () => {
      cv.removeEventListener("mousedown", start);
      cv.removeEventListener("mousemove", move);
      cv.removeEventListener("mouseup", end);
      cv.removeEventListener("mouseleave", end);
      cv.removeEventListener("touchstart", start);
      cv.removeEventListener("touchmove", move);
      cv.removeEventListener("touchend", end);
    };
  }, [onChange]);
  const clear = () => {
    const cv = ref.current;
    cv.getContext("2d").clearRect(0, 0, cv.width, cv.height);
    onChange(null);
  };
  return (
    <div>
      <canvas
        ref={ref}
        width={400}
        height={140}
        className="border border-[#B5C4B6] rounded-lg bg-white cursor-crosshair"
        data-testid="signature-pad"
      />
      <button onClick={clear} className="text-[11.5px] text-[#6B7B7C] mt-1">
        Clear signature
      </button>
    </div>
  );
}

// ===== Landing =====
export default function ClientPortalRoutes() {
  return (
    <Routes>
      <Route path="/:token" element={<ClientLanding />} />
      <Route path="/:token/boq/:boqId" element={<ClientBoq />} />
      <Route
        path="/:token/quotations/compare/:cid"
        element={<ClientCompare />}
      />
      <Route path="/:token/handover" element={<ClientHandover />} />
    </Routes>
  );
}

function ClientLanding() {
  const { token } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    publicApi
      .get(`/public/client/${token}`)
      .then((r) => setData(r.data))
      .catch((e) => setErr(e?.response));
  }, [token]);
  if (err)
    return (
      <ErrorScreen
        code={err.status || "!"}
        message={err.data?.detail || "Link invalid"}
      />
    );
  if (!data)
    return (
      <div className="min-h-screen bg-[#EAEEF0] flex items-center justify-center text-[#6B7B7C]">
        Loading…
      </div>
    );
  const p = data.project;
  const purpose = data.link.purpose;

  return (
    <ClientShell project={p} purpose={purpose}>
      <div className="text-[13px] text-[#6B7B7C] mb-1">
        Welcome,{" "}
        <span className="font-semibold text-[#333333]">
          {data.link.client_name}
        </span>
      </div>
      <h1
        className="text-[36px] font-bold text-[#333333] mb-2"
        style={{
          fontFamily: "'Lato', 'Helvetica Neue', Helvetica, Arial, sans-serif",
          letterSpacing: "-0.01em",
        }}
        data-testid="client-project-name"
      >
        {p.name}
      </h1>
      <p className="text-[14px] text-[#6B7B7C]">
        {p.location || ""} · {p.project_type}
      </p>

      {/* Phase timeline */}
      <div className="mt-8 bg-white/70 backdrop-blur-sm rounded-xl p-5 border border-[#B5C4B6]">
        <div className="text-[13px] font-bold uppercase tracking-wider text-[#B5C4B6] mb-3">
          Project Phases
        </div>
        <div className="flex gap-2">
          {data.phases.slice(0, 6).map((ph) => (
            <div key={ph.phase_code} className="flex-1">
              <div
                className="h-2 rounded-full"
                style={{
                  background:
                    ph.status === "completed"
                      ? "#1F453B"
                      : ph.status === "in_progress"
                        ? "#1F453B"
                        : "#B5C4B6",
                }}
              />
              <div className="text-[11px] mt-2 text-[#6B7B7C]">{ph.name}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-[13px] text-[#6B7B7C]">
          Overall progress: <b className="text-[#333333]">{p.progress || 0}%</b>
        </div>
      </div>

      {/* Upcoming milestones */}
      {data.upcoming_milestones?.length > 0 && (
        <div className="mt-6 bg-white/70 rounded-xl p-5 border border-[#B5C4B6]">
          <div className="text-[13px] font-bold uppercase tracking-wider text-[#B5C4B6] mb-3">
            Upcoming Milestones
          </div>
          {data.upcoming_milestones.map((m, i) => (
            <div
              key={i}
              className="flex justify-between py-2 border-b border-[#EAEEF0] last:border-0"
            >
              <div className="text-[13.5px] font-semibold text-[#333333]">
                {m.name}
              </div>
              <div className="text-[12.5px] text-[#333333] font-semibold">
                {m.planned_end}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Documents */}
      {data.documents?.length > 0 && (
        <div className="mt-6 bg-white/70 rounded-xl p-5 border border-[#B5C4B6]">
          <div className="text-[13px] font-bold uppercase tracking-wider text-[#B5C4B6] mb-3">
            Shared Documents
          </div>
          {data.documents.map((d) => (
            <div
              key={d.id}
              className="py-2 border-b border-[#EAEEF0] last:border-0"
            >
              <div className="text-[13.5px] font-semibold text-[#333333]">
                {d.name}
              </div>
              <div className="text-[11.5px] text-[#B5C4B6]">
                {d.category} · {relativeTime(d.uploaded_at)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA based on purpose */}
      {purpose === "boq_approval" && data.link.target_id && (
        <button
          onClick={() => nav(`/client/${token}/boq/${data.link.target_id}`)}
          className="mt-8 px-6 py-3 bg-[#1F453B] text-white rounded-lg font-semibold text-[14px]"
          data-testid="cta-review-boq"
        >
          Review Bill of Quantities →
        </button>
      )}
      {purpose === "quotation_selection" && data.link.target_id && (
        <button
          onClick={() =>
            nav(`/client/${token}/quotations/compare/${data.link.target_id}`)
          }
          className="mt-8 px-6 py-3 bg-[#1F453B] text-white rounded-lg font-semibold text-[14px]"
          data-testid="cta-select-vendor"
        >
          Select Vendor →
        </button>
      )}
      {purpose === "handover_acceptance" && (
        <button
          onClick={() => nav(`/client/${token}/handover`)}
          className="mt-8 px-6 py-3 bg-[#1F453B] text-white rounded-lg font-semibold text-[14px]"
          data-testid="cta-handover"
        >
          Review Handover Package →
        </button>
      )}
    </ClientShell>
  );
}

function ClientBoq() {
  const { token, boqId } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [comments, setComments] = useState("");
  const [sig, setSig] = useState(null);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    publicApi
      .get(`/public/client/${token}/boq/${boqId}`)
      .then((r) => setData(r.data))
      .catch((e) => setErr(e?.response));
    publicApi
      .get(`/public/client/${token}`)
      .then((r) => {
        setName(r.data.link.client_name);
        setEmail(r.data.link.client_email || "");
      })
      .catch(() => {});
  }, [token, boqId]);

  const submit = async (approved) => {
    if (approved && !agree)
      return toast.error("Please confirm you approve this BOQ");
    if (!name.trim()) return toast.error("Signatory name required");
    setBusy(true);
    try {
      const { data: r } = await publicApi.post(
        `/public/client/${token}/boq/${boqId}/approve`,
        {
          signatory_name: name,
          signatory_email: email,
          comments,
          signature_png: sig,
          approved,
          request_changes: !approved,
        },
      );
      setDone({ approved, id: r.id });
      toast.success(approved ? "BOQ approved" : "Change request logged");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed");
    }
    setBusy(false);
  };

  if (err)
    return (
      <ErrorScreen
        code={err.status || "!"}
        message={err.data?.detail || "Link invalid"}
      />
    );
  if (!data)
    return (
      <div className="min-h-screen bg-[#EAEEF0] flex items-center justify-center text-[#6B7B7C]">
        Loading BOQ…
      </div>
    );

  const total = (data.items || []).reduce(
    (s, it) => s + (Number(it.amount) || 0),
    0,
  );

  return (
    <ClientShell project={{ name: data.project_name }} purpose="boq_approval">
      <h1
        className="text-[36px] font-bold text-[#333333]"
        style={{
          fontFamily: "'Lato', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        }}
      >
        Bill of Quantities
      </h1>
      <p className="text-[13px] text-[#6B7B7C] mt-1">
        Version {data.version} · Status: {data.status}
      </p>

      <div className="mt-6 bg-white rounded-xl border border-[#B5C4B6] overflow-hidden">
        <table className="w-full text-[12.5px]">
          <thead className="bg-[#EAEEF0] text-[#6B7B7C]">
            <tr>
              <th className="text-left p-3">#</th>
              <th className="text-left p-3">Description</th>
              <th className="text-left p-3">Unit</th>
              <th className="text-right p-3">Qty</th>
              {data.items[0]?.rate != null && (
                <th className="text-right p-3">Rate</th>
              )}
              <th className="text-right p-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(data.items || []).map((it, i) => (
              <tr
                key={it.id}
                className="border-t border-[#EAEEF0]"
                data-testid={`client-boq-item-${i}`}
              >
                <td className="p-3 text-[#B5C4B6]">{i + 1}</td>
                <td className="p-3">{it.description}</td>
                <td className="p-3">{it.unit}</td>
                <td className="p-3 text-right">{it.quantity}</td>
                {it.rate != null && (
                  <td className="p-3 text-right">{fmtINR(it.rate)}</td>
                )}
                <td className="p-3 text-right font-semibold">
                  {fmtINR(it.amount || 0)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#EAEEF0]">
              <td
                colSpan={data.items[0]?.rate != null ? 5 : 4}
                className="p-3 text-right font-bold text-[#333333]"
              >
                TOTAL
              </td>
              <td className="p-3 text-right text-[16px] font-bold text-[#333333]">
                {fmtINR(data.total_amount || total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {done ? (
        <div className="mt-8 bg-[#EAEEF0] border border-[#1F453B]/20 rounded-xl p-6 text-center">
          <div className="text-[18px] font-bold text-[#333333]">
            ✓ {done.approved ? "Approved" : "Change Request Submitted"}
          </div>
          <div className="text-[13px] text-[#6B7B7C] mt-1">
            Reference: {done.id}
          </div>
        </div>
      ) : (
        <div className="mt-8 bg-white rounded-xl p-6 border border-[#B5C4B6]">
          <div className="text-[15px] font-bold text-[#333333] mb-3">
            Sign & Approve
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#6B7B7C]">
                Signatory Name *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px]"
                data-testid="approver-name"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#6B7B7C]">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[12px] font-semibold text-[#6B7B7C]">
                Comments (optional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={2}
                className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px]"
                data-testid="approver-comments"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[12px] font-semibold text-[#6B7B7C] block mb-1.5">
                Draw your signature
              </label>
              <SignaturePad value={sig} onChange={setSig} />
            </div>
            <label className="md:col-span-2 flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                data-testid="approve-checkbox"
              />{" "}
              I approve this Bill of Quantities as presented.
            </label>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => submit(true)}
              disabled={busy}
              className="px-5 py-2.5 bg-[#1F453B] text-white rounded-lg font-semibold text-[13px]"
              data-testid="btn-approve-boq"
            >
              Approve &amp; Sign
            </button>
            <button
              onClick={() => submit(false)}
              disabled={busy || !comments.trim()}
              className="px-4 py-2.5 border border-[#B5C4B6] text-[#6B7B7C] rounded-lg font-semibold text-[13px]"
              data-testid="btn-request-changes"
            >
              Request Changes
            </button>
          </div>
          <div className="text-[11px] text-[#B5C4B6] mt-2">
            Requesting changes requires you to add comments explaining what
            needs revision.
          </div>
        </div>
      )}
    </ClientShell>
  );
}

function ClientCompare() {
  const { token, cid } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [selectId, setSelectId] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [comments, setComments] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    publicApi
      .get(`/public/client/${token}/quotations/compare/${cid}`)
      .then((r) => {
        setData(r.data);
        setName(r.data.link.client_name || "");
      })
      .catch((e) => setErr(e?.response));
  }, [token, cid]);

  const submit = async () => {
    if (!selectId) return toast.error("Please select a vendor");
    if (!name.trim()) return toast.error("Signatory name required");
    setBusy(true);
    try {
      await publicApi.post(`/public/client/${token}/quotations/select`, {
        quotation_id: selectId,
        signatory_name: name,
        signatory_email: email,
        comments,
      });
      setDone(true);
      toast.success("Vendor selected");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed");
    }
    setBusy(false);
  };

  if (err)
    return (
      <ErrorScreen
        code={err.status || "!"}
        message={err.data?.detail || "Link invalid"}
      />
    );
  if (!data)
    return (
      <div className="min-h-screen bg-[#EAEEF0] flex items-center justify-center text-[#6B7B7C]">
        Loading…
      </div>
    );

  const lowestId = data.quotations.reduce(
    (a, b) => (a.final_total < b.final_total ? a : b),
    data.quotations[0],
  )?.id;

  return (
    <ClientShell
      project={{ name: data.comparison.project_name }}
      purpose="quotation_selection"
    >
      <h1
        className="text-[36px] font-bold text-[#333333]"
        style={{
          fontFamily: "'Lato', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        }}
      >
        {data.comparison.name}
      </h1>
      <p className="text-[13px] text-[#6B7B7C] mt-1">
        {data.comparison.work_category} · Compare and select your preferred
        vendor.
      </p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.quotations.map((q) => (
          <div
            key={q.id}
            className={`bg-white rounded-xl border-2 p-5 ${selectId === q.id ? "border-[#1F453B]" : "border-[#B5C4B6]"} ${q.id === lowestId ? "ring-2 ring-[#1F453B]/20" : ""}`}
            data-testid={`client-vendor-${q.id}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[14px] font-bold text-[#333333]">
                  {q.vendor_name}
                </div>
                {q.rating && (
                  <div className="text-[11.5px] text-[#333333] mt-0.5">
                    ★ {q.rating.toFixed(1)} · {q.completed_projects || 0}{" "}
                    projects · {q.on_time_pct || 0}% on-time
                  </div>
                )}
              </div>
              {q.id === lowestId && (
                <span className="text-[10px] font-bold bg-[#1F453B] text-white px-1.5 py-0.5 rounded uppercase">
                  Lowest
                </span>
              )}
            </div>
            <div className="text-[32px] font-bold text-[#333333] mt-3">
              {fmtINR(q.final_total)}
            </div>
            <div className="text-[11px] text-[#B5C4B6] mt-1">
              Final total (all inclusive)
            </div>
            <div className="mt-4 space-y-1.5 text-[12px]">
              <div className="flex justify-between">
                <span className="text-[#6B7B7C]">Warranty</span>
                <span className="font-semibold">
                  {q.warranty_months || 0} months
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7B7C]">Delivery</span>
                <span className="font-semibold">
                  {q.delivery_timeline_days || 0} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7B7C]">Completion</span>
                <span className="font-semibold">
                  {q.completion_timeline_days || 0} days
                </span>
              </div>
            </div>
            {q.exclusions?.length > 0 && (
              <div className="mt-3 text-[11px] text-[#B5C4B6]">
                Excludes: {q.exclusions.join(", ")}
              </div>
            )}
            <button
              onClick={() => setSelectId(q.id)}
              disabled={q.selected || done}
              className={`mt-4 w-full py-2 rounded-lg text-[13px] font-semibold ${selectId === q.id ? "bg-[#1F453B] text-white" : "border border-[#B5C4B6] text-[#6B7B7C]"}`}
              data-testid={`btn-select-${q.id}`}
            >
              {q.selected
                ? "✓ Selected"
                : selectId === q.id
                  ? "Selected"
                  : "Select This Vendor"}
            </button>
          </div>
        ))}
      </div>

      {done ? (
        <div className="mt-8 bg-[#EAEEF0] border border-[#1F453B]/20 rounded-xl p-6 text-center">
          <div className="text-[18px] font-bold text-[#333333]">
            ✓ Vendor Selection Confirmed
          </div>
          <div className="text-[13px] text-[#6B7B7C] mt-1">
            Thank you. Our team will proceed with the selected vendor.
          </div>
        </div>
      ) : (
        selectId && (
          <div className="mt-8 bg-white rounded-xl p-6 border border-[#B5C4B6]">
            <div className="text-[15px] font-bold text-[#333333] mb-3">
              Confirm Selection
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-semibold text-[#6B7B7C]">
                  Signatory Name *
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px]"
                  data-testid="select-name"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[#6B7B7C]">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[12px] font-semibold text-[#6B7B7C]">
                  Comments (optional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={2}
                  className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px]"
                />
              </div>
            </div>
            <button
              onClick={submit}
              disabled={busy}
              className="mt-4 px-6 py-2.5 bg-[#1F453B] text-white rounded-lg font-semibold text-[13px]"
              data-testid="btn-confirm-select"
            >
              Confirm Selection
            </button>
          </div>
        )
      )}
    </ClientShell>
  );
}

function ClientHandover() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [comments, setComments] = useState("");
  const [sig, setSig] = useState(null);
  const [snag, setSnag] = useState({
    title: "",
    description: "",
    location: "",
  });
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("accept");
  const [done, setDone] = useState(null);

  useEffect(() => {
    publicApi
      .get(`/public/client/${token}/handover`)
      .then((r) => {
        setData(r.data);
        setName(r.data.link.client_name || "");
      })
      .catch((e) => setErr(e?.response));
  }, [token]);

  const accept = async () => {
    if (!name.trim()) return toast.error("Signatory name required");
    setBusy(true);
    try {
      await publicApi.post(`/public/client/${token}/handover/accept`, {
        signatory_name: name,
        signatory_email: email,
        comments,
        signature_png: sig,
      });
      setDone("accepted");
      toast.success("Handover accepted");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed");
    }
    setBusy(false);
  };
  const report = async () => {
    if (!snag.title.trim()) return toast.error("Title required");
    setBusy(true);
    try {
      await publicApi.post(`/public/client/${token}/handover/snag`, {
        ...snag,
        signatory_name: name,
      });
      setDone("snag");
      toast.success("Snag reported");
    } catch {
      toast.error("Failed");
    }
    setBusy(false);
  };

  if (err)
    return (
      <ErrorScreen
        code={err.status || "!"}
        message={err.data?.detail || "Link invalid"}
      />
    );
  if (!data)
    return (
      <div className="min-h-screen bg-[#EAEEF0] flex items-center justify-center text-[#6B7B7C]">
        Loading…
      </div>
    );

  return (
    <ClientShell
      project={{ name: data.project.name }}
      purpose="handover_acceptance"
    >
      <h1
        className="text-[36px] font-bold text-[#333333]"
        style={{
          fontFamily: "'Lato', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        }}
      >
        Handover Acceptance
      </h1>
      <p className="text-[13px] text-[#6B7B7C] mt-1">
        Please review the handover package and confirm acceptance.
      </p>

      <div className="mt-6 bg-white rounded-xl p-5 border border-[#B5C4B6]">
        <div className="text-[13px] font-bold uppercase text-[#B5C4B6] mb-3">
          Handover Checklist
        </div>
        <div className="grid md:grid-cols-2 gap-2">
          {(data.checklist || []).map((c, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-[13px]"
              data-testid={`client-checklist-${i}`}
            >
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${c.done ? "bg-[#EAEEF0] text-[#333333]" : "bg-[#EAEEF0] text-[#B5C4B6]"}`}
              >
                {c.done ? "✓" : "○"}
              </div>
              <span className={c.done ? "text-[#333333]" : "text-[#B5C4B6]"}>
                {c.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {done ? (
        <div className="mt-6 bg-[#EAEEF0] border border-[#1F453B]/20 rounded-xl p-6 text-center">
          <div className="text-[18px] font-bold text-[#333333]">
            ✓ {done === "accepted" ? "Handover Accepted" : "Snag Reported"}
          </div>
          <div className="text-[13px] text-[#6B7B7C] mt-1">
            Thank you. Our team has been notified.
          </div>
        </div>
      ) : (
        <div className="mt-6 bg-white rounded-xl border border-[#B5C4B6] overflow-hidden">
          <div className="flex border-b border-[#EAEEF0]">
            <button
              onClick={() => setTab("accept")}
              className={`px-4 py-3 text-[13px] font-semibold ${tab === "accept" ? "text-[#333333] border-b-2 border-[#1F453B]" : "text-[#6B7B7C]"}`}
              data-testid="handover-accept-tab"
            >
              Accept Handover
            </button>
            <button
              onClick={() => setTab("snag")}
              className={`px-4 py-3 text-[13px] font-semibold ${tab === "snag" ? "text-[#333333] border-b-2 border-[#1F453B]" : "text-[#6B7B7C]"}`}
              data-testid="handover-snag-tab"
            >
              Report Concern
            </button>
          </div>
          <div className="p-5">
            {tab === "accept" ? (
              <>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] font-semibold text-[#6B7B7C]">
                      Signatory Name *
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px]"
                      data-testid="handover-name"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-[#6B7B7C]">
                      Email
                    </label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[12px] font-semibold text-[#6B7B7C]">
                      Comments (optional)
                    </label>
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      rows={2}
                      className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[12px] font-semibold text-[#6B7B7C] block mb-1.5">
                      Signature
                    </label>
                    <SignaturePad value={sig} onChange={setSig} />
                  </div>
                </div>
                <button
                  onClick={accept}
                  disabled={busy}
                  className="mt-4 px-6 py-2.5 bg-[#1F453B] text-white rounded-lg font-semibold text-[13px]"
                  data-testid="btn-accept-handover"
                >
                  Accept Handover
                </button>
              </>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="text-[12px] font-semibold text-[#6B7B7C]">
                      Concern Title *
                    </label>
                    <input
                      value={snag.title}
                      onChange={(e) =>
                        setSnag({ ...snag, title: e.target.value })
                      }
                      className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px]"
                      data-testid="snag-title"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-[#6B7B7C]">
                      Location / Area
                    </label>
                    <input
                      value={snag.location}
                      onChange={(e) =>
                        setSnag({ ...snag, location: e.target.value })
                      }
                      className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[12px] font-semibold text-[#6B7B7C]">
                      Description
                    </label>
                    <textarea
                      value={snag.description}
                      onChange={(e) =>
                        setSnag({ ...snag, description: e.target.value })
                      }
                      rows={3}
                      className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px]"
                    />
                  </div>
                </div>
                <button
                  onClick={report}
                  disabled={busy}
                  className="mt-4 px-6 py-2.5 bg-[#1F453B] text-white rounded-lg font-semibold text-[13px]"
                  data-testid="btn-report-snag"
                >
                  Report Concern
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </ClientShell>
  );
}
