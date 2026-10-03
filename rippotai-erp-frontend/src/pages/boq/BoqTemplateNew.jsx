import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Page, PageHeader, Button, Field, TextInput, TextArea, ChoiceGroup } from "@/components/inos";
import { DocSection, Grid } from "@/components/forms/commerce-form-ui";
import { useCreateTemplateMutation } from "../../api/boq/boq.api";

const TIERS = [
  { value: "essential", label: "Essential" },
  { value: "premium", label: "Premium" },
  { value: "luxury", label: "Luxury" },
];

export default function BoqTemplateNew() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [tier, setTier] = useState("");
  const [description, setDescription] = useState("");

  const [createTemplate, { isLoading: busy }] = useCreateTemplateMutation();

  const submit = async (e) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Please give the template a name");
      return;
    }

    try {
      const payload = {
        name: trimmedName,
        ...(tier && { template_tier: tier }),
        ...(description.trim() && { description: description.trim() }),
        // categories omitted → cleaner payload (backend defaults to empty)
      };

      const data = await createTemplate(payload).unwrap();

      toast.success("Template created successfully");
      nav(`/boq/template/${data.id}/editor`);
    } catch (err) {
      toast.error(err?.data?.detail || "Failed to create template");
    }
  };

  return (
    <Page width="form">
      <div data-testid="boq-template-new-page" style={{ display: "contents" }}>
        <PageHeader
          crumbs={[
            { label: "Ledger", to: "/ledger" },
            { label: "BOQ templates", to: "/ledger/boq/templates" },
            { label: "New" },
          ]}
          title="New BOQ template"
          subtitle="Name it and pick a tier — you'll add categories and items in the editor next."
          actions={
            <Button variant="ghost" icon={ArrowLeft} onClick={() => nav("/boq/templates")}>
              Back to templates
            </Button>
          }
        />

        <form onSubmit={submit} className="inos-form">
          <DocSection step={1} title="Template" description="How it appears when someone starts a new BOQ.">
            <Grid cols={1}>
              <Field label="Template name" required htmlFor="tpl-name">
                <TextInput
                  id="tpl-name"
                  placeholder="e.g. 2BHK interior — premium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  data-testid="template-new-name"
                />
              </Field>
              <Field label="Tier" optional hint="Helps pick the right template for the client's budget.">
                <div data-testid="template-new-tier">
                  <ChoiceGroup
                    name="Tier"
                    value={tier}
                    onChange={setTier}
                    options={[{ value: "", label: "No tier" }, ...TIERS]}
                  />
                </div>
              </Field>
              <Field label="Description" optional htmlFor="tpl-desc">
                <TextArea
                  id="tpl-desc"
                  rows={3}
                  placeholder="e.g. Full-home interiors for 2BHK apartments, mid-range finishes"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-testid="template-new-description"
                />
              </Field>
            </Grid>
          </DocSection>

          <div className="inos-form-actions">
            <span className="inos-form-actions__note">Step 1 of 2 — items are added in the editor.</span>
            <div className="inos-form-actions__buttons">
              <Button variant="ghost" onClick={() => nav("/boq/templates")}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                iconRight={busy ? undefined : ArrowRight}
                disabled={busy || !name.trim()}
                data-testid="template-new-submit"
              >
                {busy ? "Creating…" : "Create & open editor"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Page>
  );
}
