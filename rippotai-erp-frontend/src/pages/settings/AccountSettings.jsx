import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Camera, Save, User, Shield, Bell, CreditCard } from "lucide-react";

const sidebarItems = [
  { id: "profile", label: "Edit Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "estimate-signature", label: "Estimate Signature", icon: CreditCard },
  { id: "super-admin", label: "Super Admin", icon: CreditCard },
  { id: "role-permissions", label: "Role & Permissions", icon: CreditCard },
  { id: "users", label: "Users", icon: CreditCard },
];

export default function AccountSettings() {
  const { user, updateUser } = useAuth();

  const [activeSection, setActiveSection] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);

  // Profile Form State
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    jobTitle: user?.jobTitle || "",
  });

  const [avatarPreview, setAvatarPreview] = useState(null);

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (updateUser) {
        await updateUser(formData);
      }
      // You can show success toast here using sonner
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1
          className="text-3xl font-semibold"
          style={{ color: "var(--ink-green)" }}
        >
          Account Settings
        </h1>
        <p className="text-[#6B7B7C] mt-1">
          Manage your account preferences and profile
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-[rgba(31,69,59,0.14)] rounded-3xl p-2 shadow-sm">
            <nav className="space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all ${
                      isActive
                        ? "bg-[#1F453B] text-white"
                        : "hover:bg-[#F4F6F7] text-[#1F453B]"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9">
          <div className="bg-white border border-[rgba(31,69,59,0.14)] rounded-3xl p-8 shadow-sm">
            {/* ==================== EDIT PROFILE ==================== */}
            {activeSection === "profile" && (
              <div>
                <h2
                  className="text-xl font-semibold mb-6"
                  style={{ color: "var(--ink-green)" }}
                >
                  Profile Information
                </h2>

                {/* Avatar Section */}
                <div className="flex items-center gap-6 mb-8">
                  <div className="relative">
                    <div
                      className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-semibold overflow-hidden border-4 border-white shadow"
                      style={{ background: "var(--ink-green)", color: "#fff" }}
                    >
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user?.avatar_initials || user?.name?.charAt(0) || "?"
                      )}
                    </div>

                    <label
                      htmlFor="avatar-upload"
                      className="absolute -bottom-1 -right-1 bg-white rounded-full p-2 shadow cursor-pointer hover:bg-gray-100 transition-colors"
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
                    <p className="font-medium text-[#1F453B]">
                      Profile Picture
                    </p>
                    <p className="text-sm text-[#6B7B7C]">
                      JPG, PNG or GIF • Maximum 2MB
                    </p>
                  </div>
                </div>

                {/* Form Fields */}
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
                      placeholder="John Doe"
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
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-[rgba(31,69,59,0.2)] rounded-xl px-4 py-3 focus:border-[#1F453B] focus:ring-2 focus:ring-[rgba(31,69,59,0.18)] outline-none text-[15px]"
                      placeholder="Project Manager"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="mt-10 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-[#1F453B] hover:bg-[#163229] text-white font-semibold px-8 py-3 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-70 min-w-[160px] justify-center"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                    {!isSaving && <Save size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* ==================== SECURITY ==================== */}
            {activeSection === "security" && (
              <div>
                <h2
                  className="text-xl font-semibold mb-6"
                  style={{ color: "var(--ink-green)" }}
                >
                  Security Settings
                </h2>
                <p className="text-[#6B7B7C] mb-6">
                  Password and authentication options (coming soon)
                </p>
              </div>
            )}

            {/* ==================== NOTIFICATIONS ==================== */}
            {activeSection === "notifications" && (
              <div>
                <h2
                  className="text-xl font-semibold mb-6"
                  style={{ color: "var(--ink-green)" }}
                >
                  Notification Preferences
                </h2>
                <p className="text-[#6B7B7C]">
                  Email and in-app notification settings (coming soon)
                </p>
              </div>
            )}

            {/* ==================== BILLING ==================== */}
            {activeSection === "billing" && (
              <div>
                <h2
                  className="text-xl font-semibold mb-6"
                  style={{ color: "var(--ink-green)" }}
                >
                  Billing & Subscription
                </h2>
                <p className="text-[#6B7B7C]">
                  Plan and payment information (coming soon)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
