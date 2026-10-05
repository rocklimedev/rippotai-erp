// src/pages/procurement/material-master/MaterialMasterCreateEdit.jsx

import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { Shell } from "../../hooks/shared";

import { useGetMaterialQuery } from "../../api/procuerment/material-master.api";

import CreateMaterialForm from "../../components/CreateMaterialForm";

export default function MaterialMasterCreateEdit() {
  const nav = useNavigate();
  const { id } = useParams();

  const isEdit = Boolean(id);

  const { data, isLoading, isFetching, error } = useGetMaterialQuery(id, {
    skip: !isEdit,
  });

  const material = data?.data || data?.material || data || null;

  if (isEdit && (isLoading || isFetching)) {
    return (
      <Shell title="Edit Material" subtitle="Loading material details...">
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading material...
          </div>
        </div>
      </Shell>
    );
  }

  if (isEdit && error) {
    return (
      <Shell title="Edit Material" subtitle="Unable to load material">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
          <p className="font-medium text-destructive">
            Failed to load material.
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            The material may have been deleted or you may not have permission to
            access it.
          </p>

          <button
            type="button"
            className="mt-4 text-sm font-medium underline"
            onClick={() => nav("/procurement")}
          >
            Back to Material Master
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      title={isEdit ? "Edit Material" : "New Material"}
      subtitle={
        isEdit
          ? `Update ${material?.name || "material"}`
          : "Create a new material master record"
      }
    >
      <CreateMaterialForm
        material={material}
        mode={isEdit ? "edit" : "create"}
        onSuccess={(savedMaterial) => {
          const materialId = savedMaterial?.id || material?.id;

          if (materialId) {
            nav(`/procurement/${materialId}`);
          } else {
            nav("/procurement");
          }
        }}
      />
    </Shell>
  );
}
