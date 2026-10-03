import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import PurchaseOrderForm from "../../components/PurchaseOrderForm";

import { useGetPurchaseOrderQuery } from "../../api/procuerment/purchase-order.api";

import { useGetProjectsQuery } from "../../api/projects/project.api";
import { useGetVendorsQuery } from "../../api/vendors/vendor.api";
import { useGetMaterialsQuery } from "../../api/procuerment/material-master.api";

import { Page, Card, Button, EmptyState } from "@/components/inos";
import { LoadingBlock } from "@/components/forms/commerce-form-ui";

/* ------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------ */

const normalizeArray = (value, depth = 0) => {
  if (Array.isArray(value)) return value;

  if (
    depth > 3 ||
    value === null ||
    value === undefined ||
    typeof value !== "object"
  ) {
    return [];
  }

  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value.results)) return value.results;
  if (Array.isArray(value.rows)) return value.rows;

  if (value.data && typeof value.data === "object") {
    const nested = normalizeArray(value.data, depth + 1);

    if (nested.length > 0) {
      return nested;
    }
  }

  if (value.payload && typeof value.payload === "object") {
    const nested = normalizeArray(value.payload, depth + 1);

    if (nested.length > 0) {
      return nested;
    }
  }

  const arrayValues = Object.values(value).filter((entry) =>
    Array.isArray(entry),
  );

  if (arrayValues.length === 1) {
    return arrayValues[0];
  }

  return [];
};

/* ------------------------------------------------------------------
 * Loading screen
 * ------------------------------------------------------------------ */

function PageLoader() {
  return (
    <Page>
      <LoadingBlock label="Loading purchase order…" />
    </Page>
  );
}

function PageError({ message, onBack }) {
  return (
    <Page width="form">
      <Card>
        <EmptyState
          icon={AlertCircle}
          title="Unable to load purchase order"
          text={message || "Something went wrong while loading this purchase order."}
          action={
            <Button variant="primary" onClick={onBack}>
              Back to purchase orders
            </Button>
          }
        />
      </Card>
    </Page>
  );
}

/* ------------------------------------------------------------------
 * Parent Page
 * ------------------------------------------------------------------ */

export default function CreatePurchaseOrderPage() {
  const navigate = useNavigate();

  const { id } = useParams();

  const isEdit = Boolean(id);

  /* ---------------------------------------------------------------
   * Purchase order
   * --------------------------------------------------------------- */

  const {
    data: purchaseOrderData,
    isLoading: purchaseOrderLoading,
    isFetching: purchaseOrderFetching,
    isError: purchaseOrderError,
    error: purchaseOrderErrorData,
  } = useGetPurchaseOrderQuery(id, {
    skip: !isEdit,
  });

  /* ---------------------------------------------------------------
   * Supporting data
   *
   * These are loaded here instead of making the form responsible
   * for the parent page's data lifecycle.
   * --------------------------------------------------------------- */

  const { data: projectsData, isFetching: projectsFetching } =
    useGetProjectsQuery({});

  const { data: vendorsData, isFetching: vendorsFetching } = useGetVendorsQuery(
    {},
  );

  const { data: materialsData, isFetching: materialsFetching } =
    useGetMaterialsQuery({
      isActive: true,
    });

  /* ---------------------------------------------------------------
   * Normalize API responses
   * --------------------------------------------------------------- */

  const projects = useMemo(() => normalizeArray(projectsData), [projectsData]);

  const vendors = useMemo(() => normalizeArray(vendorsData), [vendorsData]);

  const materials = useMemo(
    () => normalizeArray(materialsData),
    [materialsData],
  );

  /* ---------------------------------------------------------------
   * Normalize purchase order response
   *
   * Supports:
   *   PO
   *   { data: PO }
   *   { data: { data: PO } }
   * --------------------------------------------------------------- */

  const purchaseOrder = useMemo(() => {
    if (!purchaseOrderData) {
      return null;
    }

    if (purchaseOrderData?.data && !Array.isArray(purchaseOrderData.data)) {
      if (purchaseOrderData.data?.data) {
        return purchaseOrderData.data.data;
      }

      return purchaseOrderData.data;
    }

    return purchaseOrderData;
  }, [purchaseOrderData]);

  /* ---------------------------------------------------------------
   * Purchase order items
   * --------------------------------------------------------------- */

  const purchaseOrderItems = useMemo(() => {
    if (!purchaseOrder) {
      return [];
    }

    return normalizeArray(
      purchaseOrder.items ||
        purchaseOrder.purchaseOrderItems ||
        purchaseOrder.purchase_order_items ||
        [],
    );
  }, [purchaseOrder]);

  /* ---------------------------------------------------------------
   * Navigation
   * --------------------------------------------------------------- */

  const handleCancel = () => {
    navigate("/procurement/purchase-orders");
  };

  const handleSuccess = (response) => {
    /*
     * After save, return to the purchase order list.
     *
     * If you prefer opening the newly created PO detail page,
     * this can instead navigate using response.id.
     */

    navigate("/procurement/purchase-orders");
  };

  /* ---------------------------------------------------------------
   * Loading state
   * --------------------------------------------------------------- */

  if (isEdit && (purchaseOrderLoading || purchaseOrderFetching)) {
    return <PageLoader />;
  }

  /* ---------------------------------------------------------------
   * Error state
   * --------------------------------------------------------------- */

  if (isEdit && purchaseOrderError) {
    return (
      <PageError
        onBack={handleCancel}
        message={
          purchaseOrderErrorData?.data?.message ||
          purchaseOrderErrorData?.message ||
          "The purchase order could not be loaded."
        }
      />
    );
  }

  /* ---------------------------------------------------------------
   * Edit mode but no record
   * --------------------------------------------------------------- */

  if (isEdit && !purchaseOrder) {
    return (
      <PageError
        onBack={handleCancel}
        message="The requested purchase order was not found."
      />
    );
  }

  /* ---------------------------------------------------------------
   * Render
   * --------------------------------------------------------------- */

  return (
    <div className="relative w-full">
      <PurchaseOrderForm
        initialData={isEdit ? purchaseOrder : null}
        projects={projects}
        vendors={vendors}
        materials={materials}
        /*
         * Site / quotation / estimate / BOQ data can be supplied
         * later from their respective endpoints.
         *
         * Keep these arrays defined so the child form always receives
         * stable values.
         */
        sites={[]}
        quotations={[]}
        estimates={[]}
        boqs={[]}
        purchaseOrderItems={purchaseOrderItems}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
