import React from "react";
import { Building2, Lock } from "lucide-react";

import { Card, CardHeader } from "../ui/card";
import { Field, Input, Textarea, Select } from "../ui/Field";

/* ============================================================
   FIELD -> API MAPPING NOTES

   Kept in sync with proposalMappers.js:
     mapProjectToProjectDetail()
     mapProjectDetailToUpdatePayload()

   SAVED — writes to a real project column via updateProject:
     projectName  -> name
     siteAddress  -> site_location
     brief        -> description

   READ-ONLY HERE — comes from a relation this form doesn't own:
     clientName   -> project.client.name (edit the client record)
     projectType  -> project.project_type (edit on the project record)

   LOCAL TO THIS PROPOSAL — no column on the project record yet.
   Editable so the proposal document can still carry this detail,
   but changes are NOT persisted back to the project. If/when the
   backend adds these columns, move their keys out of
   LOCAL_ONLY_FIELDS and wire them into mapProjectDetailToUpdatePayload.
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
     HINT HELPER

     Read-only fields get an explanation of where they actually
     live. Local-only fields get a note that saving this step
     won't persist them to the project record. Everything else
     (projectName / siteAddress / brief) is genuinely saved, so
     no extra hint is added there.
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

  const isReadOnly = (key) => READ_ONLY_FIELDS.has(key);

  return (
    <Card>
      <CardHeader
        icon={Building2}
        title="Project detail"
        subtitle="Fetched from the project record — edit before generating"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* ======================================================
            BASIC PROJECT INFORMATION
        ====================================================== */}

        <Field label="Project name">
          <Input
            value={value("projectName")}
            onChange={set("projectName")}
            placeholder="Project name"
          />
        </Field>

        <Field label="Client name" hint={hintFor("clientName")}>
          <Input
            value={value("clientName")}
            onChange={set("clientName")}
            placeholder="Client full name"
            disabled
            readOnly
            className="cursor-not-allowed opacity-70"
          />
        </Field>

        <Field label="Site address" className="md:col-span-2">
          <Input
            value={value("siteAddress")}
            onChange={set("siteAddress")}
            placeholder="Project site address"
          />
        </Field>

        {/* ======================================================
            PROPERTY DETAILS
        ====================================================== */}

        <Field label="Unit type" hint={hintFor("unitType")}>
          <Input
            value={value("unitType")}
            onChange={set("unitType")}
            placeholder="Apartment / Villa / Office / etc."
          />
        </Field>

        <Field label="Project type" hint={hintFor("projectType")}>
          <Select
            value={value("projectType")}
            onChange={set("projectType")}
            disabled
            className="cursor-not-allowed opacity-70"
          >
            <option value="">Select project type</option>

            <option value="Residential">Residential</option>

            <option value="Commercial">Commercial</option>

            <option value="Industrial">Industrial</option>

            <option value="Hospitality">Hospitality</option>

            <option value="Institutional">Institutional</option>
          </Select>
        </Field>

        <Field label="Work type" hint={hintFor("workType")}>
          <Select value={value("workType")} onChange={set("workType")}>
            <option value="">Select work type</option>

            <option value="Consultancy">Consultancy</option>

            <option value="Turnkey execution">Turnkey execution</option>
          </Select>
        </Field>

        {/* ======================================================
            AREA
        ====================================================== */}

        <Field label="Carpet area (sq ft)" hint={hintFor("carpetArea")}>
          <Input
            type="number"
            min="0"
            value={value("carpetArea")}
            onChange={set("carpetArea")}
            placeholder="0"
          />
        </Field>

        <Field label="Built-up area (sq ft)" hint={hintFor("builtUpArea")}>
          <Input
            type="number"
            min="0"
            value={value("builtUpArea")}
            onChange={set("builtUpArea")}
            placeholder="0"
          />
        </Field>

        <Field label="Total area (sq ft)" hint={hintFor("totalArea")}>
          <Input
            type="number"
            min="0"
            value={value("totalArea")}
            onChange={set("totalArea")}
            placeholder="0"
          />
        </Field>

        {/* ======================================================
            BEDROOMS / BATHROOMS
        ====================================================== */}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Bedrooms" hint={hintFor("bedrooms")}>
            <Input
              type="number"
              min="0"
              value={value("bedrooms")}
              onChange={set("bedrooms")}
              placeholder="0"
            />
          </Field>

          <Field label="Bathrooms" hint={hintFor("bathrooms")}>
            <Input
              type="number"
              min="0"
              value={value("bathrooms")}
              onChange={set("bathrooms")}
              placeholder="0"
            />
          </Field>
        </div>

        {/* ======================================================
            DOCUMENT INFORMATION
        ====================================================== */}

        <Field label="Prepared by" hint={hintFor("preparedBy")}>
          <Input
            value={value("preparedBy")}
            onChange={set("preparedBy")}
            placeholder="Prepared by"
          />
        </Field>

        <Field label="Reviewed by" hint={hintFor("reviewedBy")}>
          <Input
            value={value("reviewedBy")}
            onChange={set("reviewedBy")}
            placeholder="Reviewed by"
          />
        </Field>

        <Field label="Date of issue" hint={hintFor("dateOfIssue")}>
          <Input
            type="date"
            value={value("dateOfIssue")}
            onChange={set("dateOfIssue")}
          />
        </Field>

        {/* ======================================================
            PROJECT BRIEF
        ====================================================== */}

        <Field label="The brief, in one paragraph" className="md:col-span-2">
          <Textarea
            rows={5}
            value={value("brief")}
            onChange={set("brief")}
            placeholder="Describe the project brief..."
          />
        </Field>

        {/* ======================================================
            CONSTRAINTS / SITE CONDITIONS
        ====================================================== */}

        <Field
          label="Constraints and site conditions noted"
          hint={hintFor("constraints")}
          className="md:col-span-2"
        >
          <Textarea
            rows={4}
            value={value("constraints")}
            onChange={set("constraints")}
            placeholder="Describe constraints, site conditions, restrictions, access conditions, etc."
          />
        </Field>
      </div>

      {/* ========================================================
          LEGEND
      ======================================================== */}

      <div className="mt-6 flex items-start gap-2 rounded-lg border border-[var(--stroke)] bg-[var(--mist-soft)] p-3 text-xs text-[var(--muted)]">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />

        <p>
          <span className="font-medium text-[var(--foreground)]">
            Project name, site address
          </span>{" "}
          and{" "}
          <span className="font-medium text-[var(--foreground)]">
            the brief
          </span>{" "}
          save back to the project record. Client name and project type are
          locked because they come from linked records. Everything else on this
          step is used to build the proposal document only, until the project
          record supports storing it directly.
        </p>
      </div>
    </Card>
  );
}
