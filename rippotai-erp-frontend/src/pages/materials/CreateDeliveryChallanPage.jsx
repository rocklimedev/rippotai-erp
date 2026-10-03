// src/pages/procurement/DeliveryChallanPage.jsx

import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LoadingBlock } from "@/components/forms/commerce-form-ui";
import DeliveryChallanForm from "../../components/DeliveryChallanForm";

import { useGetProjectsQuery } from "../../api/projects/project.api";
import { useGetVendorsQuery } from "../../api/vendors/vendor.api";
import { useGetMaterialsQuery } from "../../api/procuerment/material-master.api";
import { useGetPurchaseOrdersQuery } from "../../api/procuerment/purchase-order.api";
import { useGetDeliveryChallanQuery } from "../../api/procuerment/delivery-challan.api";

export default function CreateDeliveryChallanPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const { data: projectsData, isLoading: projectsLoading } =
    useGetProjectsQuery();

  const { data: vendorsData, isLoading: vendorsLoading } = useGetVendorsQuery();

  const { data: materialsData, isLoading: materialsLoading } =
    useGetMaterialsQuery({ isActive: true });

  const { data: purchaseOrdersData, isLoading: purchaseOrdersLoading } =
    useGetPurchaseOrdersQuery();

  const { data: challanData, isLoading: challanLoading } =
    useGetDeliveryChallanQuery(id, { skip: !isEditMode });

  // Normalise in case your baseApi wraps responses as { data: [...] }.
  const projects = projectsData?.data ?? projectsData ?? [];
  const vendors = vendorsData?.data ?? vendorsData ?? [];
  const materials = materialsData?.data ?? materialsData ?? [];
  const purchaseOrders = purchaseOrdersData?.data ?? purchaseOrdersData ?? [];

  // TODO: replace with a real sites query if/when one exists.
  const sites = [];

  const isLoadingLookups =
    projectsLoading ||
    vendorsLoading ||
    materialsLoading ||
    purchaseOrdersLoading;

  if (isLoadingLookups || (isEditMode && challanLoading)) {
    return (
      <LoadingBlock label="Loading delivery challan…" />
    );
  }

  const handleDone = () => navigate("/procurement/delivery-challans");

  return (
    <DeliveryChallanForm
      initialData={isEditMode ? (challanData?.data ?? challanData) : null}
      projects={projects}
      sites={sites}
      vendors={vendors}
      materials={materials}
      purchaseOrders={purchaseOrders}
      onSuccess={handleDone}
      onCancel={handleDone}
    />
  );
}
