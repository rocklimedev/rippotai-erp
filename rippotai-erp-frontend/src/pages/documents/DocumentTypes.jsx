import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  FileText,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import {
  useGetDocumentTypesQuery,
  useCreateDocumentTypeMutation,
  useUpdateDocumentTypeMutation,
  useDeleteDocumentTypeMutation,
} from "../../api/documents/document.api";

const EMPTY_FORM = {
  name: "",
  code: "",
  description: "",
  phaseCode: "",
  projectPhaseId: "",
  targetType: "",
  isActive: true,
};

const DocumentTypes = () => {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const {
    data: documentTypes = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetDocumentTypesQuery({});

  const [createDocumentType, { isLoading: isCreating }] =
    useCreateDocumentTypeMutation();

  const [updateDocumentType, { isLoading: isUpdating }] =
    useUpdateDocumentTypeMutation();

  const [deleteDocumentType, { isLoading: isDeleting }] =
    useDeleteDocumentTypeMutation();

  const filteredDocumentTypes = useMemo(() => {
    if (!Array.isArray(documentTypes)) return [];

    const value = search.trim().toLowerCase();

    if (!value) return documentTypes;

    return documentTypes.filter((item) =>
      [item.name, item.code, item.description, item.phaseCode, item.targetType]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value)),
    );
  }, [documentTypes, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);

    setForm({
      name: item.name || "",
      code: item.code || "",
      description: item.description || "",
      phaseCode: item.phaseCode || "",
      projectPhaseId: item.projectPhaseId || "",
      targetType: item.targetType || "",
      isActive:
        item.isActive === undefined || item.isActive === null
          ? true
          : Boolean(item.isActive),
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (isCreating || isUpdating) return;

    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Document type name is required");
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        description: form.description.trim() || undefined,
        phaseCode: form.phaseCode.trim() || undefined,
        projectPhaseId: form.projectPhaseId || undefined,
        targetType: form.targetType.trim() || undefined,
        isActive: form.isActive,
      };

      if (editingId) {
        await updateDocumentType({
          id: editingId,
          data: payload,
        }).unwrap();

        toast.success("Document type updated successfully");
      } else {
        await createDocumentType(payload).unwrap();

        toast.success("Document type created successfully");
      }

      closeModal();
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Unable to save document type",
      );
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Delete document type "${item.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      await deleteDocumentType(item.id).unwrap();
      toast.success("Document type deleted successfully");
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Unable to delete document type",
      );
    }
  };

  return (
    <div className="min-h-full bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1F453B] text-white">
              <FileText size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Document Types
              </h1>

              <p className="text-sm text-slate-500">
                Manage document categories and document type configuration.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1F453B] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          <Plus size={17} />
          Add Document Type
        </button>
      </div>

      {/* Toolbar */}
      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search document types..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#1F453B] focus:bg-white"
            />
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Document Type
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Code
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Phase
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Target Type
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    Loading document types...
                  </td>
                </tr>
              ) : filteredDocumentTypes.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    No document types found.
                  </td>
                </tr>
              ) : (
                filteredDocumentTypes.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-900">
                        {item.name || "—"}
                      </div>

                      {item.description && (
                        <div className="mt-1 max-w-md truncate text-xs text-slate-500">
                          {item.description}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
                        {item.code || "—"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {item.phaseCode || "—"}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {item.targetType || "—"}
                    </td>

                    <td className="px-5 py-4">
                      {item.isActive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          <CheckCircle2 size={14} />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                          <XCircle size={14} />
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 hover:text-[#1F453B]"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          disabled={isDeleting}
                          className="rounded-lg border border-red-100 p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {editingId ? "Edit Document Type" : "Create Document Type"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Configure the document type used across INOS.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-5 p-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Name <span className="text-red-500">*</span>
                  </label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Architectural Drawing"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#1F453B]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Code
                  </label>

                  <input
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    placeholder="e.g. ARCH_DRAWING"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#1F453B]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Phase Code
                  </label>

                  <input
                    name="phaseCode"
                    value={form.phaseCode}
                    onChange={handleChange}
                    placeholder="e.g. DESIGN"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#1F453B]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Project Phase ID
                  </label>

                  <input
                    name="projectPhaseId"
                    value={form.projectPhaseId}
                    onChange={handleChange}
                    placeholder="Project phase UUID"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#1F453B]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Target Type
                  </label>

                  <input
                    name="targetType"
                    value={form.targetType}
                    onChange={handleChange}
                    placeholder="e.g. PROJECT"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#1F453B]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Describe this document type..."
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#1F453B]"
                  />
                </div>

                <label className="md:col-span-2 flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 accent-[#1F453B]"
                  />

                  <div>
                    <div className="text-sm font-medium text-slate-700">
                      Active
                    </div>

                    <div className="text-xs text-slate-500">
                      Allow this document type to be used in the system.
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isCreating || isUpdating}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="rounded-lg bg-[#1F453B] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {isCreating || isUpdating
                    ? "Saving..."
                    : editingId
                      ? "Update Document Type"
                      : "Create Document Type"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentTypes;
