import React, { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Camera, Save } from "lucide-react";

export default function ProfileSettings() {
  const { user, updateUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // Field names now match the backend (job_title, avatar_url) so the
  // payload can be sent straight through to updateUser without remapping.
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    job_title: user?.job_title || "",
  });
  const [avatarPreview, setAvatarPreview] = useState(null);

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be 2MB or smaller");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async () => {
    setIsSaving(true);
    try {
      if (!updateUser) {
        throw new Error("updateUser is not available from AuthContext");
      }

      await updateUser({
        ...formData,
        // Only send avatar_url if the person picked a new image; otherwise
        // leave the existing one alone rather than overwriting with null.
        ...(avatarPreview ? { avatar_url: avatarPreview } : {}),
      });
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error("Failed to update profile");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const avatarSrc = avatarPreview || user?.avatar_url || null;

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
