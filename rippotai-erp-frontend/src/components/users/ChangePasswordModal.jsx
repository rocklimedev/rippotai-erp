import React, { useState } from "react";
import { Eye, EyeOff, KeyRound, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Field, TextInput, Button } from "@/components/inos";
import { AdminModal, ModalActions } from "@/pages/settings/_admin-ui";
import { useChangePasswordMutation } from "../../api/auth/auth.api"; // adjust path to match your project

const initialPasswords = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function ChangePasswordModal({ open, onOpenChange }) {
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwords, setPasswords] = useState(initialPasswords);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const handlePasswordChange = (e) => {
    setError("");
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    setPasswords((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleClose = () => {
    setPasswords(initialPasswords);
    setError("");
    setFieldErrors({});
    setShowPasswords(false);
    onOpenChange(false);
  };

  const handleUpdatePassword = async (e) => {
    e?.preventDefault?.();
    const { currentPassword, newPassword, confirmPassword } = passwords;

    const next = {};
    if (!currentPassword) next.currentPassword = "Enter your current password.";
    if (!newPassword) next.newPassword = "Choose a new password.";
    if (!confirmPassword) next.confirmPassword = "Type the new password again.";
    else if (newPassword && newPassword !== confirmPassword) next.confirmPassword = "Passwords do not match.";
    if (Object.keys(next).length) {
      setFieldErrors(next);
      return;
    }

    try {
      await changePassword({
        currentPassword,
        newPassword,
      }).unwrap();

      handleClose();
      toast.success("Password updated. You may need to sign in again on your other devices.");
    } catch (err) {
      const message = err?.data?.message;
      setError(
        Array.isArray(message)
          ? message.join(" ")
          : message || "Failed to update password. Please try again.",
      );
    }
  };

  const type = showPasswords ? "text" : "password";

  return (
    <AdminModal
      open={open}
      as="form"
      onSubmit={handleUpdatePassword}
      onClose={handleClose}
      busy={isLoading}
      icon={Lock}
      title="Change password"
      subtitle={
        <>
          Keep your account secure.{" "}
          <Link to="/forgot-password" className="adm-link-btn" onClick={handleClose}>
            Forgot password?
          </Link>
        </>
      }
      width={480}
      footer={
        <ModalActions
          onCancel={handleClose}
          submitting={isLoading}
          submittingLabel="Updating…"
          submitLabel="Update password"
          icon={KeyRound}
        />
      }
    >
      <Field label="Current password" required htmlFor="currentPassword" error={fieldErrors.currentPassword}>
        <TextInput
          id="currentPassword"
          name="currentPassword"
          type={type}
          autoFocus
          autoComplete="current-password"
          value={passwords.currentPassword}
          invalid={!!fieldErrors.currentPassword}
          onChange={handlePasswordChange}
        />
      </Field>

      <Field
        label="New password"
        required
        htmlFor="newPassword"
        error={fieldErrors.newPassword}
        hint="At least 8 characters with an uppercase letter, a lowercase letter, a number and a symbol."
      >
        <TextInput
          id="newPassword"
          name="newPassword"
          type={type}
          autoComplete="new-password"
          value={passwords.newPassword}
          invalid={!!fieldErrors.newPassword}
          onChange={handlePasswordChange}
        />
      </Field>

      <Field label="Confirm new password" required htmlFor="confirmPassword" error={fieldErrors.confirmPassword}>
        <TextInput
          id="confirmPassword"
          name="confirmPassword"
          type={type}
          autoComplete="new-password"
          value={passwords.confirmPassword}
          invalid={!!fieldErrors.confirmPassword}
          onChange={handlePasswordChange}
        />
      </Field>

      {error && (
        <div className="adm-callout adm-callout--bad" role="alert">
          {error}
        </div>
      )}

      <div>
        <Button variant="ghost" size="sm" icon={showPasswords ? EyeOff : Eye} onClick={() => setShowPasswords((prev) => !prev)}>
          {showPasswords ? "Hide passwords" : "Show passwords"}
        </Button>
      </div>
    </AdminModal>
  );
}
