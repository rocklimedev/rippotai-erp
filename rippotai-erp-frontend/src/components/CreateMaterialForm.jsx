// src/pages/procurement/material-master/CreateMaterialForm.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

import {
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
} from "../api/procuerment/material-master.api";

const EMPTY_FORM = {
  material_code: "",
  name: "",
  category: "",
  sub_category: "",
  brand: "",
  model: "",
  unit_id: "",
  description: "",
  is_active: true,
};

export default function CreateMaterialForm({
  material = null,
  mode = "create",
  onSuccess,
}) {
  const nav = useNavigate();

  const [createMaterial, { isLoading: isCreating }] =
    useCreateMaterialMutation();

  const [updateMaterial, { isLoading: isUpdating }] =
    useUpdateMaterialMutation();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const isEdit = mode === "edit" || Boolean(material);
  const isSaving = isCreating || isUpdating;

  // ============================================================
  // INITIALIZE FORM
  // ============================================================

  useEffect(() => {
    if (!material) {
      setForm(EMPTY_FORM);
      return;
    }

    setForm({
      material_code: material.material_code || "",
      name: material.name || "",
      category: material.category || "",
      sub_category: material.sub_category || "",
      brand: material.brand || "",
      model: material.model || "",
      unit_id: material.unit_id || material.unit?.id || "",
      description: material.description || "",
      is_active:
        material.is_active === undefined ? true : Boolean(material.is_active),
    });
  }, [material]);

  // ============================================================
  // HELPERS
  // ============================================================

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Material name is required.";
    }

    if (!form.category.trim()) {
      nextErrors.category = "Category is required.";
    }

    if (!form.unit_id.trim()) {
      nextErrors.unit_id = "Unit is required.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = () => {
    return {
      material_code: form.material_code.trim() || undefined,
      name: form.name.trim(),
      category: form.category.trim(),
      sub_category: form.sub_category.trim() || undefined,
      brand: form.brand.trim() || undefined,
      model: form.model.trim() || undefined,
      unit_id: form.unit_id.trim(),
      description: form.description.trim() || undefined,
      is_active: Boolean(form.is_active),
    };
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      const payload = buildPayload();

      let result;

      if (isEdit) {
        result = await updateMaterial({
          id: material.id,
          ...payload,
        }).unwrap();
      } else {
        result = await createMaterial(payload).unwrap();
      }

      const savedMaterial = result?.data || result?.material || result;

      if (onSuccess) {
        onSuccess(savedMaterial);
        return;
      }

      const materialId = savedMaterial?.id || material?.id;

      if (materialId) {
        nav(`/procurement/${materialId}`);
      } else {
        nav("/procurement");
      }
    } catch (error) {
      console.error("Failed to save material:", error);

      const message =
        error?.data?.message ||
        error?.data?.error ||
        error?.message ||
        "Failed to save material.";

      setErrors((current) => ({
        ...current,
        form: Array.isArray(message) ? message.join(", ") : String(message),
      }));
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ======================================================
          HEADER ACTIONS
      ====================================================== */}

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() =>
            material?.id
              ? nav(`/procurement/${material.id}`)
              : nav("/procurement")
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() =>
              material?.id
                ? nav(`/procurement/${material.id}`)
                : nav("/procurement")
            }
          >
            Cancel
          </Button>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEdit ? "Update Material" : "Create Material"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ======================================================
          FORM ERROR
      ====================================================== */}

      {errors.form && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {errors.form}
        </div>
      )}

      {/* ======================================================
          BASIC INFORMATION
      ====================================================== */}

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-5 md:grid-cols-2">
          {/* MATERIAL CODE */}

          <div className="space-y-2">
            <Label htmlFor="material_code">Material Code</Label>

            <Input
              id="material_code"
              value={form.material_code}
              onChange={(e) => updateField("material_code", e.target.value)}
              placeholder="e.g. MAT-001"
            />
          </div>

          {/* MATERIAL NAME */}

          <div className="space-y-2">
            <Label htmlFor="name">
              Material Name <span className="text-destructive">*</span>
            </Label>

            <Input
              id="name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g. Italian Marble"
              className={errors.name ? "border-destructive" : ""}
            />

            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          {/* CATEGORY */}

          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-destructive">*</span>
            </Label>

            <Input
              id="category"
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              placeholder="e.g. Flooring"
              className={errors.category ? "border-destructive" : ""}
            />

            {errors.category && (
              <p className="text-xs text-destructive">{errors.category}</p>
            )}
          </div>

          {/* SUB CATEGORY */}

          <div className="space-y-2">
            <Label htmlFor="sub_category">Sub Category</Label>

            <Input
              id="sub_category"
              value={form.sub_category}
              onChange={(e) => updateField("sub_category", e.target.value)}
              placeholder="e.g. Marble"
            />
          </div>
        </CardContent>
      </Card>

      {/* ======================================================
          PRODUCT DETAILS
      ====================================================== */}

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-5 md:grid-cols-2">
          {/* BRAND */}

          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>

            <Input
              id="brand"
              value={form.brand}
              onChange={(e) => updateField("brand", e.target.value)}
              placeholder="e.g. Kajaria"
            />
          </div>

          {/* MODEL */}

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>

            <Input
              id="model"
              value={form.model}
              onChange={(e) => updateField("model", e.target.value)}
              placeholder="e.g. KJ-120"
            />
          </div>

          {/* UNIT */}

          <div className="space-y-2">
            <Label htmlFor="unit_id">
              Unit ID <span className="text-destructive">*</span>
            </Label>

            <Input
              id="unit_id"
              value={form.unit_id}
              onChange={(e) => updateField("unit_id", e.target.value)}
              placeholder="Unit UUID"
              className={errors.unit_id ? "border-destructive" : ""}
            />

            {errors.unit_id && (
              <p className="text-xs text-destructive">{errors.unit_id}</p>
            )}

            <p className="text-xs text-muted-foreground">
              Enter the Unit Master ID associated with this material.
            </p>
          </div>

          {/* STATUS */}

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="is_active">Active Material</Label>

              <p className="mt-1 text-xs text-muted-foreground">
                Inactive materials will not be available for new procurement
                operations.
              </p>
            </div>

            <Switch
              id="is_active"
              checked={form.is_active}
              onCheckedChange={(value) => updateField("is_active", value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* ======================================================
          DESCRIPTION
      ====================================================== */}

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>

        <CardContent>
          <Textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Add material specifications, notes, procurement information, etc."
            rows={5}
          />
        </CardContent>
      </Card>

      {/* ======================================================
          BOTTOM ACTIONS
      ====================================================== */}

      <div className="flex justify-end gap-2 border-t pt-5">
        <Button
          type="button"
          variant="outline"
          disabled={isSaving}
          onClick={() =>
            material?.id
              ? nav(`/procurement/${material.id}`)
              : nav("/procurement")
          }
        >
          Cancel
        </Button>

        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {isEdit ? "Update Material" : "Create Material"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
