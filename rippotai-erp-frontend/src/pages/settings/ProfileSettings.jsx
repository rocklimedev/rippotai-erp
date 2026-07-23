import React, { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Camera, Save, Loader2, ShieldCheck } from "lucide-react";
import {
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} from "../../api/user.api";

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

  // Local optimistic preview shown the instant a file is picked, before the
  // upload round-trip resolves.
  const [avatarPreview, setAvatarPreview] = useState(null);

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be 2MB or smaller");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    // Show it immediately while the real upload happens in the background.
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);

    try {
      const updated = await uploadAvatar({ id: user.id, file }).unwrap();
      // Swap the local base64 preview for the real CDN url once it's back,
      // and sync the rest of the app's view of the user (navbar, etc.).
      setAvatarPreview(null);
      updateUser?.(updated);
      toast.success("Profile picture updated");
    } catch (err) {
      setAvatarPreview(null);
      toast.error(err?.data?.message || "Failed to upload profile picture");
      console.error(err);
    } finally {
      // allow re-selecting the same file again later
      e.target.value = "";
    }
  };

  const handleProfileSave = async () => {
    try {
      const updated = await updateProfile({
        id: user.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        job_title: formData.job_title,
      }).unwrap();

      updateUser?.(updated);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update profile");
      console.error(err);
    }
  };

  const avatarSrc = avatarPreview || user?.avatar_url || null;
  // useAuth's user shape returns role as a plain string (e.g. "ADMIN"),
  // not a nested { role: { name } } object - see role_id which is the
  // separate FK, kept out of this form entirely.
  const roleName = user?.role || "No role assigned";

  return (
    <div>
      <h2
        className="text-xl font-semibold mb-6"
        style={{ color: "var(--ink-green)" }}
      >
        Profile Information
      </h2>

      <div className="flex items-center gap-6 mb-8">
        <div className="relative">
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-semibold overflow-hidden border-4 border-white shadow"
            style={{ background: "var(--ink-green)", color: "#fff" }}
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              user?.name?.charAt(0) || "?"
            )}
            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 size={22} className="animate-spin text-white" />
              </div>
            )}
          </div>
          <label
            htmlFor="avatar-upload"
            className="absolute -bottom-1 -right-1 bg-white rounded-full p-2 shadow cursor-pointer hover:bg-gray-100"
          >
            <Camera size={18} style={{ color: "var(--ink-green)" }} />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* Role is assigned by an admin - shown for visibility only, never
            submitted from this form (the backend's self-service profile
            endpoint doesn't even accept role_id, so this is defense in
            depth, not the only safeguard). */}
        <div>
          <label className="block text-sm font-medium mb-2 text-[#1F453B]">
            Role
          </label>
          <div className="w-full bg-[#F3F5F4] border border-[rgba(31,69,59,0.12)] rounded-xl px-4 py-3 text-[15px] text-[#4B5A56] flex items-center gap-2 cursor-not-allowed select-none">
            <ShieldCheck size={16} className="text-[#6B7B7C] shrink-0" />
            {roleName}
          </div>
          <p className="text-xs text-[#8A9694] mt-1.5">
            Contact an administrator to change your role
          </p>
        </div>
      </div>

      <div className="mt-10 flex justify-end">
        <button
          onClick={handleProfileSave}
          disabled={isSaving}
          className="bg-[#1F453B] hover:bg-[#163229] text-white font-semibold px-8 py-3 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-70 min-w-[160px] justify-center"
        >
          {isSaving ? "Saving..." : "Save Changes"}
          {!isSaving && <Save size={18} />}
        </button>
      </div>
    </div>
  );
}
