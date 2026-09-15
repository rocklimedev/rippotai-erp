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

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
    const { name, value, type } = event.target;
    const checked = type === "checkbox" ? event.target.checked : undefined;

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
    <div className="min-h-full bg-muted/40 p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <FileText className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Document Types
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage document categories and document type configuration.
            </p>
          </div>
        </div>

        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Document Type
        </Button>
      </div>

      {/* Toolbar */}
      <Card className="mb-5">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search document types..."
                className="pl-10"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Type</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>Target Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Loading document types...
                  </TableCell>
                </TableRow>
              ) : filteredDocumentTypes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No document types found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocumentTypes.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {item.name || "—"}
                      </div>
                      {item.description && (
                        <div className="mt-1 max-w-md truncate text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        {item.code || "—"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {item.phaseCode || "—"}
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {item.targetType || "—"}
                    </TableCell>

                    <TableCell>
                      {item.isActive ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-200 bg-emerald-50 text-emerald-700"
                        >
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="mr-1 h-3.5 w-3.5" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEdit(item)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(item)}
                          disabled={isDeleting}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Modal */}
      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Document Type" : "Create Document Type"}
            </DialogTitle>
            <DialogDescription>
              Configure the document type used across INOS.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-5 py-4 md:grid-cols-2">
              <div className="md:col-span-2 space-y-2">
                <Label>
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Architectural Drawing"
                />
              </div>

              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="e.g. ARCH_DRAWING"
                />
              </div>

              <div className="space-y-2">
                <Label>Phase Code</Label>
                <Input
                  name="phaseCode"
                  value={form.phaseCode}
                  onChange={handleChange}
                  placeholder="e.g. DESIGN"
                />
              </div>

              <div className="space-y-2">
                <Label>Project Phase ID</Label>
                <Input
                  name="projectPhaseId"
                  value={form.projectPhaseId}
                  onChange={handleChange}
                  placeholder="Project phase UUID"
                />
              </div>

              <div className="space-y-2">
                <Label>Target Type</Label>
                <Input
                  name="targetType"
                  value={form.targetType}
                  onChange={handleChange}
                  placeholder="e.g. PROJECT"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label>Description</Label>
                <Textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe this document type..."
                />
              </div>

              <div className="md:col-span-2 flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
                <Checkbox
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      isActive: Boolean(checked),
                    }))
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Active
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Allow this document type to be used in the system.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                disabled={isCreating || isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating
                  ? "Saving..."
                  : editingId
                    ? "Update Document Type"
                    : "Create Document Type"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentTypes;
