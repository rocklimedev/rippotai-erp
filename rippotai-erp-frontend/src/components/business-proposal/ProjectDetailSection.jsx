import React from "react";
import { Building2 } from "lucide-react";

import { Card, CardHeader } from "../ui/card";
import { Field, Input, Textarea, Select } from "../ui/Field";

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
    onChange({
      ...data,
      [key]: event.target.value,
    });
  };

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

        <Field
          label="Client name"
          hint="Shown as “Prepared for” on the cover page"
        >
          <Input
            value={value("clientName")}
            onChange={set("clientName")}
            placeholder="Client full name"
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

        <Field label="Unit type">
          <Input
            value={value("unitType")}
            onChange={set("unitType")}
            placeholder="Apartment / Villa / Office / etc."
          />
        </Field>

        <Field label="Project type">
          <Select value={value("projectType")} onChange={set("projectType")}>
            <option value="">Select project type</option>

            <option value="Residential">Residential</option>

            <option value="Commercial">Commercial</option>

            <option value="Industrial">Industrial</option>

            <option value="Hospitality">Hospitality</option>

            <option value="Institutional">Institutional</option>
          </Select>
        </Field>

        <Field label="Work type">
          <Select value={value("workType")} onChange={set("workType")}>
            <option value="">Select work type</option>

            <option value="Consultancy">Consultancy</option>

            <option value="Turnkey execution">Turnkey execution</option>
          </Select>
        </Field>

        {/* ======================================================
            AREA
        ====================================================== */}

        <Field label="Carpet area (sq ft)">
          <Input
            type="number"
            min="0"
            value={value("carpetArea")}
            onChange={set("carpetArea")}
            placeholder="0"
          />
        </Field>

        <Field label="Built-up area (sq ft)">
          <Input
            type="number"
            min="0"
            value={value("builtUpArea")}
            onChange={set("builtUpArea")}
            placeholder="0"
          />
        </Field>

        <Field label="Total area (sq ft)">
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
          <Field label="Bedrooms">
            <Input
              type="number"
              min="0"
              value={value("bedrooms")}
              onChange={set("bedrooms")}
              placeholder="0"
            />
          </Field>

          <Field label="Bathrooms">
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

        <Field label="Prepared by">
          <Input
            value={value("preparedBy")}
            onChange={set("preparedBy")}
            placeholder="Prepared by"
          />
        </Field>

        <Field label="Reviewed by">
          <Input
            value={value("reviewedBy")}
            onChange={set("reviewedBy")}
            placeholder="Reviewed by"
          />
        </Field>

        <Field label="Date of issue">
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
    </Card>
  );
}
