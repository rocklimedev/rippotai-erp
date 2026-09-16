import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import PurchaseOrderForm from "../../components/PurchaseOrderForm";

import { useGetPurchaseOrderQuery } from "../../api/procuerment/purchase-order.api";

import { useGetProjectsQuery } from "../../api/projects/project.api";
import { useGetVendorsQuery } from "../../api/vendors/vendor.api";
import { useGetMaterialsQuery } from "../../api/procuerment/material-master.api";

import { Card, CardContent } from "@/components/ui/card";

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
    <div className="flex min-h-[400px] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-7 w-7 animate-spin" />
        <p className="text-sm">Loading purchase order...</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
 * Error screen
 * ------------------------------------------------------------------ */

function PageError({ message, onBack }) {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center px-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
          <div>
            <h2 className="text-lg font-semibold">
              Unable to load purchase order
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {message ||
                "Something went wrong while loading this purchase order."}
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="rounded-md bg-[#1F453B] px-4 py-2 text-sm font-medium text-white hover:bg-[#17372f]"
          >
            Back to purchase orders
          </button>
        </CardContent>
      </Card>
    </div>
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
    navigate("/materials/purchase-orders");
  };

  const handleSuccess = (response) => {
    /*
     * After save, return to the purchase order list.
     *
     * If you prefer opening the newly created PO detail page,
     * this can instead navigate using response.id.
     */

    navigate("/materials/purchase-orders");
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
    <div
      className="
        relative
        z-0
        flex
        min-h-full
        w-full
        flex-col
        overflow-visible
        bg-background
        pointer-events-auto
      "
    >
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
