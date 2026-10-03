import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, UserPlus, UserCog } from "lucide-react";

import {
  useCreateUserMutation,
  useUpdateUserMutation,
} from "../../api/users/user.api";

import { useGetRolesQuery } from "../../api/users/rbac.api";
import { Field, TextInput, SelectInput, ChoiceGroup, Button } from "@/components/inos";
import { AdminModal, ModalActions, humanize } from "@/pages/settings/_admin-ui";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isEdit && roles.length && !form.role_id) {
      // Default new people to the everyday internal role when it exists.
      const preferred = roles.find((r) => String(r.name).toUpperCase() === "USER") || roles[0];
      setForm((prev) => ({
        ...prev,
        role_id: preferred.id,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Enter the person's full name.";
    if (!form.email.trim()) next.email = "Email is required — it's their sign-in.";
    else if (!EMAIL_RE.test(form.email.trim())) next.email = "That doesn't look like an email address.";
    if (!form.role_id) next.role_id = "Pick a role.";
    if (!isEdit && !form.password.trim()) next.password = "Set a temporary password.";
    else if (form.password.trim() && form.password.trim().length < 8) next.password = "Use at least 8 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

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

  const selectedRole = roles.find((r) => r.id === form.role_id);

  return (
    <AdminModal
      as="form"
      onSubmit={submit}
      onClose={onClose}
      busy={saving}
      icon={isEdit ? UserCog : UserPlus}
      title={isEdit ? "Edit user" : "Invite user"}
      subtitle={
        isEdit
          ? `Update ${user?.name || "this person"}'s details and role.`
          : "They'll sign in with this email and the temporary password you set."
      }
      width={600}
      testId="invite-user-modal"
      footer={
        <ModalActions
          onCancel={onClose}
          submitting={saving}
          submittingLabel={isEdit ? "Saving…" : "Creating…"}
          submitLabel={isEdit ? "Save changes" : "Create user"}
          disabled={rolesLoading}
        />
      }
    >
      <div className="inos-form-grid">
        <Field label="Full name" required error={errors.name} full htmlFor="iu-name">
          <TextInput
            id="iu-name"
            autoFocus
            value={form.name}
            invalid={!!errors.name}
            placeholder="e.g. Priya Sharma"
            onChange={(e) => handleChange("name", e.target.value)}
          />
        </Field>

        <Field label="Work email" required error={errors.email} full htmlFor="iu-email">
          <TextInput
            id="iu-email"
            type="email"
            autoComplete="off"
            value={form.email}
            invalid={!!errors.email}
            placeholder="priya@rippotai.in"
            onChange={(e) => handleChange("email", e.target.value)}
          />
        </Field>

        <Field
          label="Role"
          required
          full
          error={errors.role_id}
          hint={selectedRole?.description || "Controls which apps and actions they can use."}
        >
          {rolesLoading ? (
            <SelectInput disabled placeholder="Loading roles…" />
          ) : roles.length > 0 && roles.length <= 6 ? (
            <ChoiceGroup
              name="Role"
              value={form.role_id}
              onChange={(v) => handleChange("role_id", v)}
              options={roles.map((r) => ({ value: r.id, label: humanize(r.name) }))}
            />
          ) : (
            <SelectInput
              value={form.role_id}
              invalid={!!errors.role_id}
              onChange={(e) => handleChange("role_id", e.target.value)}
              placeholder="Select a role"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {humanize(role.name)}
                </option>
              ))}
            </SelectInput>
          )}
        </Field>

        <Field
          label={isEdit ? "New password" : "Temporary password"}
          required={!isEdit}
          optional={isEdit}
          full
          htmlFor="iu-pass"
          error={errors.password}
          hint={isEdit ? "Leave blank to keep their current password." : "At least 8 characters. Share it privately — they can change it later."}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <TextInput
              id="iu-pass"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.password}
              invalid={!!errors.password}
              placeholder={isEdit ? "••••••••" : "Min. 8 characters"}
              onChange={(e) => handleChange("password", e.target.value)}
            />
            <Button
              variant="secondary"
              icon={showPassword ? EyeOff : Eye}
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              style={{ height: 40, width: 40 }}
            />
          </div>
        </Field>

        <Field label="Phone" optional htmlFor="iu-phone">
          <TextInput
            id="iu-phone"
            type="tel"
            value={form.phone}
            placeholder="+91 98100 00000"
            onChange={(e) => handleChange("phone", e.target.value)}
          />
        </Field>

        <Field label="Job title" optional htmlFor="iu-title">
          <TextInput
            id="iu-title"
            value={form.job_title}
            placeholder="e.g. Site engineer"
            onChange={(e) => handleChange("job_title", e.target.value)}
          />
        </Field>

        <Field label="Photo URL" optional full htmlFor="iu-avatar" hint="Link to a square image. Initials are used when empty.">
          <TextInput
            id="iu-avatar"
            type="url"
            value={form.avatar_url}
            onChange={(e) => handleChange("avatar_url", e.target.value)}
            placeholder="https://…/photo.jpg"
          />
        </Field>
      </div>
    </AdminModal>
  );
}
