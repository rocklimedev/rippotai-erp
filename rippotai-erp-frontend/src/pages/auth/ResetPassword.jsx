import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useResetPasswordMutation } from "../../api/auth.api"; // Adjust path if needed

const GREEN = "#1F453B";
const TEXT = "#333333";
const MUTED = "#6B7B7C";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  useEffect(() => {
    if (!token) {
      toast.error("This reset link is invalid or missing a token.");
    }
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("This reset link is invalid or has expired.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      const response = await resetPassword({
        token,
        password: newPassword,
      }).unwrap();

      setSuccess(true);

      toast.success(response?.message || "Password reset successfully.");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      toast.error(
        err?.data?.message ||
          err?.data?.error ||
          "Couldn't reset password. Please try again.",
      );
    }
  };

  return (
    <div
      className="min-h-screen bg-white flex items-center justify-center p-6"
      data-testid="reset-password-page"
    >
      <div className="w-full max-w-[420px]">
        <Link to="/" className="block text-center mb-6">
          <span
            className="text-[26px] font-bold tracking-tight"
            style={{
              color: GREEN,
              fontFamily: "Poppins",
            }}
          >
            INOS
          </span>
        </Link>

        <div className="rounded-2xl border border-[#E8EAF0] p-7 bg-white shadow-sm">
          {success ? (
            <>
              <h1
                className="text-[22px] font-bold text-center"
                style={{
                  color: TEXT,
                  fontFamily: "Poppins",
                }}
              >
                Password reset
              </h1>

              <p
                className="text-center text-[13px] mt-2 leading-relaxed"
                style={{ color: MUTED }}
              >
                Your password has been updated successfully.
                <br />
                Redirecting you to sign in...
              </p>
            </>
          ) : (
            <>
              <h1
                className="text-[22px] font-bold text-center"
                style={{
                  color: TEXT,
                  fontFamily: "Poppins",
                }}
              >
                Reset password
              </h1>

              <p
                className="text-center text-[13px] mt-1"
                style={{ color: MUTED }}
              >
                Choose a new password for your account.
              </p>

              <form onSubmit={submit} className="mt-5 grid gap-3">
                <div>
                  <label
                    className="text-[12.5px] font-semibold mb-1 block"
                    style={{ color: TEXT }}
                  >
                    New password
                  </label>

                  <input
                    data-testid="reset-password-new"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
                    autoComplete="new-password"
                    placeholder="Enter new password"
                  />

                  <p className="text-[11.5px] mt-1" style={{ color: MUTED }}>
                    Password must be at least 8 characters long.
                  </p>
                </div>

                <div>
                  <label
                    className="text-[12.5px] font-semibold mb-1 block"
                    style={{ color: TEXT }}
                  >
                    Confirm new password
                  </label>

                  <input
                    data-testid="reset-password-confirm"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                  />
                </div>

                <button
                  data-testid="reset-password-submit"
                  type="submit"
                  disabled={isLoading || !token}
                  className="mt-2 h-11 rounded-lg text-white text-[14px] font-semibold disabled:opacity-60"
                  style={{
                    background: GREEN,
                  }}
                >
                  {isLoading ? "Resetting..." : "Reset password"}
                </button>
              </form>
            </>
          )}
        </div>

        <div
          className="text-center mt-5 text-[13.5px]"
          style={{ color: MUTED }}
        >
          <Link to="/login" className="font-semibold" style={{ color: GREEN }}>
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
