// "Material Palette" — downloads the project's sample boards as the MATERIAL PALLETE TEMPLATE deck.
import { useRef, useState } from "react";
import { FileImage } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useGetProjectByIdQuery } from "@/api/projects/project.api";
import { OFFSCREEN_STYLE } from "@/components/print-document/commerce";
import { downloadDeckPdf } from "@/components/business-proposal/proposal-deck/deckPdf";
import MaterialPaletteDocument from "./MaterialPaletteDocument";

export default function MaterialPaletteButton({ projectId, requirements = [], className }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const { user } = useAuth() || {};
  const { data } = useGetProjectByIdQuery(projectId, { skip: !projectId });
  const project = data?.data || data || {};
  const team = project.team_members || [];
  const lead =
    team.find((t) => /architect/i.test(t.role_label || "") && t.is_primary)?.user?.name ||
    team.find((t) => /architect/i.test(t.role_label || ""))?.user?.name ||
    "";
  const download = async () => {
    if (busy) return;
    setBusy(true);
    const id = "material-palette";
    toast.loading("Preparing the material palette…", { id });
    try {
      await new Promise((r) => setTimeout(r, 400));
      const name = String(project.name || "Project").replace(/[^\w-]+/g, "-");
      await downloadDeckPdf(ref.current, `Material-Palette_${name}.pdf`, { title: `Material Palette — ${project.name || ""}` });
      toast.success("Material palette downloaded", { id });
    } catch (e) {
      console.error(e);
      toast.error("Couldn't create the material palette.", { id });
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Button type="button" variant="outline" className={className} disabled={busy || !requirements.length} onClick={download}>
        <FileImage className="h-4 w-4" />
        {busy ? "Preparing…" : "Material Palette"}
      </Button>
      <div style={OFFSCREEN_STYLE} aria-hidden="true">
        <MaterialPaletteDocument ref={ref} project={project} requirements={requirements} leadArchitect={lead} madeBy={user?.name || ""} />
      </div>
    </>
  );
}
