import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

const ROLES = [
  { v: "admin", l: "Admin" },
  { v: "project_manager", l: "Project Manager" },
  { v: "architect", l: "Architect" },
  { v: "estimator", l: "Estimator" },
  { v: "supervisor", l: "Site Supervisor" },
  { v: "client", l: "Client" },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "project_manager",
  });
  const [busy, setBusy] = useState(false);

  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    try {
      await register({ ...form, email: form.email.trim() });
      toast.success("Account created");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bc-page-bg flex items-center justify-center p-6">
      <div className="w-full max-w-[440px]">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-[#1F453B] flex items-center justify-center text-white font-bold">
            B
          </div>
          <div>
            <div className="text-[15px] font-bold tracking-tight">INOS</div>
            <div className="text-[10px] uppercase tracking-widest text-[#B5C4B6]">
              ERP · Beta
            </div>
          </div>
        </div>

        <div className="bc-card p-8">
          <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-2">
            Create account
          </div>
          <h2 className="text-2xl font-bold text-[#333333] tracking-tight">
            Join your workspace
          </h2>
          <p className="text-[13px] text-[#6B7B7C] mt-1.5 mb-6">
            Set up your INOS account in under a minute.
          </p>

          <form
            onSubmit={submit}
            className="space-y-4"
            data-testid="register-form"
          >
            <div>
              <label className="block text-[12px] font-medium text-[#6B7B7C] mb-1.5">
                Full name
              </label>
              <input
                data-testid="register-name"
                className="bc-input"
                value={form.name}
                onChange={upd("name")}
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#6B7B7C] mb-1.5">
                Email
              </label>
              <input
                data-testid="register-email"
                type="email"
                className="bc-input"
                value={form.email}
                onChange={upd("email")}
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#6B7B7C] mb-1.5">
                Password
              </label>
              <input
                data-testid="register-password"
                type="password"
                className="bc-input"
                value={form.password}
                onChange={upd("password")}
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#6B7B7C] mb-1.5">
                Role
              </label>
              <select
                data-testid="register-role"
                className="bc-input"
                value={form.role}
                onChange={upd("role")}
              >
                {ROLES.map((r) => (
                  <option key={r.v} value={r.v}>
                    {r.l}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              data-testid="register-submit-btn"
              disabled={busy}
              className="w-full h-11 rounded-xl bg-[#1F453B] hover:bg-[#1F453B] text-white font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              {busy ? (
                "Creating…"
              ) : (
                <>
                  Create account <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-[13px] text-[#6B7B7C] mt-6 text-center">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-[#333333] font-semibold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
