import React, { useState } from "react";
import {
  Shield,
  KeyRound,
  Smartphone,
  Bell,
  Laptop,
  LogOut,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import ChangePasswordModal from "../../components/users/ChangePasswordModal";
export default function SecuritySettings() {
  const [settings, setSettings] = useState({
    twoFactor: false,
    loginAlerts: true,
    rememberDevice: true,
  });

  const [openPasswordModal, setOpenPasswordModal] = useState(false);

  const toggle = (key) =>
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));

  const Row = ({ icon: Icon, title, description, value, onChange }) => (
    <div className="flex items-center justify-between py-4">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#EDF4F2] flex items-center justify-center">
          <Icon size={18} style={{ color: "var(--ink-green)" }} />
        </div>

        <div>
          <p className="font-medium text-[15px] text-[#2D3A3A]">{title}</p>
          <p className="text-sm text-[#6B7B7C]">{description}</p>
        </div>
      </div>

      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );

  return (
    <>
      <div className="max-w-4xl space-y-8">
        {/* Heading */}
        <div>
          <h2
            className="text-2xl font-semibold"
            style={{ color: "var(--ink-green)" }}
          >
            Security Settings
          </h2>

          <p className="text-[#6B7B7C] mt-2">
            Protect your account by managing passwords, authentication,
            sessions, and security notifications.
          </p>
        </div>

        {/* Password */}
        <div className="rounded-xl border bg-white">
          <div className="px-6 py-4 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Lock size={18} />
              Password
            </h3>
          </div>

          <div className="px-6 py-5 flex items-center justify-between">
            <div>
              <p className="font-medium">Password</p>

              <p className="text-sm text-[#6B7B7C]">
                Last changed 30 days ago.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/forgot-password"
                className="text-sm font-medium hover:underline"
                style={{ color: "var(--ink-green)" }}
              >
                Forgot password?
              </Link>

              <Button onClick={() => setOpenPasswordModal(true)}>
                <KeyRound className="mr-2 h-4 w-4" />
                Change Password
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        open={openPasswordModal}
        onOpenChange={setOpenPasswordModal}
      />
    </>
  );
}
