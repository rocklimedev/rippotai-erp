import ConsentFormDocument from "./ConsentFormDocument";
import { consentFormData } from "./consent-form-data";
import { pdfFileName } from "@/components/print-document";

/**
 * Template registry — add a new entry here and it appears in the Templates tab.
 *
 * type: "generated" → built from project data (Generate = preview modal, Download = PDF of it)
 * type: "static"    → ready-made PDF, downloaded as is (Generate is disabled)
 *
 * For "generated" templates:
 *   fields    – data the document needs. Anything `required` and empty after
 *               getValues(project) is asked for in a "complete details" modal
 *               BEFORE the preview/download. Nothing is shown as an input otherwise.
 *   getValues – pulls values from the project (auto-fetch).
 *   Document  – forwardRef component that takes { values } and renders A4 pages.
 */
export const TEMPLATES = [
  {
    id: "client-consent-form",
    type: "generated",
    name: "Client consent form",
    description: "Occupied site & pre-agreement commencement",
    fields: [
      {
        key: "projectName",
        label: "Project name",
        required: true,
        maxLength: 150,
      },
      {
        key: "clientName",
        label: "Client name(s)",
        required: true,
        maxLength: 150,
      },
      {
        key: "siteAddress",
        label: "Site address",
        required: true,
        maxLength: 350,
      },
      { key: "date", label: "Form date", required: true, inputType: "date" },
    ],
    getValues: consentFormData,
    Document: ConsentFormDocument,
    fileName: (project) => pdfFileName("Client-Consent-Form", project.name, 1),
    pdfOptions: (project) => ({
      title: `Client Consent Form — ${project.name}`,
      label: "consent form",
    }),
  },

  // Example of a ready-made PDF (downloaded as is):
  // {
  //   id: "site-safety-checklist",
  //   type: "static",
  //   name: "Site safety checklist",
  //   description: "Blank checklist for site supervisors",
  //   fileUrl: "/templates/site-safety-checklist.pdf",
  //   fileName: () => "Site-Safety-Checklist.pdf",
  // },
];
