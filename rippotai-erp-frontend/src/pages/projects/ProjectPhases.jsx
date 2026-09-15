import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Layers3, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

import {
  useGetProjectPhasesQuery,
  useCreateProjectPhaseMutation,
  useUpdateProjectPhaseMutation,
  useDeleteProjectPhaseMutation,
} from "../../api/projects/project.api";

const EMPTY_FORM = {
  name: "",
  code: "",
  description: "",
};

const ProjectPhases = () => {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const {
    data: projectPhases = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetProjectPhasesQuery({
    search: search.trim() || undefined,
  });

  const [createProjectPhase, { isLoading: isCreating }] =
    useCreateProjectPhaseMutation();

  const [updateProjectPhase, { isLoading: isUpdating }] =
    useUpdateProjectPhaseMutation();

  const [deleteProjectPhase, { isLoading: isDeleting }] =
    useDeleteProjectPhaseMutation();

  const normalizedPhases = useMemo(() => {
    if (!Array.isArray(projectPhases)) return [];

    const value = search.trim().toLowerCase();

    if (!value) return projectPhases;

    return projectPhases.filter((item) =>
      [item.title, item.code, item.description]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value)),
    );
  }, [projectPhases, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);

    setForm({
      name: item.title || "",
      code: item.code || item.phaseCode || "",
      description: item.description || "",
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
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      toast.error("Project phase name is required");
      return;
    }

    try {
      const payload = {
        name: form.title.trim(),
        code: form.code.trim() || undefined,
        description: form.description.trim() || undefined,
      };

      if (editingId) {
        await updateProjectPhase({
          id: editingId,
          ...payload,
        }).unwrap();

        toast.success("Project phase updated successfully");
      } else {
        await createProjectPhase(payload).unwrap();

        toast.success("Project phase created successfully");
      }

      closeModal();
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Unable to save project phase",
      );
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Delete project phase "${item.title}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      await deleteProjectPhase(item.id).unwrap();

      toast.success("Project phase deleted successfully");
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Unable to delete project phase",
      );
    }
  };

  return (
    <div className="min-h-full bg-muted/40 p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Layers3 className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Project Phases
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage the master phases used throughout project workflows.
            </p>
          </div>
        </div>

        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Project Phase
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
                placeholder="Search project phases..."
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

      {/* Stats */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total Phases
            </div>
            <div className="mt-2 text-2xl font-semibold text-foreground">
              {normalizedPhases.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Master Configuration
            </div>
            <div className="mt-2 text-sm font-medium text-primary">
              Project Workflow
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Search Result
            </div>
            <div className="mt-2 text-2xl font-semibold text-foreground">
              {normalizedPhases.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phase</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Loading project phases...
                  </TableCell>
                </TableRow>
              ) : normalizedPhases.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No project phases found.
                  </TableCell>
                </TableRow>
              ) : (
                normalizedPhases.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {item.title || "—"}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        {item.phase_code || "—"}
                      </Badge>
                    </TableCell>

                    <TableCell className="max-w-lg text-muted-foreground">
                      <div className="truncate">
                        {item.description || "No description"}
                      </div>
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
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Project Phase" : "Create Project Phase"}
            </DialogTitle>
            <DialogDescription>
              Define a phase for the project workflow.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-5 py-2">
              <div className="space-y-2">
                <Label>
                  Phase Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  name="name"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Design Development"
                />
              </div>

              <div className="space-y-2">
                <Label>Phase Code</Label>
                <Input
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="e.g. DESIGN"
                  className="uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe what this project phase represents..."
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
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
                    ? "Update Project Phase"
                    : "Create Project Phase"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectPhases;
