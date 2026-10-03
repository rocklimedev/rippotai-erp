import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  Save,
  Package,
  Search,
  ArrowLeft,
} from "lucide-react";

import {
  Page,
  PageHeader,
  Button,
  Field,
  TextInput,
  SelectInput,
  TextArea,
  FormActions,
  Pill,
} from "@/components/inos";
import {
  DocSection,
  Grid,
  LineTable,
  IconAction,
  RemoveRow,
  AddRow,
  Callout,
} from "@/components/forms/commerce-form-ui";
import { useAuth } from "@/context/AuthContext";

import { useAutoSave } from "../../hooks/use-autosave";

import { useCreateMaterialRequirementMutation } from "../../api/procuerment/material-requirement.api";

import { useGetMaterialsQuery } from "../../api/procuerment/material-master.api";

import { useGetProjectsQuery } from "../../api/projects/project.api";
import { useGetUsersQuery } from "../../api/users/user.api";

const SAVE_KEY = "bc.material-requirement";

const createEmptyRequirement = () => ({
  id: crypto.randomUUID(),

  // Material Master reference.
  // This is currently UI-only because MaterialRequirement
  // does not have materialId in the backend model.
  materialId: "",

  itemName: "",
  category: "",
  selection: "",
  style: "",
  functionalNeeds: "",
  requirementDate: "",

  // Useful Material Master display information.
  brand: "",
  unit: "",

  expanded: false,
});

export function MaterialRequirementForm() {
  const navigate = useNavigate();

  const { data: projects = [] } = useGetProjectsQuery();
  const { data: users = [] } = useGetUsersQuery();

  const { data: materials = [], isLoading: materialsLoading } =
    useGetMaterialsQuery({
      isActive: true,
    });

  const [createMaterialRequirement, { isLoading }] =
    useCreateMaterialRequirementMutation();

  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Preselect the project when arriving from a project page (?projectId=…).
  const [projectId, setProjectId] = React.useState(
    () => searchParams.get("projectId") || searchParams.get("project") || "",
  );

  const [values, setValues] = useAutoSave(SAVE_KEY, {
    designerId: "",
    requirements: [createEmptyRequirement()],
  });

  const requirements = values.requirements || [];

  // Default the designer to the signed-in user when they are in the list.
  React.useEffect(() => {
    if (values.designerId || !user?.id || !Array.isArray(users)) return;
    if (users.some((u) => u.id === user.id)) {
      setValues((prev) => (prev.designerId ? prev : { ...prev, designerId: user.id }));
    }
  }, [user?.id, users, values.designerId, setValues]);

  // ============================================================
  // MATERIAL MASTER HELPERS
  // ============================================================

  const getMaterialName = (material) =>
    material?.name || material?.materialName || material?.itemName || "";

  const getMaterialCategory = (material) =>
    material?.category || material?.subCategory || material?.sub_category || "";

  const getMaterialSelection = (material) => {
    const parts = [
      material?.brand,
      material?.model,
      material?.spec,
      material?.description,
    ].filter(Boolean);

    return parts.join(" • ");
  };

  const getMaterialUnit = (material) =>
    material?.unit?.name ||
    material?.unit?.code ||
    material?.unitName ||
    material?.unit ||
    "";

  // ============================================================
  // MATERIAL MASTER SELECT
  // ============================================================

  const handleMaterialChange = (index, materialId) => {
    const material = materials.find((item) => item.id === materialId);

    if (!material) {
      updateRequirement(index, "materialId", "");
      return;
    }

    setValues((prev) => ({
      ...prev,
      requirements: (prev.requirements || []).map((item, i) =>
        i === index
          ? {
              ...item,

              materialId: material.id,

              itemName: getMaterialName(material),

              category: getMaterialCategory(material),

              selection: getMaterialSelection(material),

              brand: material.brand || "",

              unit: getMaterialUnit(material),
            }
          : item,
      ),
    }));
  };

  // ============================================================
  // UPDATE ROW
  // ============================================================

  const updateRequirement = (index, field, value) => {
    setValues((prev) => ({
      ...prev,
      requirements: (prev.requirements || []).map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    }));
  };

  // ============================================================
  // ADD ROW
  // ============================================================

  const addRequirement = () => {
    setValues((prev) => ({
      ...prev,
      requirements: [...(prev.requirements || []), createEmptyRequirement()],
    }));
  };

  // ============================================================
  // DUPLICATE ROW
  // ============================================================

  const duplicateRequirement = (index) => {
    setValues((prev) => {
      const source = prev.requirements[index];

      const copy = {
        ...source,
        id: crypto.randomUUID(),
        itemName: source.itemName ? `${source.itemName} Copy` : "",
        expanded: false,
      };

      const requirements = [...prev.requirements];

      requirements.splice(index + 1, 0, copy);

      return {
        ...prev,
        requirements,
      };
    });
  };

  // ============================================================
  // REMOVE ROW
  // ============================================================

  const removeRequirement = (index) => {
    setValues((prev) => {
      const requirements = [...(prev.requirements || [])];

      if (requirements.length === 1) {
        return {
          ...prev,
          requirements: [createEmptyRequirement()],
        };
      }

      requirements.splice(index, 1);

      return {
        ...prev,
        requirements,
      };
    });
  };

  // ============================================================
  // TOGGLE DETAILS
  // ============================================================

  const toggleExpanded = (index) => {
    setValues((prev) => ({
      ...prev,
      requirements: (prev.requirements || []).map((item, i) =>
        i === index
          ? {
              ...item,
              expanded: !item.expanded,
            }
          : item,
      ),
    }));
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async () => {
    if (!projectId) {
      return toast.error("Please select a project.");
    }

    if (!values.designerId) {
      return toast.error("Please select a designer.");
    }

    const validRows = requirements.filter(
      (item) => item.itemName?.trim() || item.selection?.trim(),
    );

    if (!validRows.length) {
      return toast.error("Add at least one material requirement.");
    }

    const incompleteRows = validRows.filter(
      (item) => !item.itemName?.trim() || !item.selection?.trim(),
    );

    if (incompleteRows.length) {
      return toast.error(
        `${incompleteRows.length} material ${
          incompleteRows.length === 1 ? "row is" : "rows are"
        } incomplete. Select a material and add a selection/specification.`,
      );
    }

    try {
      /*
       * Each table row becomes one MaterialRequirement.
       *
       * Material Master supplies:
       * - itemName
       * - category
       * - brand
       * - model/specification
       * - unit
       *
       * The current MaterialRequirement backend does not
       * persist materialId yet, so materialId is UI-only.
       *
       * Budget/price is intentionally not part of a requirement —
       * pricing lives on quotations, raised later by procurement.
       */
      await Promise.all(
        validRows.map((item) =>
          createMaterialRequirement({
            projectId,
            designerId: values.designerId,

            itemName: item.itemName.trim(),

            category: item.category?.trim() || undefined,

            selection: item.selection.trim(),

            style: item.style?.trim() || undefined,

            functionalNeeds: item.functionalNeeds?.trim() || undefined,

            requirementDate: item.requirementDate || undefined,
          }).unwrap(),
        ),
      );

      toast.success(
        `${validRows.length} material ${
          validRows.length === 1 ? "requirement" : "requirements"
        } created successfully.`,
      );

      localStorage.removeItem(SAVE_KEY);

      navigate("/procurement/requirements");
    } catch (error) {
      console.error(error);

      toast.error(
        error?.data?.message || "Failed to create material requirements.",
      );
    }
  };

  const selectedProject = projects.find((project) => project.id === projectId);

  const selectedDesigner = users.find((user) => user.id === values.designerId);

  const filledCount = requirements.filter(
    (item) => item.itemName?.trim() || item.selection?.trim(),
  ).length;

  const missing = [
    !projectId && "project",
    !values.designerId && "designer",
    !filledCount && "at least one material",
  ].filter(Boolean);

  return (
    <Page>
      <PageHeader
        crumbs={[
          { label: "Procurement", to: "/procurement" },
          { label: "Material requirements", to: "/procurement/requirements" },
          { label: "New" },
        ]}
        title="New material requirement"
        subtitle="List what the design needs — procurement raises quotations and prices later."
        actions={
          <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate("/procurement/requirements")}>
            Back to list
          </Button>
        }
      />

      <form
        className="inos-form"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <DocSection step={1} title="Project & designer" description="Who is asking, and for which project.">
          <Grid cols={2}>
            <Field label="Project" required htmlFor="mr-project">
              <SelectInput
                id="mr-project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="Select project"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field label="Designer" required htmlFor="mr-designer" hint="Defaults to you.">
              <SelectInput
                id="mr-designer"
                value={values.designerId}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    designerId: e.target.value,
                  }))
                }
                placeholder="Select designer"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </Grid>
        </DocSection>

        <DocSection
          step={2}
          flush
          title="Materials needed"
          description={
            materialsLoading
              ? "Loading the material master…"
              : materials.length
                ? `Pick from ${materials.length} active materials — name, category, brand and unit fill in. Add the exact selection you want.`
                : "The material master is empty — type the item name, then the exact selection you want."
          }
          actions={
            <Button variant="secondary" size="sm" icon={Plus} onClick={addRequirement}>
              Add item
            </Button>
          }
          footer={
            <>
              <AddRow onClick={addRequirement}>Add item</AddRow>
              <span className="inos-hint tabular">
                {filledCount} of {requirements.length} {requirements.length === 1 ? "line" : "lines"} filled
              </span>
            </>
          }
        >
          <LineTable minWidth={1040}>
            <thead>
              <tr>
                <th>#</th>
                <th style={{ minWidth: 230 }}>Material</th>
                <th style={{ width: 140 }}>Category</th>
                <th style={{ minWidth: 260 }}>Selection / specification *</th>
                <th style={{ width: 130 }}>Style</th>
                <th style={{ width: 150 }}>Required by</th>
                <th style={{ width: 80 }}>Unit</th>
                <th className="actions" aria-label="Row actions" />
              </tr>
            </thead>
            <tbody>
              {requirements.map((item, index) => {
                const incomplete = Boolean(item.itemName?.trim()) !== Boolean(item.selection?.trim());
                return (
                  <React.Fragment key={item.id}>
                    <tr>
                      <td className="cf-idx">{index + 1}</td>
                      <td>
                        <SelectInput
                          value={item.materialId || ""}
                          onChange={(e) => handleMaterialChange(index, e.target.value)}
                          disabled={materialsLoading}
                          placeholder={materialsLoading ? "Loading materials…" : "Select material"}
                          aria-label={`Material line ${index + 1}`}
                        >
                          {materials.map((material) => (
                            <option key={material.id} value={material.id}>
                              {getMaterialName(material)}
                              {material.materialCode ? ` — ${material.materialCode}` : ""}
                            </option>
                          ))}
                        </SelectInput>
                        {!item.materialId && (
                          <TextInput
                            style={{ marginTop: 6 }}
                            value={item.itemName}
                            onChange={(e) => updateRequirement(index, "itemName", e.target.value)}
                            placeholder="…or type an item name"
                            aria-label={`Item name line ${index + 1}`}
                          />
                        )}
                        {item.brand && (
                          <div style={{ marginTop: 6 }}>
                            <Pill tone="brand" size="sm" dot={false}>
                              {item.brand}
                            </Pill>
                          </div>
                        )}
                      </td>
                      <td>
                        <TextInput
                          value={item.category}
                          onChange={(e) => updateRequirement(index, "category", e.target.value)}
                          placeholder="e.g. Flooring"
                        />
                      </td>
                      <td>
                        <TextInput
                          value={item.selection}
                          onChange={(e) => updateRequirement(index, "selection", e.target.value)}
                          placeholder="e.g. Italian Statuario, 18mm, polished"
                          invalid={incomplete && !item.selection?.trim()}
                        />
                        {incomplete && !item.selection?.trim() && (
                          <span className="inos-error" style={{ display: "block", marginTop: 4 }}>
                            Add the selection to save this line.
                          </span>
                        )}
                      </td>
                      <td>
                        <TextInput
                          value={item.style}
                          onChange={(e) => updateRequirement(index, "style", e.target.value)}
                          placeholder="e.g. Modern"
                        />
                      </td>
                      <td>
                        <TextInput
                          type="date"
                          value={item.requirementDate}
                          onChange={(e) => updateRequirement(index, "requirementDate", e.target.value)}
                        />
                      </td>
                      <td style={{ paddingTop: 19, color: item.unit ? "var(--text)" : "var(--text-3)" }}>
                        {item.unit || "—"}
                      </td>
                      <td className="actions">
                        <div style={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                          <IconAction
                            icon={item.expanded ? ChevronUp : ChevronDown}
                            label={item.expanded ? "Hide functional needs" : "Add functional needs"}
                            onClick={() => toggleExpanded(index)}
                          />
                          <IconAction icon={Copy} label="Duplicate line" onClick={() => duplicateRequirement(index)} />
                          <RemoveRow onClick={() => removeRequirement(index)} />
                        </div>
                      </td>
                    </tr>
                    {item.expanded && (
                      <tr className="cf-subrow">
                        <td />
                        <td colSpan={7}>
                          <Field label="Functional needs" optional hint="Installation constraints, compatibility, performance.">
                            <TextArea
                              rows={2}
                              value={item.functionalNeeds}
                              onChange={(e) => updateRequirement(index, "functionalNeeds", e.target.value)}
                              placeholder="e.g. Must suit underfloor heating; anti-skid for wet areas"
                            />
                          </Field>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </LineTable>
        </DocSection>

        {missing.length > 0 && filledCount > 0 && (
          <Callout tone="warn" title="Before saving">
            Add {missing.join(", ")}.
          </Callout>
        )}

        <FormActions
          note="Draft autosaves on this device."
          onCancel={() => navigate("/procurement/requirements")}
          submitLabel={
            filledCount > 1 ? `Save ${filledCount} requirements` : "Save requirement"
          }
          submitting={isLoading}
        />
      </form>
    </Page>
  );
}
