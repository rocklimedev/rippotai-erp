import { Fragment, useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useGetProjectsQuery } from "../../api/projects/project.api";
import {
  useGetProjectQualityChecksQuery,
  useUpsertQualityCheckMutation,
  useGetQualityChecklistTemplatesQuery,
  useGetQualityChecklistTemplateQuery,
  useCreateQualityChecklistFromTemplateMutation,
  useCreateQualityChecklistMutation,
  useGetQualityChecklistsByProjectQuery,
  useGetQualityChecklistByIdQuery,
  useUpdateQualityChecklistItemMutation,
  useAddQualityChecklistItemMutation,
  useCompleteQualityChecklistMutation,
  useDeleteQualityChecklistMutation,
  useLazyExportQualityChecklistJsonQuery,
  useLazyExportProjectQualityWorkbookJsonQuery,
} from "../../api/site-ops/site-ops.api";

const PHASES = [
  ["BEFORE_EXECUTION", "Before Execution"],
  ["DURING_EXECUTION", "During Execution"],
  ["AFTER_EXECUTION", "After Execution"],
];
const STATUSES = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  DEFERRED: "Deferred",
};
const OVERVIEW_STATUSES = ["Pending", "Passed", "Failed", "N/A"];

const message = (error) =>
  String(error?.data?.message || error?.error || "Request failed");
const array = (response) =>
  Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : response?.data?.data || [];

/** Map API status (PASSED, Failed, etc.) to the option labels used in the UI */
function normalizeOverviewStatus(status) {
  if (status == null || status === "") return "Pending";
  const key = String(status).trim().toUpperCase().replace(/\s+/g, " ");
  if (key === "N/A" || key === "NA" || key === "NOT APPLICABLE") return "N/A";
  if (key === "PASSED" || key === "PASS") return "Passed";
  if (key === "FAILED" || key === "FAIL") return "Failed";
  if (key === "PENDING") return "Pending";
  if (OVERVIEW_STATUSES.includes(status)) return status;
  return "Pending";
}

function dateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function QualityChecksPage() {
  const [params, setParams] = useSearchParams();
  const projectId = params.get("projectId") || "";
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useGetProjectsQuery({ includeArchived: false });
  const projects = array(response);
  const project = projects.find((project) => project.id === projectId);
  return (
    <div className="bg-page min-h-full p-4 sm:p-6 space-y-5">
      <Link
        className="bc-btn-secondary inline-flex"
        to="/site-operations/checklists"
      >
        ← Checklists list
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Site operations</p>
          <h1 className="text-2xl font-semibold text-[var(--ink-green)]">
            Quality checklist workspace
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Project work heads and checks before, during, and after execution.
          </p>
        </div>
        <div className="w-full sm:w-80">
          <label htmlFor="quality-project" className="block text-sm mb-1">
            Project
          </label>
          <select
            id="quality-project"
            className="bc-input w-full"
            value={projectId}
            disabled={isLoading}
            onChange={(event) => {
              const next = new URLSearchParams(params);
              next.delete("checklistId");
              if (event.target.value) next.set("projectId", event.target.value);
              else next.delete("projectId");
              setParams(next);
            }}
          >
            <option value="">
              {isLoading ? "Loading projects…" : "Select a project"}
            </option>
            {projectId && !project && (
              <option value={projectId}>{projectId}</option>
            )}
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name || project.project_name}
              </option>
            ))}
          </select>
          {error && (
            <button className="text-sm text-red-600" onClick={refetch}>
              Could not load projects. Retry
            </button>
          )}
        </div>
      </div>
      {projectId ? (
        <QualityProject
          key={projectId}
          projectId={projectId}
          projectName={project?.name || projectId}
          initialId={params.get("checklistId")}
        />
      ) : (
        <div className="bc-card p-10 text-center text-[var(--muted)]">
          Select a project to create and inspect its quality checklists.
        </div>
      )}
    </div>
  );
}

function QualityProject({ projectId, projectName, initialId }) {
  const [activeId, setActiveId] = useState(initialId || "");
  useEffect(() => {
    setActiveId(initialId || "");
  }, [initialId]);
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);
  const {
    currentData: overview = [],
    isLoading: overviewLoading,
    error: overviewError,
    refetch: refreshOverview,
  } = useGetProjectQualityChecksQuery({ project_id: projectId });
  const { data: templates = [], error: templateError } =
    useGetQualityChecklistTemplatesQuery();
  const {
    currentData: list,
    isFetching,
    error,
    refetch,
  } = useGetQualityChecklistsByProjectQuery({ projectId, page, limit: 12 });
  const [exportJson, { isFetching: exporting }] =
    useLazyExportProjectQualityWorkbookJsonQuery();
  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2 className="text-lg font-semibold">{projectName}</h2>
        <div className="flex gap-2">
          <button
            className="bc-btn-secondary"
            disabled={exporting}
            onClick={async () => {
              try {
                const data = await exportJson(projectId, false).unwrap();
                const { downloadQualityWorkbook } =
                  await import("./qualityChecklistExcel");
                await downloadQualityWorkbook(
                  data,
                  `Quality checks - ${projectName}`,
                );
              } catch (error) {
                toast.error(message(error));
              }
            }}
          >
            {exporting ? "Preparing Excel…" : "Download project Excel"}
          </button>
          <button
            className="bc-btn-primary"
            onClick={() => setShowCreate(true)}
          >
            New checklist
          </button>
        </div>
      </div>
      {showCreate && (
        <CreateChecklist
          projectId={projectId}
          templates={templates}
          templateError={templateError}
          onClose={() => setShowCreate(false)}
          onCreated={(id) => {
            setActiveId(id);
            setShowCreate(false);
          }}
        />
      )}
      {activeId ? (
        <ChecklistDetail
          key={activeId}
          id={activeId}
          projectId={projectId}
          onBack={() => setActiveId("")}
        />
      ) : (
        <>
          <OverviewTable
            overview={overview}
            overviewLoading={overviewLoading}
            overviewError={overviewError}
            refreshOverview={refreshOverview}
            projectId={projectId}
          />
          <section className="space-y-3">
            <h2 className="font-semibold">Project checklists</h2>
            {error ? (
              <button className="bc-btn-secondary" onClick={refetch}>
                Could not load checklists. Retry
              </button>
            ) : isFetching ? (
              <p>Loading checklists…</p>
            ) : !list?.data?.length ? (
              <div className="bc-card p-6">
                No checklists yet. Create one from a work-head template.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {list.data.map((checklist) => (
                  <button
                    className="bc-card p-4 text-left hover:shadow-md"
                    key={checklist.id}
                    onClick={() => setActiveId(checklist.id)}
                  >
                    <h3 className="font-semibold">
                      {checklist.checklist_name}
                    </h3>
                    <p className="text-sm text-[var(--muted)] mt-1">
                      {checklist.checklist_items?.length || 0} checkpoints ·{" "}
                      {checklist.status.replaceAll("_", " ")} ·{" "}
                      {Number(checklist.completion_percentage)}% inspected
                    </p>
                    {checklist.description && (
                      <p className="text-sm mt-2">{checklist.description}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
            {list?.totalPages > 1 && (
              <div className="flex items-center gap-3">
                <button
                  className="bc-btn-secondary"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {page} of {list.totalPages}
                </span>
                <button
                  className="bc-btn-secondary"
                  disabled={page >= list.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}

function OverviewTable({
  overview,
  overviewLoading,
  overviewError,
  refreshOverview,
  projectId,
}) {
  const heads = useMemo(
    () =>
      overview
        .filter((head) => head.work_head)
        .sort((a, b) => a.template_serial_number - b.template_serial_number),
    [overview],
  );

  const [drafts, setDrafts] = useState({});
  const [save, { isLoading }] = useUpsertQualityCheckMutation();

  useEffect(() => {
    const next = {};
    for (const head of heads) {
      next[head.item_id] = {
        status: normalizeOverviewStatus(head.status),
        remarks: head.remarks ?? "",
      };
    }
    setDrafts(next);
  }, [heads]);

  const dirtyIds = useMemo(() => {
    return heads
      .filter((head) => {
        const d = drafts[head.item_id];
        if (!d) return false;
        const serverStatus = normalizeOverviewStatus(head.status);
        const serverRemarks = head.remarks ?? "";
        return d.status !== serverStatus || d.remarks !== serverRemarks;
      })
      .map((head) => head.item_id);
  }, [heads, drafts]);

  const updateDraft = (itemId, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  };

  const saveAll = async () => {
    if (!dirtyIds.length) return;
    try {
      await Promise.all(
        dirtyIds.map((itemId) =>
          save({
            project_id: projectId,
            item_id: itemId,
            status: drafts[itemId].status,
            remarks: drafts[itemId].remarks,
          }).unwrap(),
        ),
      );
      toast.success(
        dirtyIds.length === 1
          ? "Work-head result saved"
          : `${dirtyIds.length} work-head results saved`,
      );
      await refreshOverview();
    } catch (error) {
      toast.error(message(error));
    }
  };

  return (
    <section className="bc-card overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Work-head overview</h2>
        <p className="text-sm text-[var(--muted)]">
          Record each work head’s overall status and remarks.
        </p>
      </div>
      {overviewLoading ? (
        <p className="p-4">Loading work heads…</p>
      ) : overviewError ? (
        <button className="bc-btn-secondary m-4" onClick={refreshOverview}>
          Could not load work heads. Retry
        </button>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="bc-table">
              <thead>
                <tr>
                  <th className="p-3">S. no.</th>
                  <th className="p-3">Heads</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {heads.map((head) => {
                  const draft = drafts[head.item_id] || {
                    status: normalizeOverviewStatus(head.status),
                    remarks: head.remarks ?? "",
                  };
                  return (
                    <tr key={head.item_id} className="border-t">
                      <td className="p-3">{head.template_serial_number}</td>
                      <td className="p-3 font-medium">{head.name}</td>
                      <td className="p-3">
                        <select
                          aria-label={`Status for ${head.name}`}
                          className="bc-input"
                          value={draft.status}
                          onChange={(event) =>
                            updateDraft(
                              head.item_id,
                              "status",
                              event.target.value,
                            )
                          }
                        >
                          {OVERVIEW_STATUSES.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <textarea
                          aria-label={`Remarks for ${head.name}`}
                          className="bc-input w-full min-w-48"
                          rows={2}
                          value={draft.remarks}
                          onChange={(event) =>
                            updateDraft(
                              head.item_id,
                              "remarks",
                              event.target.value,
                            )
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!heads.length && (
              <p className="p-4 text-[var(--muted)]">
                Template work heads are not available. Apply the quality
                template migration.
              </p>
            )}
          </div>
          {heads.length > 0 && (
            <div className="p-4 border-t flex justify-end">
              <button
                className="bc-btn-primary"
                disabled={isLoading || dirtyIds.length === 0}
                onClick={saveAll}
              >
                {isLoading
                  ? "Saving…"
                  : dirtyIds.length
                    ? `Save all (${dirtyIds.length})`
                    : "Save all"}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function CreateChecklist({
  projectId,
  templates,
  templateError,
  onClose,
  onCreated,
}) {
  const [workHead, setWorkHead] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [createTemplate, templateState] =
    useCreateQualityChecklistFromTemplateMutation();
  const [createCustom, customState] = useCreateQualityChecklistMutation();
  const selected = templates.find(
    (template) => template.work_head === workHead,
  );
  const { currentData: preview, isFetching } =
    useGetQualityChecklistTemplateQuery(workHead, {
      skip: !selected?.has_template,
    });
  const busy = templateState.isLoading || customState.isLoading;
  return (
    <section className="bc-card p-4 space-y-3">
      <div className="flex justify-between">
        <h2 className="font-semibold">Create project checklist</h2>
        <button className="bc-btn-secondary" disabled={busy} onClick={onClose}>
          Cancel
        </button>
      </div>
      {templateError && (
        <p role="alert" className="text-red-600">
          Could not load templates. Check that the template migration has been
          applied.
        </p>
      )}
      <form
        className="space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            const body = { project_id: projectId, description };
            const checklist = selected?.has_template
              ? await createTemplate({ ...body, work_head: workHead }).unwrap()
              : await createCustom({
                  ...body,
                  ...(workHead ? { work_head: workHead } : {}),
                  checklist_name: name.trim() || selected?.label,
                }).unwrap();
            toast.success("Checklist created");
            onCreated(checklist.id);
          } catch (error) {
            toast.error(message(error));
          }
        }}
      >
        <label className="block text-sm">
          Work head
          <select
            className="bc-input w-full mt-1"
            value={workHead}
            onChange={(event) => setWorkHead(event.target.value)}
            disabled={busy}
          >
            <option value="">Custom checklist</option>
            {templates.map((template) => (
              <option key={template.work_head} value={template.work_head}>
                {template.label} ({template.checkpoint_count} checkpoints)
              </option>
            ))}
          </select>
        </label>
        {!selected?.has_template && (
          <>
            <p className="text-sm text-[var(--muted)]">
              {selected
                ? "The supplied workbook has no detailed sheet for this head. Add your own checkpoints after creating it."
                : "Add project-specific checkpoints after creating this checklist."}
            </p>
            <label className="block text-sm">
              Checklist name
              <input
                className="bc-input mt-1 w-full"
                maxLength={255}
                value={name}
                placeholder={selected?.label || "Checklist name"}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
          </>
        )}
        <label className="block text-sm">
          Description / location
          <textarea
            className="bc-input w-full mt-1"
            rows={2}
            maxLength={2000}
            value={description}
            placeholder="e.g. First-floor bathroom"
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        {isFetching && <p>Loading template preview…</p>}
        {preview && (
          <details>
            <summary className="cursor-pointer text-sm">
              Preview {preview.checkpoint_count} checkpoints
            </summary>
            <ol className="mt-2 space-y-1 text-sm max-h-64 overflow-auto">
              {preview.checkpoints.map((item) => (
                <li key={`${item.phase}:${item.serial_number}`}>
                  {item.serial_number}. {item.checkpoint_name}
                </li>
              ))}
            </ol>
          </details>
        )}
        <button
          className="bc-btn-primary"
          disabled={busy || (!selected && !name.trim())}
        >
          {busy
            ? "Creating…"
            : selected?.has_template
              ? "Create from template"
              : "Create checklist"}
        </button>
      </form>
    </section>
  );
}

function ChecklistDetail({ id, projectId, onBack }) {
  const {
    currentData: checklist,
    isLoading,
    error,
    refetch,
  } = useGetQualityChecklistByIdQuery(id);
  const [complete, completeState] = useCompleteQualityChecklistMutation();
  const [remove, removeState] = useDeleteQualityChecklistMutation();
  const [exportJson, exportState] = useLazyExportQualityChecklistJsonQuery();
  const [showAdd, setShowAdd] = useState(false);
  const [updateItem, updateState] = useUpdateQualityChecklistItemMutation();

  const items = checklist?.checklist_items || [];

  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    if (!checklist) return;
    const next = {};
    for (const item of checklist.checklist_items || []) {
      const initialAcceptance =
        item.is_accepted === true
          ? "yes"
          : item.is_accepted === false
            ? "no"
            : "";
      next[item.id] = {
        accepted: initialAcceptance,
        status: item.status,
        remarks: item.remarks || "",
        date: dateInput(item.inspection_date),
      };
    }
    setDrafts(next);
  }, [checklist]);

  const dirtyIds = useMemo(() => {
    return items
      .filter((item) => {
        const d = drafts[item.id];
        if (!d) return false;
        const initialAcceptance =
          item.is_accepted === true
            ? "yes"
            : item.is_accepted === false
              ? "no"
              : "";
        return (
          d.accepted !== initialAcceptance ||
          d.status !== item.status ||
          d.remarks !== (item.remarks || "") ||
          d.date !== dateInput(item.inspection_date)
        );
      })
      .map((item) => item.id);
  }, [items, drafts]);

  const updateDraft = (itemId, patch) => {
    setDrafts((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], ...patch },
    }));
  };

  const saveAll = async () => {
    if (!dirtyIds.length) return;
    try {
      await Promise.all(
        dirtyIds.map((itemId) => {
          const d = drafts[itemId];
          return updateItem({
            id: itemId,
            status: d.status,
            is_accepted:
              d.accepted === "yes" ? true : d.accepted === "no" ? false : null,
            remarks: d.remarks,
            inspection_date: d.date
              ? new Date(`${d.date}T00:00:00`).toISOString()
              : null,
          }).unwrap();
        }),
      );
      toast.success(
        dirtyIds.length === 1
          ? "Checkpoint saved"
          : `${dirtyIds.length} checkpoints saved`,
      );
      await refetch();
    } catch (error) {
      toast.error(message(error));
    }
  };

  if (isLoading) return <p>Loading checklist…</p>;
  if (error || !checklist)
    return (
      <div className="bc-card p-5">
        <button className="bc-btn-secondary" onClick={onBack}>
          Back
        </button>
        <button className="bc-btn-secondary" onClick={refetch}>
          Could not load checklist. Retry
        </button>
      </div>
    );
  if (checklist.project_id !== projectId)
    return (
      <div role="alert">
        This checklist belongs to a different project.{" "}
        <button onClick={onBack}>Back to project</button>
      </div>
    );

  const accepted = items.filter((item) => item.is_accepted === true).length;
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <button className="text-sm underline" onClick={onBack}>
            ← Project checklists
          </button>
          <h2 className="text-xl font-semibold mt-2">
            {checklist.checklist_name}
          </h2>
          <p className="text-sm text-[var(--muted)]">{checklist.description}</p>
          <p className="text-sm mt-1">
            {items.length} checkpoints · {accepted} accepted ·{" "}
            {Number(checklist.completion_percentage)}% inspected ·{" "}
            {checklist.status.replaceAll("_", " ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-start">
          <button
            className="bc-btn-secondary"
            onClick={() => setShowAdd(!showAdd)}
          >
            Add checkpoint
          </button>
          <button
            className="bc-btn-secondary"
            disabled={exportState.isFetching}
            onClick={async () => {
              try {
                const data = await exportJson(id, false).unwrap();
                const { downloadQualityWorkbook } =
                  await import("./qualityChecklistExcel");
                await downloadQualityWorkbook(data, checklist.checklist_name);
              } catch (error) {
                toast.error(message(error));
              }
            }}
          >
            {exportState.isFetching ? "Preparing Excel…" : "Download Excel"}
          </button>
          <button
            className="bc-btn-primary"
            disabled={
              !items.length ||
              accepted !== items.length ||
              completeState.isLoading ||
              checklist.status === "PASSED"
            }
            onClick={async () => {
              try {
                await complete(id).unwrap();
                toast.success("Checklist passed");
              } catch (error) {
                toast.error(message(error));
              }
            }}
          >
            Mark passed
          </button>
          <button
            className="bc-btn-secondary"
            disabled={removeState.isLoading}
            onClick={async () => {
              if (!window.confirm("Delete this project checklist?")) return;
              try {
                await remove(id).unwrap();
                onBack();
                toast.success("Checklist deleted");
              } catch (error) {
                toast.error(message(error));
              }
            }}
          >
            Delete
          </button>
        </div>
      </div>
      {showAdd && (
        <AddCheckpoint
          checklistId={id}
          nextSerial={
            Math.max(0, ...items.map((item) => item.serial_number)) + 1
          }
          onClose={() => setShowAdd(false)}
        />
      )}
      <div className="bc-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="bc-table">
            <thead>
              <tr>
                <th className="p-3">S. No.</th>
                <th className="p-3 min-w-80">Checkpoint</th>
                <th className="p-3">Accepted (yes/no)</th>
                <th className="p-3">Status</th>
                <th className="p-3">Remarks / Observation</th>
                <th className="p-3">Inspection date</th>
              </tr>
            </thead>
            <tbody>
              {PHASES.map(([phase, label]) => (
                <Fragment key={phase}>
                  <tr className="bg-[var(--mist-soft)]">
                    <th colSpan={6} className="p-3 text-left">
                      {label}
                    </th>
                  </tr>
                  {items
                    .filter((item) => item.phase === phase)
                    .sort((a, b) => a.serial_number - b.serial_number)
                    .map((item) => {
                      const draft = drafts[item.id] || {
                        accepted:
                          item.is_accepted === true
                            ? "yes"
                            : item.is_accepted === false
                              ? "no"
                              : "",
                        status: item.status,
                        remarks: item.remarks || "",
                        date: dateInput(item.inspection_date),
                      };
                      return (
                        <tr key={item.id} className="border-t">
                          <td className="p-3">{item.serial_number}</td>
                          <td className="p-3">{item.checkpoint_name}</td>
                          <td className="p-3">
                            <select
                              className="bc-input"
                              aria-label={`Acceptance for checkpoint ${item.serial_number}`}
                              value={draft.accepted}
                              onChange={(event) => {
                                const next = event.target.value;
                                updateDraft(item.id, {
                                  accepted: next,
                                  status:
                                    next === "yes"
                                      ? "ACCEPTED"
                                      : next === "no"
                                        ? "REJECTED"
                                        : "NOT_STARTED",
                                });
                              }}
                            >
                              <option value="">Pending</option>
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                          </td>
                          <td className="p-3">
                            <select
                              className="bc-input"
                              aria-label={`Status for checkpoint ${item.serial_number}`}
                              value={draft.status}
                              onChange={(event) => {
                                const next = event.target.value;
                                const patch = { status: next };
                                if (next !== "COMPLETED") {
                                  patch.accepted =
                                    next === "ACCEPTED"
                                      ? "yes"
                                      : next === "REJECTED"
                                        ? "no"
                                        : "";
                                }
                                updateDraft(item.id, patch);
                              }}
                            >
                              {Object.entries(STATUSES).map(
                                ([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ),
                              )}
                            </select>
                          </td>
                          <td className="p-3">
                            <textarea
                              className="bc-input w-full min-w-52"
                              aria-label={`Remarks for checkpoint ${item.serial_number}`}
                              rows={2}
                              maxLength={2000}
                              value={draft.remarks}
                              onChange={(event) =>
                                updateDraft(item.id, {
                                  remarks: event.target.value,
                                })
                              }
                            />
                          </td>
                          <td className="p-3">
                            <input
                              className="bc-input"
                              aria-label={`Inspection date for checkpoint ${item.serial_number}`}
                              type="date"
                              value={draft.date}
                              onChange={(event) =>
                                updateDraft(item.id, {
                                  date: event.target.value,
                                })
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  {!items.some((item) => item.phase === phase) && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-3 text-sm text-[var(--muted)]"
                      >
                        No checkpoints in this phase.
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {items.length > 0 && (
          <div className="p-4 border-t flex justify-end">
            <button
              className="bc-btn-primary"
              disabled={updateState.isLoading || dirtyIds.length === 0}
              onClick={saveAll}
            >
              {updateState.isLoading
                ? "Saving…"
                : dirtyIds.length
                  ? `Save all (${dirtyIds.length})`
                  : "Save all"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function AddCheckpoint({ checklistId, nextSerial, onClose }) {
  const [name, setName] = useState("");
  const [phase, setPhase] = useState("BEFORE_EXECUTION");
  const [add, { isLoading }] = useAddQualityChecklistItemMutation();
  return (
    <form
      className="bc-card p-4 flex flex-wrap gap-3 items-end"
      onSubmit={async (event) => {
        event.preventDefault();
        try {
          await add({
            checklistId,
            serial_number: nextSerial,
            checkpoint_name: name.trim(),
            phase,
          }).unwrap();
          onClose();
          toast.success("Checkpoint added");
        } catch (error) {
          toast.error(message(error));
        }
      }}
    >
      <label className="flex-1 text-sm">
        Checkpoint
        <input
          className="bc-input w-full mt-1"
          maxLength={255}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label className="text-sm">
        Phase
        <select
          className="bc-input mt-1"
          value={phase}
          onChange={(event) => setPhase(event.target.value)}
        >
          {PHASES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <button className="bc-btn-primary" disabled={isLoading || !name.trim()}>
        {isLoading ? "Adding…" : "Add"}
      </button>
      <button type="button" className="bc-btn-secondary" onClick={onClose}>
        Cancel
      </button>
    </form>
  );
}
