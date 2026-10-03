// Design Studio → Integration diagnostics.
// Houses the Zoho WorkDrive test panel that used to occupy the Upload page.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, CloudUpload, HardDrive, Plug } from "lucide-react";

import { Page, PageHeader, Card, Button, Pill } from "@/components/inos";
import ZohoWorkDriveTestPanel from "@/pages/UploadPanel";
import "./drawings.css";

export default function DrawingIntegrations() {
  const nav = useNavigate();
  const [open, setOpen] = useState(true);

  return (
    <Page>
      <PageHeader
        crumbs={[{ label: "Design Studio", to: "/design-studio" }, { label: "Upload", to: "/design-studio/upload" }, { label: "Integrations" }]}
        title="Integration diagnostics"
        subtitle="Where drawing files are stored, and tools to test the optional Zoho WorkDrive connection."
        actions={
          <Button variant="primary" icon={CloudUpload} onClick={() => nav("/design-studio/upload")}>
            Upload drawings
          </Button>
        }
      />

      <div className="ds-view">
        <Card
          title="Zoho WorkDrive"
          subtitle="Connect, pick a folder and push a test file. For admins setting up the integration."
          actions={
            <Button variant="ghost" size="sm" icon={open ? ChevronUp : ChevronDown} onClick={() => setOpen((o) => !o)}>
              {open ? "Collapse" : "Expand"}
            </Button>
          }
        >
          {open ? (
            <ZohoWorkDriveTestPanel />
          ) : (
            <p style={{ margin: 0, color: "var(--text-3)", fontSize: 13 }}>Diagnostics hidden.</p>
          )}
        </Card>

        <Card title="How drawing storage works">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <span className="inos-icon-tile inos-icon-tile--ok">
                <HardDrive aria-hidden />
              </span>
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 650 }}>
                  INOS file storage <Pill tone="ok" size="sm">Active</Pill>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
                  Every drawing uploaded from Design Studio is stored on the INOS CDN with its revision, status and issue
                  date. Nothing else is required to upload.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <span className="inos-icon-tile inos-icon-tile--info">
                <Plug aria-hidden />
              </span>
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 650 }}>
                  Zoho WorkDrive <Pill size="sm">Optional</Pill>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
                  Use the panel to authorise WorkDrive and verify folder access before enabling sync for a team.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Page>
  );
}
