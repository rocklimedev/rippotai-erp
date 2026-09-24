import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Camera, Save, Loader2, ShieldCheck } from "lucide-react";

import {
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} from "../../api/users/user.api";

export default function ProfileSettings() {
  const { user, updateUser } = useAuth();

  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();

  const [uploadAvatar, { isLoading: isUploadingAvatar }] =
    useUploadAvatarMutation();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    job_title: user?.job_title || "",
  });

  // ------------------------------------------------------------
  // Keep form values in sync if the authenticated user changes.
  // ------------------------------------------------------------
  useEffect(() => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      job_title: user?.job_title || "",
    });
  }, [user?.id, user?.name, user?.email, user?.phone, user?.job_title]);

  // ------------------------------------------------------------
  // Local optimistic avatar preview.
  // ------------------------------------------------------------
  const [avatarPreview, setAvatarPreview] = useState(null);

  // ------------------------------------------------------------
  // Normalize the user returned by different API endpoints.
  //
  // Login currently returns:
  //
  //   role: "ADMIN"
  //
  // Profile update currently returns:
  //
  //   role: {
  //     id: "...",
  //     name: "ADMIN",
  //     description: "..."
  //   }
  //
  // AuthContext should receive one consistent shape.
  // ------------------------------------------------------------
  const normalizeUser = (updatedUser) => {
    if (!updatedUser) {
      return user;
    }

    const existingRole =
      typeof user?.role === "string"
        ? user.role
        : user?.role?.name || user?.roleName || null;

    const updatedRole =
      typeof updatedUser?.role === "string"
        ? updatedUser.role
        : updatedUser?.role?.name ||
          updatedUser?.roleName ||
          existingRole ||
          null;

    return {
      // Keep everything already present on the authenticated user.
      ...user,

      // Apply the updated profile response.
      ...updatedUser,

      // ----------------------------------------------------------
      // IMPORTANT:
      // Always keep role as a STRING in AuthContext.
      // ----------------------------------------------------------
      role: updatedRole,

      // Keep a consistent roleName as well.
      roleName: updatedRole,

      // Keep both possible role ID naming conventions.
      role_id:
        updatedUser?.role_id ||
        updatedUser?.roleId ||
        updatedUser?.role?.id ||
        user?.role_id ||
        user?.roleId ||
        null,

      roleId:
        updatedUser?.roleId ||
        updatedUser?.role_id ||
        updatedUser?.role?.id ||
        user?.roleId ||
        user?.role_id ||
        null,

      // Don't accidentally remove permissions when the
      // profile endpoint doesn't return them.
      permissions: updatedUser?.permissions ?? user?.permissions ?? [],

      // Preserve admin flags if the profile endpoint
      // doesn't return them.
      is_super_admin:
        updatedUser?.is_super_admin ?? user?.is_super_admin ?? false,

      plan: updatedUser?.plan ?? user?.plan ?? null,
    };
  };

  // ------------------------------------------------------------
  // Input handler
  // ------------------------------------------------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ------------------------------------------------------------
  // Avatar upload
  // ------------------------------------------------------------
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // ----------------------------------------------------------
    // Validate file size.
    // ----------------------------------------------------------
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be 2MB or smaller");
      e.target.value = "";
      return;
    }

    // ----------------------------------------------------------
    // Validate file type.
    // ----------------------------------------------------------
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      e.target.value = "";
      return;
    }

    // ----------------------------------------------------------
    // Show image immediately while upload is processing.
    // ----------------------------------------------------------
    const reader = new FileReader();

    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };

    reader.readAsDataURL(file);

    try {
      const updated = await uploadAvatar({
        id: user?.id,
        file,
      }).unwrap();

      // --------------------------------------------------------
      // Remove local preview after successful upload.
      // --------------------------------------------------------
      setAvatarPreview(null);

      // --------------------------------------------------------
      // Normalize API response before updating AuthContext.
      //
      // This prevents:
      //
      // user.role = { id, name, ... }
      //
      // from replacing:
      //
      // user.role = "ADMIN"
      // --------------------------------------------------------
      const normalizedUser = normalizeUser(updated);

      updateUser?.(normalizedUser);

      toast.success("Profile picture updated");
    } catch (err) {
      setAvatarPreview(null);

      toast.error(
        err?.data?.message ||
          err?.message ||
          "Failed to upload profile picture",
      );

      console.error("Avatar upload error:", err);
    } finally {
      // Allow selecting the same file again.
      e.target.value = "";
    }
  };

  // ------------------------------------------------------------
  // Profile save
  // ------------------------------------------------------------
  const handleProfileSave = async () => {
    if (!user?.id) {
      toast.error("User session not found");
      return;
    }

    try {
      const updated = await updateProfile({
        id: user.id,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        job_title: formData.job_title.trim(),
      }).unwrap();

      // --------------------------------------------------------
      // Normalize response before putting it into AuthContext.
      // --------------------------------------------------------
      const normalizedUser = normalizeUser(updated);

      updateUser?.(normalizedUser);

      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(
        err?.data?.message || err?.message || "Failed to update profile",
      );

      console.error("Profile update error:", err);
    }
  };

  // ------------------------------------------------------------
  // Avatar source
  // ------------------------------------------------------------
  const avatarSrc = avatarPreview || user?.avatar_url || null;

  // ------------------------------------------------------------
  // Role display
  //
  // Supports both:
  //
  //   "ADMIN"
  //
  // and:
  //
  //   { name: "ADMIN" }
  // ------------------------------------------------------------
  const roleName =
    typeof user?.role === "string"
      ? user.role
      : user?.role?.name || user?.roleName || "No role assigned";

  const displayRole = roleName
    ? roleName.replace(/_/g, " ")
    : "No role assigned";

  return (
    <div>
      {/* ------------------------------------------------------ */}
      {/* PAGE TITLE */}
      {/* ------------------------------------------------------ */}

      <h2
        className="text-xl font-semibold mb-6"
        style={{ color: "var(--ink-green)" }}
      >
        Profile Information
      </h2>

      {/* ------------------------------------------------------ */}
      {/* PROFILE PICTURE */}
      {/* ------------------------------------------------------ */}

      <div className="flex items-center gap-6 mb-8">
        <div className="relative">
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-semibold overflow-hidden border-4 border-white shadow"
            style={{
              background: "var(--ink-green)",
              color: "#fff",
            }}
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={user?.name || "Profile"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              (user?.name?.charAt(0) || "?").toUpperCase()
            )}

            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 size={22} className="animate-spin text-white" />
              </div>
            )}
          </div>

          {/* Upload button */}
          <label
            htmlFor="avatar-upload"
            className="absolute -bottom-1 -right-1 bg-white rounded-full p-2 shadow cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <Camera
              size={18}
              style={{
                color: "var(--ink-green)",
              }}
            />
          </label>

          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            disabled={isUploadingAvatar}
            onChange={handleAvatarChange}
          />
        </div>

        <div>
          <p className="font-medium text-[#1F453B]">Profile Picture</p>

          <p className="text-sm text-[#6B7B7C]">
            JPG, PNG or GIF • Maximum 2MB
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------ */}
      {/* PROFILE FIELDS */}
      {/* ------------------------------------------------------ */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium mb-2 text-[#1F453B]">
            Full Name
          </label>

          <input
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full bg-white border border-[rgba(31,69,59,0.2)] rounded-xl px-4 py-3 focus:border-[#1F453B] focus:ring-2 focus:ring-[rgba(31,69,59,0.18)] outline-none text-[15px]"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-2 text-[#1F453B]">
            Email Address
          </label>

          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full bg-white border border-[rgba(31,69,59,0.2)] rounded-xl px-4 py-3 focus:border-[#1F453B] focus:ring-2 focus:ring-[rgba(31,69,59,0.18)] outline-none text-[15px]"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium mb-2 text-[#1F453B]">
            Phone Number
          </label>

          <input
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full bg-white border border-[rgba(31,69,59,0.2)] rounded-xl px-4 py-3 focus:border-[#1F453B] focus:ring-2 focus:ring-[rgba(31,69,59,0.18)] outline-none text-[15px]"
          />
        </div>

        {/* Job Title */}
        <div>
          <label className="block text-sm font-medium mb-2 text-[#1F453B]">
            Job Title
          </label>

          <input
            name="job_title"
            value={formData.job_title}
            onChange={handleInputChange}
            className="w-full bg-white border border-[rgba(31,69,59,0.2)] rounded-xl px-4 py-3 focus:border-[#1F453B] focus:ring-2 focus:ring-[rgba(31,69,59,0.18)] outline-none text-[15px]"
          />
        </div>

        {/* ---------------------------------------------------- */}
        {/* ROLE */}
        {/* ---------------------------------------------------- */}

        <div>
          <label className="block text-sm font-medium mb-2 text-[#1F453B]">
            Role
          </label>

          <div className="w-full bg-[#F3F5F4] border border-[rgba(31,69,59,0.12)] rounded-xl px-4 py-3 text-[15px] text-[#4B5A56] flex items-center gap-2 cursor-not-allowed select-none">
            <ShieldCheck size={16} className="text-[#6B7B7C] shrink-0" />

            <span className="truncate">{displayRole}</span>
          </div>

          <p className="text-xs text-[#8A9694] mt-1.5">
            Contact an administrator to change your role
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------ */}
      {/* SAVE BUTTON */}
      {/* ------------------------------------------------------ */}

      <div className="mt-10 flex justify-end">
        <button
          type="button"
          onClick={handleProfileSave}
          disabled={isSaving}
          className="bg-[#1F453B] hover:bg-[#163229] text-white font-semibold px-8 py-3 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed min-w-[160px] justify-center"
        >
          {isSaving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Save Changes
              <Save size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
