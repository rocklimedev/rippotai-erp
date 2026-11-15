// Design Studio › Material Palette: uploaded palettes per project, plus the
// generated MATERIAL PALLETE TEMPLATE PDF built from the project's sample boards.
import { useState } from "react";
import { FileImage } from "lucide-react";
import { Button, Field, SelectInput } from "@/components/inos";
import { Modal } from "@/components/projects/_projects-ui";
import MaterialPaletteButton from "@/components/material-palette/MaterialPaletteButton";
import { useGetMaterialRequirementsByProjectQuery } from "@/api/procuerment/material-requirement.api";
import UploadDocListPage from "./UploadDocListPage";
import { asList, useProjectsList } from "./uploadDocs";

function GenerateModal({ onClose }) {
  const { projects } = useProjectsList();
  const [projectId, setProjectId] = useState("");
  const { data, isFetching } = useGetMaterialRequirementsByProjectQuery(projectId, { skip: !projectId });
  const requirements = asList(data);
  return (
    <Modal open onClose={onClose} title="Generate Material Palette" width={480} testId="palette-generate-modal">
      <Field label="Project" required>
        <SelectInput value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">Select project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </SelectInput>
      </Field>
      {projectId && (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <MaterialPaletteButton projectId={projectId} requirements={requirements} />
          <span className="pj-muted" style={{ fontSize: 13 }}>
            {isFetching ? "Loading materials…" : requirements.length ? `${requirements.length} materials` : "No materials selected for this project yet"}
          </span>
        </div>
      )}
    </Modal>
  );
}

export default function MaterialPalettePage() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <UploadDocListPage
        docKey="material-palette"
        actions={
          <Button variant="secondary" icon={FileImage} onClick={() => setOpen(true)} data-testid="palette-generate-btn">
            Generate PDF
          </Button>
        }
      />
      {open && <GenerateModal onClose={() => setOpen(false)} />}
    </>
  );
}
