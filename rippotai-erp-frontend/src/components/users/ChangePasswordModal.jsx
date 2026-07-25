import React, { useState } from "react";
import { Eye, EyeOff, KeyRound, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Link } from "react-router-dom";
import { useChangePasswordMutation } from "../../api/auth.api"; // adjust path to match your project

const initialPasswords = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function ChangePasswordModal({ open, onOpenChange }) {
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwords, setPasswords] = useState(initialPasswords);
  const [error, setError] = useState("");

  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const handlePasswordChange = (e) => {
    setError("");
    setPasswords((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleClose = () => {
    setPasswords(initialPasswords);
    setError("");
    setShowPasswords(false);
    onOpenChange(false);
  };

  const handleUpdatePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwords;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await changePassword({
        currentPassword,
        newPassword,
      }).unwrap();

      handleClose();
      // Swap this for a toast if your app has one
      alert(
        "Password updated successfully. You may need to sign in again on your other devices.",
      );
    } catch (err) {
      const message = err?.data?.message;
      setError(
        Array.isArray(message)
          ? message.join(" ")
          : message || "Failed to update password. Please try again.",
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : handleClose())}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock size={18} />
            Change Password
          </DialogTitle>

          <DialogDescription>
            Update your password to keep your account secure.{" "}
            <Link
              to="/forgot-password"
              className="font-medium hover:underline"
              style={{ color: "var(--ink-green)" }}
              onClick={handleClose}
            >
              Forgot password?
            </Link>
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

          {error && <p className="text-sm text-red-500">{error}</p>}

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
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>

          <Button onClick={handleUpdatePassword} disabled={isLoading}>
            <KeyRound className="mr-2 h-4 w-4" />
            {isLoading ? "Updating..." : "Update Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
