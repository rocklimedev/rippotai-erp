import React, { useEffect, useState } from "react";
import { X, Save } from "lucide-react";
import { toast } from "sonner";

import {
  useCreateClientMutation,
  useUpdateClientMutation,
} from "../../api/client.api";

export default function ClientModal({ client, onClose }) {
  const isEdit = !!client;

  const [createClient, { isLoading: creating }] = useCreateClientMutation();

  const [updateClient, { isLoading: updating }] = useUpdateClientMutation();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company_name: "",
  });

  useEffect(() => {
    if (client) {
      setForm({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || client.mobile || "",
        company_name: client.company_name || client.company || "",
      });
    } else {
      setForm({
        name: "",
        email: "",
        phone: "",
        company_name: "",
      });
    }
  }, [client]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Client name is required");
      return;
    }

    try {
      if (isEdit) {
        await updateClient({
          id: client.id,
          name: form.name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          company_name: form.company_name.trim() || null,
        }).unwrap();

        toast.success("Client updated successfully");
      } else {
        await createClient({
          name: form.name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          company_name: form.company_name.trim() || null,
        }).unwrap();

        toast.success("Client created successfully");
      }

      onClose();
    } catch (error) {
      toast.error(
        error?.data?.detail ||
          error?.data?.message ||
          `Failed to ${isEdit ? "update" : "create"} client`,
      );
    }
  };

  const saving = creating || updating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={saving ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8EAF0]">
          <div>
            <h2 className="text-lg font-semibold text-[#333333]">
              {isEdit ? "Edit Client" : "Add Client"}
            </h2>

            <p className="text-sm text-[#6B7B7C] mt-0.5">
              {isEdit
                ? "Update client information."
                : "Create a new client account."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6B7B7C] hover:bg-[#F3F3F1] disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            {/* Client Name */}
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1.5">
                Client Name
                <span className="text-red-500 ml-1">*</span>
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter client name"
                autoFocus
                className="w-full h-10 px-3 rounded-lg border border-[#D9DDE5] bg-white text-sm text-[#333333] outline-none focus:border-[#1F453B] focus:ring-1 focus:ring-[#1F453B]"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1.5">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="client@example.com"
                className="w-full h-10 px-3 rounded-lg border border-[#D9DDE5] bg-white text-sm text-[#333333] outline-none focus:border-[#1F453B] focus:ring-1 focus:ring-[#1F453B]"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1.5">
                Phone
              </label>

              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                className="w-full h-10 px-3 rounded-lg border border-[#D9DDE5] bg-white text-sm text-[#333333] outline-none focus:border-[#1F453B] focus:ring-1 focus:ring-[#1F453B]"
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1.5">
                Company
              </label>

              <input
                type="text"
                name="company_name"
                value={form.company_name}
                onChange={handleChange}
                placeholder="Company name"
                className="w-full h-10 px-3 rounded-lg border border-[#D9DDE5] bg-white text-sm text-[#333333] outline-none focus:border-[#1F453B] focus:ring-1 focus:ring-[#1F453B]"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#FAF8F5] border-t border-[#E8EAF0]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-10 px-4 rounded-lg border border-[#D9DDE5] bg-white text-sm font-medium text-[#333333] hover:bg-[#F3F3F1] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
              style={{ backgroundColor: "#1F453B" }}
            >
              <Save size={15} />

              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
