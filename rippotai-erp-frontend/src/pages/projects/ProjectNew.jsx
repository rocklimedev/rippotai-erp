import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Plus, X } from "lucide-react";

export default function ProjectNew() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "",
    client_name: "",
    project_type: "",
    location: "",
    priority: "Medium",
    expected_completion: "",
  });
  const [types, setTypes] = useState([]);
  const [busy, setBusy] = useState(false);
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");

  const loadTypes = () =>
    api
      .get("/project-types")
      .then((r) => {
        setTypes(r.data);
        if (!form.project_type && r.data.length)
          setForm((f) => ({ ...f, project_type: r.data[0].name }));
      })
      .catch(() => setTypes([]));
  useEffect(() => {
    loadTypes(); /* eslint-disable-next-line */
  }, []);

  const saveNewType = async () => {
    if (!newTypeName.trim()) {
      toast.error("Name required");
      return;
    }
    try {
      const { data } = await api.post("/project-types", {
        name: newTypeName.trim(),
      });
      toast.success(`Project type "${data.name}" added`);
      setShowAddType(false);
      setNewTypeName("");
      await loadTypes();
      setForm((f) => ({ ...f, project_type: data.name }));
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to add project type");
    }
  };

  const create = async () => {
    if (!form.name.trim()) return toast.error("Name required");
    setBusy(true);
    try {
      const { data } = await api.post("/projects", form);
      toast.success("Project created");
      nav(`/projects/${data.id}`);
    } catch {
      toast.error("Failed");
    }
    setBusy(false);
  };

  return (
    <div className="max-w-[900px] mx-auto p-6">
      <button
        onClick={() => nav("/projects")}
        className="text-[13px] text-[#6B7B7C] inline-flex items-center gap-1 mb-3"
      >
        <ArrowLeft size={14} /> Projects
      </button>
      <h1 className="text-[36px] font-bold text-[#333333]">Create Project</h1>
      <p className="text-[13px] text-[#6B7B7C] mt-1">
        Set up a new project — the phase tracker is populated automatically as
        documents are finalized.
      </p>

      <div className="bg-white border border-[#B5C4B6] rounded-xl p-6 mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-[12px] font-semibold text-[#6B7B7C]">
            Project Name *
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
            data-testid="new-name"
          />
        </div>
        <div>
          <label className="text-[12px] font-semibold text-[#6B7B7C]">
            Client Name
          </label>
          <input
            value={form.client_name}
            onChange={(e) => setForm({ ...form, client_name: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
          />
        </div>
        <div>
          <label className="text-[12px] font-semibold text-[#6B7B7C]">
            Project Type
          </label>
          <div className="flex items-center gap-2 mt-1">
            <select
              value={form.project_type}
              onChange={(e) =>
                setForm({ ...form, project_type: e.target.value })
              }
              className="flex-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
              data-testid="project-type-select"
            >
              {types.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowAddType(true)}
              className="w-9 h-9 rounded-lg border border-[#1F453B] text-[#333333] flex items-center justify-center hover:bg-[#EAEEF0]"
              title="Add new project type"
              data-testid="add-project-type-btn"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>
        <div>
          <label className="text-[12px] font-semibold text-[#6B7B7C]">
            Location
          </label>
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
          />
        </div>
        <div>
          <label className="text-[12px] font-semibold text-[#6B7B7C]">
            Priority
          </label>
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
          >
            {["Low", "Medium", "High", "Critical"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[12px] font-semibold text-[#6B7B7C]">
            Expected Completion
          </label>
          <input
            type="date"
            value={form.expected_completion}
            onChange={(e) =>
              setForm({ ...form, expected_completion: e.target.value })
            }
            className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={() => nav("/projects")}
          className="px-4 py-2 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={create}
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold"
          data-testid="btn-create-project-confirm"
        >
          Create Project
        </button>
      </div>

      {showAddType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowAddType(false)}
        >
          <div
            className="bg-white rounded-2xl w-[420px] p-6 relative"
            onClick={(e) => e.stopPropagation()}
            data-testid="add-type-modal"
          >
            <button
              className="absolute top-4 right-4 text-[#6B7B7C]"
              onClick={() => setShowAddType(false)}
            >
              <X size={18} />
            </button>
            <div className="text-[18px] font-semibold text-[#333333] mb-1">
              New Project Type
            </div>
            <div className="text-[12.5px] text-[#6B7B7C] mb-4">
              Add a project type on the fly. It becomes available for all future
              projects.
            </div>
            <input
              autoFocus
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="e.g. Boutique Retail"
              className="w-full h-10 px-3 rounded-lg border border-[#B5C4B6] bg-[#EAEEF0] text-[13.5px]"
              data-testid="new-type-name"
              onKeyDown={(e) => e.key === "Enter" && saveNewType()}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowAddType(false)}
                className="h-10 px-4 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold text-[#333333]"
              >
                Cancel
              </button>
              <button
                onClick={saveNewType}
                className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold"
                data-testid="new-type-save"
              >
                Add Type
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
