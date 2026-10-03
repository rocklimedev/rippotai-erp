import React, { useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { ArrowLeft, CheckCircle2, Plus } from "lucide-react";
import { Page, PageHeader, Button, Field, TextInput, SelectInput, TextArea, FormActions } from "@/components/inos";
import { DocSection, Grid, Modal, LoadingBlock } from "@/components/forms/commerce-form-ui";
import {
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useGetVendorByIdQuery,
  useSetVendorStatusMutation,
  useGetVendorCategoriesQuery,
  useGetBusinessTypesQuery,
  useCreateBusinessTypeMutation,
} from "../../api/vendors/vendor.api"; // adjust this import path to wherever vendorsApi is actually exported from

// Only fields that exist on the Vendor model are collected here.
const initialForm = {
  name: "",
  company_name: "",
  position: "",
  vendor_category_id: "",
  business_type_id: "",
  contact_number: "",
  alternate_contact: "",
  address: "",
  notes: "",
};

// Strips the form state down to exactly the columns the Vendor model accepts,
// so we never send fields the backend will just ignore.
function toPayload(form) {
  return {
    name: form.name,
    company_name: form.company_name || null,
    position: form.position || null,
    vendor_category_id: form.vendor_category_id || null,
    business_type_id: form.business_type_id || null,
    contact_number: form.contact_number,
    alternate_contact: form.alternate_contact || null,
    address: form.address || null,
    notes: form.notes || null,
  };
}

export default function VendorNew() {
  const nav = useNavigate();
  const { id: routeVendorId } = useParams(); // present on /vendors/:id/edit, absent on /vendors/new
  const isEdit = Boolean(routeVendorId);

  const [vendorId, setVendorId] = useState(routeVendorId || null);
  const [form, setForm] = useState(initialForm);
  const [hydrated, setHydrated] = useState(false);
  const [errors, setErrors] = useState({});
  const [isBusinessTypeModalOpen, setBusinessTypeModalOpen] = useState(false);
  const [newBusinessTypeName, setNewBusinessTypeName] = useState("");
  const [businessTypeError, setBusinessTypeError] = useState("");

  // Guards against the hydration-triggered form update firing an
  // immediate autosave PATCH of data we just loaded from the server.
  const suppressAutosave = useRef(false);

  const [createVendor, { isLoading: creating }] = useCreateVendorMutation();
  const [updateVendor, { isLoading: updating }] = useUpdateVendorMutation();
  const [setVendorStatus, { isLoading: activating }] =
    useSetVendorStatusMutation();
  const [createBusinessType, { isLoading: creatingBusinessType }] =
    useCreateBusinessTypeMutation();
  const saving = creating || updating;

  const {
    data: vendor,
    isFetching: vendorLoading,
    isError: vendorError,
  } = useGetVendorByIdQuery(routeVendorId, { skip: !isEdit });

  const { data: categories = [] } = useGetVendorCategoriesQuery();
  const { data: businessTypes = [] } = useGetBusinessTypesQuery(
    form.vendor_category_id,
    { skip: !form.vendor_category_id },
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const setCategory = (categoryId) => {
    setForm((f) => ({
      ...f,
      vendor_category_id: categoryId,
      business_type_id: "", // dependent field, reset on category change
    }));
  };

  const persist = useCallback(async () => {
    const payload = toPayload(form);
    try {
      if (!vendorId) {
        const result = await createVendor(payload).unwrap();
        setVendorId(result.id);
      } else {
        await updateVendor({ id: vendorId, ...payload }).unwrap();
      }
    } catch {
      toast.error("Autosave failed");
    }
  }, [form, vendorId, createVendor, updateVendor]);

  const debouncedPersist = useDebouncedCallback(persist, 800);

  const openBusinessTypeModal = () => {
    setNewBusinessTypeName("");
    setBusinessTypeError("");
    setBusinessTypeModalOpen(true);
  };

  const closeBusinessTypeModal = () => {
    setBusinessTypeModalOpen(false);
  };

  const handleCreateBusinessType = async () => {
    if (!newBusinessTypeName.trim()) {
      setBusinessTypeError("Please enter a name");
      return;
    }
    try {
      const result = await createBusinessType({
        category_id: form.vendor_category_id,
        name: newBusinessTypeName.trim(),
      }).unwrap();
      set("business_type_id", result.id);
      toast.success("Business type created");
      setBusinessTypeModalOpen(false);
    } catch {
      toast.error("Failed to create business type");
    }
  };

  useEffect(() => {
    if (!isEdit || !vendor || hydrated) return;
    setForm({
      name: vendor.name || "",
      company_name: vendor.company_name || "",
      position: vendor.position || "",
      vendor_category_id:
        vendor.vendor_category_id || vendor.vendor_category?.id || "",
      business_type_id:
        vendor.business_type_id || vendor.business_type?.id || "",
      contact_number: vendor.contact_number || "",
      alternate_contact: vendor.alternate_contact || "",
      address: vendor.address || "",
      notes: vendor.notes || "",
    });
    setVendorId(vendor.id);
    suppressAutosave.current = true;
    setHydrated(true);
  }, [isEdit, vendor, hydrated]);

  useEffect(() => {
    if (vendorError) toast.error("Failed to load vendor");
  }, [vendorError]);

  useEffect(() => {
    if (suppressAutosave.current) {
      suppressAutosave.current = false;
      return;
    }
    if (form.name || form.company_name) debouncedPersist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const validate = () => {
    const next = {};
    if (!form.name) next.name = "Please enter the vendor's name";
    if (!form.contact_number)
      next.contact_number = "Please enter a contact number";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) {
      toast.error("Please fill in the required fields");
      return;
    }
    await persist();
    if (!vendorId) {
      toast.error("Please fill vendor details first");
      return;
    }
    try {
      await setVendorStatus({ id: vendorId, status: "active" }).unwrap();
      toast.success("Vendor saved");
      nav(`/vendors/${vendorId}`);
    } catch {
      toast.error("Failed to activate vendor");
    }
  };

  if (isEdit && vendorLoading && !hydrated) {
    return (
      <Page width="form">
        <div data-testid="vendor-new-form">
          <LoadingBlock label="Loading vendor…" />
        </div>
      </Page>
    );
  }

  const backTarget = isEdit ? `/vendors/${vendorId}` : "/vendors";
  const categoryName = categories.find((c) => c.id === form.vendor_category_id)?.name;

  return (
    <Page width="form">
      <div data-testid="vendor-new-form" style={{ display: "contents" }}>
        <PageHeader
          crumbs={[
            { label: "Procurement", to: "/procurement" },
            { label: "Vendors", to: "/procurement/vendors/directory" },
            { label: isEdit ? "Edit" : "New" },
          ]}
          title={isEdit ? `Edit ${form.company_name || form.name || "vendor"}` : "New vendor"}
          subtitle="Name and contact number are all you need — the rest can be filled in any time."
          actions={
            <Button variant="ghost" icon={ArrowLeft} onClick={() => nav(backTarget)}>
              {isEdit ? "Back to vendor" : "Back to vendors"}
            </Button>
          }
        />

        <form
          className="inos-form"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <DocSection step={1} title="Who they are" description="The person you deal with and their company.">
            <Grid cols={2}>
              <Field label="Name" required error={errors.name} htmlFor="w-name">
                <TextInput
                  id="w-name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Rakesh Gupta"
                  invalid={Boolean(errors.name)}
                  data-testid="w-name"
                />
              </Field>
              <Field label="Company name" optional htmlFor="w-company">
                <TextInput
                  id="w-company"
                  value={form.company_name}
                  onChange={(e) => set("company_name", e.target.value)}
                  placeholder="e.g. Shree Tiles & Co."
                  data-testid="w-company"
                />
              </Field>
              <Field label="Position" optional full htmlFor="w-position">
                <TextInput
                  id="w-position"
                  value={form.position}
                  onChange={(e) => set("position", e.target.value)}
                  placeholder="e.g. Proprietor, Sales manager"
                  data-testid="w-position"
                />
              </Field>
            </Grid>
          </DocSection>

          <DocSection step={2} title="What they supply" description="Used to filter vendors when raising quotations.">
            <Grid cols={2}>
              <Field label="Vendor category" htmlFor="w-cat">
                <SelectInput
                  id="w-cat"
                  value={form.vendor_category_id}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Select category"
                  data-testid="w-vendor-category"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field
                label="Business type"
                htmlFor="w-bt"
                hint={form.vendor_category_id ? "Missing one? Add it with the + button." : "Pick a category first."}
              >
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <SelectInput
                      id="w-bt"
                      value={form.business_type_id}
                      onChange={(e) => set("business_type_id", e.target.value)}
                      disabled={!form.vendor_category_id}
                      placeholder={form.vendor_category_id ? "Select business type" : "Select a category first"}
                      data-testid="w-business-type"
                    >
                      {businessTypes.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </SelectInput>
                  </div>
                  <Button
                    variant="secondary"
                    icon={Plus}
                    onClick={openBusinessTypeModal}
                    disabled={!form.vendor_category_id}
                    aria-label="Add business type"
                    title="Add business type"
                    data-testid="w-business-type-add"
                  />
                </div>
              </Field>
            </Grid>
          </DocSection>

          <DocSection step={3} title="Contact" description="How your team reaches them.">
            <Grid cols={2}>
              <Field label="Contact number" required error={errors.contact_number} htmlFor="w-phone">
                <TextInput
                  id="w-phone"
                  type="tel"
                  value={form.contact_number}
                  onChange={(e) => set("contact_number", e.target.value)}
                  placeholder="e.g. +91 98100 12345"
                  invalid={Boolean(errors.contact_number)}
                  data-testid="w-contact-number"
                />
              </Field>
              <Field label="Alternate contact" optional htmlFor="w-alt">
                <TextInput
                  id="w-alt"
                  type="tel"
                  value={form.alternate_contact}
                  onChange={(e) => set("alternate_contact", e.target.value)}
                  placeholder="Another number or email"
                  data-testid="w-alt-contact"
                />
              </Field>
              <Field label="Address" optional full htmlFor="w-address">
                <TextArea
                  id="w-address"
                  rows={2}
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="Shop / warehouse address"
                  data-testid="w-address"
                />
              </Field>
              <Field label="Notes" optional full htmlFor="w-notes" hint="Payment terms, lead times, anything worth remembering.">
                <TextArea
                  id="w-notes"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  data-testid="w-notes"
                />
              </Field>
            </Grid>
          </DocSection>

          <div className="inos-form-actions">
            <span className="inos-form-actions__note">
              {saving ? "Saving…" : vendorId ? "All changes auto-saved as a draft" : "Changes auto-save once you enter a name"}
            </span>
            <div className="inos-form-actions__buttons">
              <Button variant="ghost" onClick={() => nav(backTarget)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" iconRight={CheckCircle2} disabled={activating} data-testid="form-submit">
                Save vendor
              </Button>
            </div>
          </div>
        </form>

        {isBusinessTypeModalOpen && (
          <Modal
            title="New business type"
            subtitle={categoryName ? `Under ${categoryName}` : undefined}
            onClose={closeBusinessTypeModal}
            testId="business-type-modal"
            closeTestId="business-type-modal-close"
            footer={
              <>
                <Button variant="ghost" onClick={closeBusinessTypeModal} data-testid="business-type-cancel">
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateBusinessType}
                  disabled={creatingBusinessType}
                  data-testid="business-type-save"
                >
                  {creatingBusinessType ? "Saving…" : "Create"}
                </Button>
              </>
            }
          >
            <Field label="Name" required error={businessTypeError}>
              <TextInput
                value={newBusinessTypeName}
                onChange={(e) => {
                  setNewBusinessTypeName(e.target.value);
                  if (businessTypeError) setBusinessTypeError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateBusinessType();
                  }
                }}
                placeholder="e.g. Marble supplier"
                autoFocus
                invalid={Boolean(businessTypeError)}
                data-testid="business-type-name-input"
              />
            </Field>
          </Modal>
        )}
      </div>
    </Page>
  );
}
