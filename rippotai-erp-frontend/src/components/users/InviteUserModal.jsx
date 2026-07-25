import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";

import {
  useCreateUserMutation,
  useUpdateUserMutation,
} from "../../api/user.api";

import { useGetRolesQuery } from "../../api/rbac.api";

export default function InviteUserModal({ onClose, user }) {
  const isEdit = Boolean(user);

  const {
    data: roles = [],
    isLoading: rolesLoading,
    error: rolesError,
  } = useGetRolesQuery();

  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    phone: user?.phone ?? "",
    job_title: user?.job_title ?? "",
    avatar_url: user?.avatar_url ?? "",
    role_id: user?.role_id ?? user?.role?.id ?? "",
  });

  useEffect(() => {
    if (!isEdit && roles.length && !form.role_id) {
      setForm((prev) => ({
        ...prev,
        role_id: roles[0].id,
      }));
    }
  }, [roles, isEdit]);

  useEffect(() => {
    if (rolesError) {
      toast.error("Failed to load roles.");
    }
  }, [rolesError]);

  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();

  const saving = creating || updating;

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Name is required.");
      return;
    }

    if (!form.email.trim()) {
      toast.error("Email is required.");
      return;
    }

    if (!form.role_id) {
      toast.error("Please select a role.");
      return;
    }

    if (!isEdit && !form.password.trim()) {
      toast.error("Password is required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      job_title: form.job_title.trim() || null,
      avatar_url: form.avatar_url.trim() || null,
      role_id: form.role_id,
    };

    if (form.password.trim()) {
      payload.password = form.password.trim();
    }

    try {
      if (isEdit) {
        await updateUser({
          id: user.id,
          ...payload,
        }).unwrap();

        toast.success("User updated successfully.");
      } else {
        await createUser(payload).unwrap();

        toast.success("User invited successfully.");
      }

      onClose();
    } catch (err) {
      toast.error(
        err?.data?.message || err?.data?.detail || "Something went wrong.",
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-[#6B7B7C] hover:text-black"
        >
          <X size={18} />
        </button>

        <h2 className="text-2xl font-semibold text-[#333333]">
          {isEdit ? "Edit User" : "Invite User"}
        </h2>

        <p className="mt-1 mb-6 text-sm text-[#6B7B7C]">
          {isEdit
            ? "Update the user's information."
            : "Create a new user account."}
        </p>

        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Name */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Full Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="h-11 w-full rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] px-3 outline-none focus:border-[#1F453B]"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1 block text-sm font-medium">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="h-11 w-full rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] px-3 outline-none focus:border-[#1F453B]"
              />
            </div>

            {/* Email */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="h-11 w-full rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] px-3 outline-none focus:border-[#1F453B]"
              />
            </div>

            {/* Password */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Password</label>
              <input
                type="password"
                value={form.password}
                placeholder={
                  isEdit
                    ? "Leave blank to keep current password"
                    : "Enter password"
                }
                onChange={(e) => handleChange("password", e.target.value)}
                className="h-11 w-full rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] px-3 outline-none focus:border-[#1F453B]"
              />
            </div>

            {/* Job Title */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Job Title
              </label>
              <input
                type="text"
                value={form.job_title}
                onChange={(e) => handleChange("job_title", e.target.value)}
                className="h-11 w-full rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] px-3 outline-none focus:border-[#1F453B]"
              />
            </div>

            {/* Role */}
            <div>
              <label className="mb-1 block text-sm font-medium">Role</label>
              <select
                value={form.role_id}
                disabled={rolesLoading}
                onChange={(e) => handleChange("role_id", e.target.value)}
                className="h-11 w-full rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] px-3 outline-none focus:border-[#1F453B]"
              >
                <option value="">Select Role</option>

                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Avatar URL */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Avatar URL
              </label>
              <input
                type="text"
                value={form.avatar_url}
                onChange={(e) => handleChange("avatar_url", e.target.value)}
                placeholder="https://example.com/avatar.png"
                className="h-11 w-full rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] px-3 outline-none focus:border-[#1F453B]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || rolesLoading}
            className="h-11 w-full rounded-lg bg-[#1F453B] font-semibold text-white transition hover:bg-[#17352d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
                ? "Save Changes"
                : "Create User"}
          </button>
        </form>
      </div>
    </div>
  );
}
