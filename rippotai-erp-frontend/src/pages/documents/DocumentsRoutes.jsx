import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Shell } from "../../hooks/shared";
import {
  useGetDrawingsQuery,
  useCreateDrawingMutation,
  useAddDrawingRevisionMutation,
} from "../../api/documents/drawing.api";

import { useGetDocumentTypesQuery } from "../../api/documents/document.api";
import { useGetProjectsQuery } from "../../api/projects/project.api";

/* =========================================================
   Drawings
========================================================= */

export function DrawingsAll() {
  const nav = useNavigate();

  // GET /drawings — returns drawings across all projects.
  const { data: rows = [], isLoading, isError } = useGetDrawingsQuery();

  return (
    <Shell
      title="All Drawings"
      subtitle={`${rows.length} drawing${
        rows.length !== 1 ? "s" : ""
      } · revisions preserved`}
      action={
        <Button onClick={() => nav("/design-studio/new")}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Drawing
        </Button>
      }
    >
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Drawing No.</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Discipline</TableHead>
                  <TableHead>Rev.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Loading drawings...
                    </TableCell>
                  </TableRow>
                )}

                {isError && !isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-destructive"
                    >
                      Failed to load drawings. Please try again.
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  !isError &&
                  rows.map((r) => (
                    <TableRow
                      key={r.id}
                      onClick={() => nav(`/design-studio/${r.id}`)}
                      className="cursor-pointer"
                      data-testid={`drawing-row-${r.id}`}
                    >
                      <TableCell className="font-mono font-semibold">
                        {r.drawingNumber}
                      </TableCell>

                      <TableCell>{r.title}</TableCell>

                      <TableCell>{r.discipline || "—"}</TableCell>

                      <TableCell>{r.revisions?.[0]?.revision || "—"}</TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            r.status === "Superseded" ? "secondary" : "outline"
                          }
                        >
                          {r.status || "Draft"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {(
                          r.revisions?.[0]?.issueDate ||
                          r.updatedAt ||
                          ""
                        ).slice(0, 10)}
                      </TableCell>
                    </TableRow>
                  ))}

                {!isLoading && !isError && !rows.length && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No drawings yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </Shell>
  );
}

/* =========================================================
   Drawing Upload
========================================================= */

export function DrawingUpload() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    projectId: "",
    title: "",
    drawingNumber: "",
    documentTypeId: "",
    discipline: "Architecture",
    issuePurpose: "",
    status: "Draft",
    remarks: "",
  });

  const [revisionForm, setRevisionForm] = useState({
    revision: "A",
    issueDate: "",
    issuePurpose: "",
    status: "Draft",
    remarks: "",
    uploadedBy: "",
    uploadedByName: "",
  });

  const [file, setFile] = useState(null);

  const { data: projects = [] } = useGetProjectsQuery({});
  const { data: documentTypes = [], isLoading: documentTypesLoading } =
    useGetDocumentTypesQuery({
      isActive: true,
    });
  const [createDrawing, { isLoading: creating }] = useCreateDrawingMutation();

  const [addDrawingRevision, { isLoading: uploading }] =
    useAddDrawingRevisionMutation();

  const submitting = creating || uploading;

  const updateForm = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateRevisionForm = (key, value) => {
    setRevisionForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.projectId) {
      toast.error("Please select a project");
      return;
    }

    if (!form.title.trim()) {
      toast.error("Drawing title is required");
      return;
    }

    if (!form.drawingNumber.trim()) {
      toast.error("Drawing number is required");
      return;
    }

    if (!file) {
      toast.error("Pick a drawing file");
      return;
    }

    try {
      /*
       * STEP 1
       * Create drawing metadata.
       *
       * POST /drawings
       */
      const drawing = await createDrawing({
        projectId: form.projectId,
        documentTypeId: form.documentTypeId || undefined,
        title: form.title,
        drawingNumber: form.drawingNumber,
        discipline: form.discipline || undefined,
        issuePurpose: form.issuePurpose || undefined,
        status: form.status || "Draft",
        remarks: form.remarks || undefined,
      }).unwrap();

      /*
       * STEP 2
       * Upload the actual drawing file as a revision.
       *
       * POST /drawings/:id/revisions
       */
      await addDrawingRevision({
        id: drawing.id,
        data: {
          revision: revisionForm.revision || undefined,
          issueDate: revisionForm.issueDate || undefined,
          issuePurpose:
            revisionForm.issuePurpose || form.issuePurpose || undefined,
          status: revisionForm.status || form.status || "Draft",
          remarks: revisionForm.remarks || form.remarks || undefined,
          uploadedBy: revisionForm.uploadedBy || undefined,
          uploadedByName: revisionForm.uploadedByName || undefined,
        },
        file,
      }).unwrap();

      toast.success("Drawing uploaded successfully");

      nav(`/documents/drawings/${drawing.id}`);
    } catch (error) {
      console.error("Drawing upload failed:", error);

      toast.error(
        error?.data?.message || error?.message || "Failed to upload drawing",
      );
    }
  };

  return (
    <Shell
      title="Upload Drawing"
      subtitle="Create a drawing and upload its first revision"
    >
      <Card>
        <CardContent className="pt-6">
          <form
            onSubmit={submit}
            className="grid gap-4 max-w-2xl md:grid-cols-2"
          >
            {/* Project */}
            <div className="md:col-span-2 space-y-2">
              <Label>Project</Label>
              <Select
                value={form.projectId}
                onValueChange={(value) => updateForm("projectId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Document Type */}
            <div className="md:col-span-2 space-y-2">
              <Label>Document Type</Label>
              <Select
                value={form.documentTypeId}
                onValueChange={(value) => updateForm("documentTypeId", value)}
                disabled={documentTypesLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      documentTypesLoading
                        ? "Loading document types..."
                        : "Select document type..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                required
                type="text"
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
              />
            </div>

            {/* Drawing Number */}
            <div className="space-y-2">
              <Label>Drawing Number</Label>
              <Input
                required
                type="text"
                value={form.drawingNumber}
                onChange={(e) => updateForm("drawingNumber", e.target.value)}
              />
            </div>

            {/* Discipline */}
            <div className="space-y-2">
              <Label>Discipline</Label>
              <Input
                type="text"
                value={form.discipline}
                onChange={(e) => updateForm("discipline", e.target.value)}
              />
            </div>

            {/* Revision */}
            <div className="space-y-2">
              <Label>Revision</Label>
              <Input
                type="text"
                value={revisionForm.revision}
                onChange={(e) => updateRevisionForm("revision", e.target.value)}
              />
            </div>

            {/* Issue Date */}
            <div className="space-y-2">
              <Label>Issue Date</Label>
              <Input
                type="date"
                value={revisionForm.issueDate}
                onChange={(e) =>
                  updateRevisionForm("issueDate", e.target.value)
                }
              />
            </div>

            {/* Issue Purpose */}
            <div className="space-y-2">
              <Label>Issue Purpose</Label>
              <Input
                type="text"
                value={form.issuePurpose}
                onChange={(e) => updateForm("issuePurpose", e.target.value)}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => updateForm("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="For Review">For Review</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Superseded">Superseded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Remarks */}
            <div className="md:col-span-2 space-y-2">
              <Label>Remarks</Label>
              <Textarea
                value={form.remarks}
                onChange={(e) => updateForm("remarks", e.target.value)}
                rows={4}
              />
            </div>

            {/* File */}
            <div className="md:col-span-2 space-y-2">
              <Label>Drawing File</Label>
              <Input
                type="file"
                required
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file && (
                <p className="text-xs text-muted-foreground">
                  Selected: {file.name}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="md:col-span-2">
              <Button type="submit" disabled={submitting}>
                <Upload className="mr-2 h-4 w-4" />
                {creating
                  ? "Creating Drawing..."
                  : uploading
                    ? "Uploading Revision..."
                    : "Upload Drawing"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </Shell>
  );
}
