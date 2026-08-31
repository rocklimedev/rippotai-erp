import React from "react";
import { Building2, Lock } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
/* ============================================================
     REUSABLE FIELD WRAPPER
  ============================================================ */

const FormField = ({ id, label, hint, children, className = "" }) => (
  <div className={`space-y-2 ${className}`}>
    <Label htmlFor={id}>{label}</Label>

    {children}

    {hint && <p className="text-xs leading-4 text-muted-foreground">{hint}</p>}
  </div>
);
/* ============================================================
   FIELD -> API MAPPING NOTES

   SAVED — writes to a real project column via updateProject:
     projectName  -> name
     siteAddress  -> site_location
     brief        -> description

   READ-ONLY — comes from related project/client records:
     clientName   -> project.client.name
     projectType  -> project.project_type

   LOCAL ONLY — proposal-specific fields that are not currently
   persisted to the project record.
============================================================ */

const READ_ONLY_FIELDS = new Set(["clientName", "projectType"]);

const LOCAL_ONLY_FIELDS = new Set([
  "unitType",
  "workType",
  "totalArea",
  "builtUpArea",
  "carpetArea",
  "bedrooms",
  "bathrooms",
  "dateOfIssue",
  "preparedBy",
  "reviewedBy",
  "constraints",
]);

const LOCAL_ONLY_HINT =
  "Local to this proposal — not saved to the project record yet.";

export default function ProjectDetailSection({ data, onChange }) {
  if (!data) return null;

  /* ============================================================
     SAFE VALUE
  ============================================================ */

  const value = (key) => data[key] ?? "";

  /* ============================================================
     UPDATE FIELD
  ============================================================ */

  const set = (key) => (event) => {
    if (READ_ONLY_FIELDS.has(key)) return;

    onChange({
      ...data,
      [key]: event.target.value,
    });
  };

  /* ============================================================
     SELECT UPDATE
  ============================================================ */

  const setSelect = (key) => (newValue) => {
    if (READ_ONLY_FIELDS.has(key)) return;

    onChange({
      ...data,
      [key]: newValue,
    });
  };

  /* ============================================================
     HINT
  ============================================================ */

  const hintFor = (key, baseHint) => {
    if (key === "clientName") {
      return "Sourced from the linked client record — edit the client to change this.";
    }

    if (key === "projectType") {
      return "Sourced from the project record — change the project type on the project itself.";
    }

    if (LOCAL_ONLY_FIELDS.has(key)) {
      return baseHint ? `${baseHint} ${LOCAL_ONLY_HINT}` : LOCAL_ONLY_HINT;
    }

    return baseHint;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-semibold leading-none tracking-tight">
            Project detail
          </h3>

          <p className="text-sm text-muted-foreground">
            Fetched from the project record — edit before generating
          </p>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* ====================================================
              BASIC PROJECT INFORMATION
          ==================================================== */}

          <FormField id="projectName" label="Project name">
            <Input
              id="projectName"
              value={value("projectName")}
              onChange={set("projectName")}
              placeholder="Project name"
            />
          </FormField>

          <FormField
            id="clientName"
            label="Client name"
            hint={hintFor("clientName")}
          >
            <Input
              id="clientName"
              value={value("clientName")}
              placeholder="Client full name"
              disabled
              readOnly
              className="cursor-not-allowed bg-muted/50 opacity-70"
            />
          </FormField>

          <FormField
            id="siteAddress"
            label="Site address"
            className="md:col-span-2"
          >
            <Input
              id="siteAddress"
              value={value("siteAddress")}
              onChange={set("siteAddress")}
              placeholder="Project site address"
            />
          </FormField>

          {/* ====================================================
              PROPERTY DETAILS
          ==================================================== */}

          <FormField id="unitType" label="Unit type" hint={hintFor("unitType")}>
            <Input
              id="unitType"
              value={value("unitType")}
              onChange={set("unitType")}
              placeholder="Apartment / Villa / Office / etc."
            />
          </FormField>

          <FormField
            id="projectType"
            label="Project type"
            hint={hintFor("projectType")}
          >
            <Select
              value={value("projectType")}
              onValueChange={setSelect("projectType")}
              disabled
            >
              <SelectTrigger
                id="projectType"
                className="cursor-not-allowed bg-muted/50 opacity-70"
              >
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="Residential">Residential</SelectItem>

                <SelectItem value="Commercial">Commercial</SelectItem>

                <SelectItem value="Industrial">Industrial</SelectItem>

                <SelectItem value="Hospitality">Hospitality</SelectItem>

                <SelectItem value="Institutional">Institutional</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField id="workType" label="Work type" hint={hintFor("workType")}>
            <Select
              value={value("workType")}
              onValueChange={setSelect("workType")}
            >
              <SelectTrigger id="workType">
                <SelectValue placeholder="Select work type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="Consultancy">Consultancy</SelectItem>

                <SelectItem value="Turnkey execution">
                  Turnkey execution
                </SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {/* ====================================================
              AREA
          ==================================================== */}

          <FormField
            id="carpetArea"
            label="Carpet area (sq ft)"
            hint={hintFor("carpetArea")}
          >
            <Input
              id="carpetArea"
              type="number"
              min="0"
              value={value("carpetArea")}
              onChange={set("carpetArea")}
              placeholder="0"
            />
          </FormField>

          <FormField
            id="builtUpArea"
            label="Built-up area (sq ft)"
            hint={hintFor("builtUpArea")}
          >
            <Input
              id="builtUpArea"
              type="number"
              min="0"
              value={value("builtUpArea")}
              onChange={set("builtUpArea")}
              placeholder="0"
            />
          </FormField>

          <FormField
            id="totalArea"
            label="Total area (sq ft)"
            hint={hintFor("totalArea")}
          >
            <Input
              id="totalArea"
              type="number"
              min="0"
              value={value("totalArea")}
              onChange={set("totalArea")}
              placeholder="0"
            />
          </FormField>

          {/* ====================================================
              BEDROOMS / BATHROOMS
          ==================================================== */}

          <div className="grid grid-cols-2 gap-4">
            <FormField
              id="bedrooms"
              label="Bedrooms"
              hint={hintFor("bedrooms")}
            >
              <Input
                id="bedrooms"
                type="number"
                min="0"
                value={value("bedrooms")}
                onChange={set("bedrooms")}
                placeholder="0"
              />
            </FormField>

            <FormField
              id="bathrooms"
              label="Bathrooms"
              hint={hintFor("bathrooms")}
            >
              <Input
                id="bathrooms"
                type="number"
                min="0"
                value={value("bathrooms")}
                onChange={set("bathrooms")}
                placeholder="0"
              />
            </FormField>
          </div>

          {/* ====================================================
              DOCUMENT INFORMATION
          ==================================================== */}

          <FormField
            id="preparedBy"
            label="Prepared by"
            hint={hintFor("preparedBy")}
          >
            <Input
              id="preparedBy"
              value={value("preparedBy")}
              onChange={set("preparedBy")}
              placeholder="Prepared by"
            />
          </FormField>

          <FormField
            id="reviewedBy"
            label="Reviewed by"
            hint={hintFor("reviewedBy")}
          >
            <Input
              id="reviewedBy"
              value={value("reviewedBy")}
              onChange={set("reviewedBy")}
              placeholder="Reviewed by"
            />
          </FormField>

          <FormField
            id="dateOfIssue"
            label="Date of issue"
            hint={hintFor("dateOfIssue")}
          >
            <Input
              id="dateOfIssue"
              type="date"
              value={value("dateOfIssue")}
              onChange={set("dateOfIssue")}
            />
          </FormField>

          {/* ====================================================
              PROJECT BRIEF
          ==================================================== */}

          <FormField
            id="brief"
            label="The brief, in one paragraph"
            className="md:col-span-2"
          >
            <Textarea
              id="brief"
              rows={5}
              value={value("brief")}
              onChange={set("brief")}
              placeholder="Describe the project brief..."
              className="resize-y"
            />
          </FormField>

          {/* ====================================================
              CONSTRAINTS / SITE CONDITIONS
          ==================================================== */}

          <FormField
            id="constraints"
            label="Constraints and site conditions noted"
            hint={hintFor("constraints")}
            className="md:col-span-2"
          >
            <Textarea
              id="constraints"
              rows={4}
              value={value("constraints")}
              onChange={set("constraints")}
              placeholder="Describe constraints, site conditions, restrictions, access conditions, etc."
              className="resize-y"
            />
          </FormField>
        </div>

        {/* ======================================================
            LEGEND
        ====================================================== */}

        <div className="mt-6 flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />

          <p className="leading-5">
            <span className="font-medium text-foreground">
              Project name, site address
            </span>{" "}
            and <span className="font-medium text-foreground">the brief</span>{" "}
            save back to the project record. Client name and project type are
            locked because they come from linked records. Everything else on
            this step is used to build the proposal document only, until the
            project record supports storing it directly.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
