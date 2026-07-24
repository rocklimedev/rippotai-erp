import React, { useState } from "react";
import {
  Shield,
  Lock,
  KeyRound,
  Smartphone,
  Bell,
  Laptop,
  LogOut,
  Eye,
  EyeOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SecuritySettings() {
  const [settings, setSettings] = useState({
    twoFactor: false,
    loginAlerts: true,
    rememberDevice: true,
  });

  const [openPasswordModal, setOpenPasswordModal] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const toggle = (key) =>
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));

  const handlePasswordChange = (e) => {
    setPasswords((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleUpdatePassword = () => {
    if (
      !passwords.currentPassword ||
      !passwords.newPassword ||
      !passwords.confirmPassword
    ) {
      alert("Please fill all fields.");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // TODO:
    // Call your API here

    console.log(passwords);

    alert("Password updated successfully.");

    setPasswords({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setOpenPasswordModal(false);
  };

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

            <Button onClick={() => setOpenPasswordModal(true)}>
              <KeyRound className="mr-2 h-4 w-4" />
              Change Password
            </Button>
          </div>
        </div>

        {/* Two Factor */}
        <div className="rounded-xl border bg-white">
          <div className="px-6 py-4 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Shield size={18} />
              Two-Factor Authentication
            </h3>
          </div>

          <div className="px-6">
            <Row
              icon={Smartphone}
              title="Enable Two-Factor Authentication"
              description="Require an authentication code when signing in."
              value={settings.twoFactor}
              onChange={() => toggle("twoFactor")}
            />
          </div>
        </div>

        {/* Login Alerts */}
        <div className="rounded-xl border bg-white">
          <div className="px-6 py-4 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Bell size={18} />
              Login Alerts
            </h3>
          </div>

          <div className="px-6">
            <Row
              icon={Bell}
              title="Email Login Alerts"
              description="Receive an email whenever a new device logs in."
              value={settings.loginAlerts}
              onChange={() => toggle("loginAlerts")}
            />

            <Separator />

            <Row
              icon={Laptop}
              title="Remember Trusted Devices"
              description="Reduce verification prompts on trusted devices."
              value={settings.rememberDevice}
              onChange={() => toggle("rememberDevice")}
            />
          </div>
        </div>

        {/* Active Sessions */}
        <div className="rounded-xl border bg-white">
          <div className="px-6 py-4 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Laptop size={18} />
              Active Sessions
            </h3>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Current Device</p>

                <p className="text-sm text-[#6B7B7C]">
                  Windows • Chrome • Active Now
                </p>
              </div>

              <Button variant="outline" disabled>
                Current Session
              </Button>
            </div>

            <Separator className="my-5" />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sign out from all devices</p>

                <p className="text-sm text-[#6B7B7C]">
                  End every active session except this one.
                </p>
              </div>

              <Button variant="destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out All
              </Button>
            </div>
          </div>
        </div>

        {/* Security Status */}
        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <div className="flex items-start gap-3">
            <Shield className="mt-1" size={22} color="#15803d" />

            <div>
              <h4 className="font-semibold text-green-700">Security Status</h4>

              <p className="text-sm text-green-600 mt-1">
                Your account is protected. Enabling Two-Factor Authentication
                provides an additional layer of security for your account.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <Dialog open={openPasswordModal} onOpenChange={setOpenPasswordModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock size={18} />
              Change Password
            </DialogTitle>

            <DialogDescription>
              Update your password to keep your account secure.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>

              <Input
                id="currentPassword"
                name="currentPassword"
                type={showPasswords ? "text" : "password"}
                placeholder="Enter current password"
                value={passwords.currentPassword}
                onChange={handlePasswordChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>

              <Input
                id="newPassword"
                name="newPassword"
                type={showPasswords ? "text" : "password"}
                placeholder="Enter new password"
                value={passwords.newPassword}
                onChange={handlePasswordChange}
              />

              <p className="text-xs text-muted-foreground">
                Password should contain at least 8 characters, one uppercase
                letter, one lowercase letter, one number and one special
                character.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>

              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPasswords ? "text" : "password"}
                placeholder="Confirm new password"
                value={passwords.confirmPassword}
                onChange={handlePasswordChange}
              />
            </div>

            <Button
              variant="ghost"
              className="justify-start px-0"
              onClick={() => setShowPasswords((prev) => !prev)}
            >
              {showPasswords ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide Passwords
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Show Passwords
                </>
              )}
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenPasswordModal(false)}
            >
              Cancel
            </Button>

            <Button onClick={handleUpdatePassword}>
              <KeyRound className="mr-2 h-4 w-4" />
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
