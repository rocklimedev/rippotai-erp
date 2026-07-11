import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const GREEN = "#1F453B";
const TEXT = "#333333";
const MUTED = "#6B7B7C";

export default function SignUp() {
  const [params] = useSearchParams();
  const plan = params.get("plan") || "";
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const { signup } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6)
      return toast.error("Password must be at least 6 characters.");
    if (form.password !== form.confirm)
      return toast.error("Passwords do not match.");
    if (!agree) return toast.error("Please accept the Terms of Service.");
    setBusy(true);
    try {
      const user = await signup({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      toast.success(`Welcome to INOS, ${user.name.split(" ")[0]}`);
      nav("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Sign up failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-white flex items-center justify-center p-6"
      data-testid="signup-page"
    >
      <div className="w-full max-w-[440px]">
        <Link to="/" className="block text-center mb-6">
          <span
            className="text-[26px] font-bold tracking-tight"
            style={{ color: GREEN, fontFamily: "Poppins" }}
          >
            INOS
          </span>
        </Link>
        <div className="rounded-2xl border border-[#E8EAF0] p-7 bg-white shadow-sm">
          <h1
            className="text-[22px] font-bold text-center"
            style={{ color: TEXT, fontFamily: "Poppins" }}
          >
            Create your account
          </h1>
          <p className="text-center text-[13px] mt-1" style={{ color: MUTED }}>
            Start your 14-day free trial. No credit card required.
          </p>
          {plan && (
            <div
              className="mt-3 text-[12px] text-center px-3 py-1.5 rounded-full inline-block mx-auto"
              style={{ background: "#EAF0EC", color: GREEN }}
              data-testid="signup-plan-chip"
            >
              Selected plan: {plan}
            </div>
          )}
          <form onSubmit={submit} className="mt-5 grid gap-3">
            <div>
              <label
                className="text-[12.5px] font-semibold mb-1 block"
                style={{ color: TEXT }}
              >
                Full Name
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
                data-testid="signup-name"
              />
            </div>
            <div>
              <label
                className="text-[12.5px] font-semibold mb-1 block"
                style={{ color: TEXT }}
              >
                Email
              </label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
                data-testid="signup-email"
              />
            </div>
            <div>
              <label
                className="text-[12.5px] font-semibold mb-1 block"
                style={{ color: TEXT }}
              >
                Password
              </label>
              <input
                required
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
                data-testid="signup-password"
              />
            </div>
            <div>
              <label
                className="text-[12.5px] font-semibold mb-1 block"
                style={{ color: TEXT }}
              >
                Confirm Password
              </label>
              <input
                required
                type="password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
                data-testid="signup-confirm"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="mt-2 h-11 rounded-lg text-white text-[14px] font-semibold disabled:opacity-60"
              style={{ background: GREEN }}
              data-testid="signup-submit"
            >
              {busy ? "Creating…" : "Create Account"}
            </button>
            <label
              className="flex items-start gap-2 text-[12.5px]"
              style={{ color: MUTED }}
            >
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-0.5"
                data-testid="signup-tos"
              />
              <span>
                I agree to the{" "}
                <a href="#" className="underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="underline">
                  Privacy Policy
                </a>
                .
              </span>
            </label>
          </form>
        </div>
        <div
          className="text-center mt-5 text-[13.5px]"
          style={{ color: MUTED }}
        >
          Already have an account?{" "}
          <Link to="/login" className="font-semibold" style={{ color: GREEN }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
