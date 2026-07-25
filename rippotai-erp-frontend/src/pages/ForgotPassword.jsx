import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useForgotPasswordMutation } from "../api/auth.api"; // adjust path

const GREEN = "#1F453B";
const TEXT = "#333333";
const MUTED = "#6B7B7C";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const submit = async (e) => {
    e.preventDefault();

    try {
      const res = await forgotPassword({ email }).unwrap();

      setSubmitted(true);
      toast.success(res.message || "Reset link sent. Please check your inbox.");
    } catch (err) {
      toast.error(
        err?.data?.message || err?.data?.error || "Couldn't send reset link.",
      );
    }
  };

  return (
    <div
      className="min-h-screen bg-white flex items-center justify-center p-6"
      data-testid="forgot-password-page"
    >
      <div className="w-full max-w-[420px]">
        <Link to="/" className="block text-center mb-6">
          <span
            className="text-[26px] font-bold tracking-tight"
            style={{ color: GREEN, fontFamily: "Poppins" }}
          >
            INOS
          </span>
        </Link>

        <div className="rounded-2xl border border-[#E8EAF0] p-7 bg-white shadow-sm">
          {submitted ? (
            <>
              <h1
                className="text-[22px] font-bold text-center"
                style={{ color: TEXT, fontFamily: "Poppins" }}
              >
                Check your email
              </h1>

              <p
                className="text-center text-[13px] mt-2 leading-relaxed"
                style={{ color: MUTED }}
              >
                If an account exists for <strong>{email}</strong>, we've sent a
                link to reset your password.
              </p>

              <button
                type="button"
                onClick={submit}
                disabled={isLoading}
                className="mt-5 h-11 w-full rounded-lg text-[14px] font-semibold border border-[#DDD8CE] disabled:opacity-60"
                style={{ color: TEXT }}
              >
                {isLoading ? "Resending..." : "Resend email"}
              </button>
            </>
          ) : (
            <>
              <h1
                className="text-[22px] font-bold text-center"
                style={{ color: TEXT, fontFamily: "Poppins" }}
              >
                Forgot password
              </h1>

              <p
                className="text-center text-[13px] mt-1"
                style={{ color: MUTED }}
              >
                Enter your email and we'll send you a reset link.
              </p>

              <form onSubmit={submit} className="mt-5 grid gap-3">
                <div>
                  <label
                    className="text-[12.5px] font-semibold mb-1 block"
                    style={{ color: TEXT }}
                  >
                    Email
                  </label>

                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full h-10 px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 h-11 rounded-lg text-white text-[14px] font-semibold disabled:opacity-60"
                  style={{ background: GREEN }}
                >
                  {isLoading ? "Sending..." : "Send reset link"}
                </button>
              </form>
            </>
          )}
        </div>

        <div
          className="text-center mt-5 text-[13.5px]"
          style={{ color: MUTED }}
        >
          Remembered your password?{" "}
          <Link to="/login" className="font-semibold" style={{ color: GREEN }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
