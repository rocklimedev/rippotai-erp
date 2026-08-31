import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const GREEN = "#1F453B";
const TEXT = "#333333";
const MUTED = "#6B7B7C";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome, ${user.name.split(" ")[0]}`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-white flex items-center justify-center p-6"
      data-testid="login-page"
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
          <h1
            className="text-[22px] font-bold text-center"
            style={{ color: TEXT, fontFamily: "Poppins" }}
          >
            Sign in
          </h1>
          <p className="text-center text-[13px] mt-1" style={{ color: MUTED }}>
            Welcome back to INOS.
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
                data-testid="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
                autoComplete="email"
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
                data-testid="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
                autoComplete="current-password"
              />
            </div>
            <button
              data-testid="login-submit"
              type="submit"
              disabled={loading}
              className="mt-2 h-11 rounded-lg text-white text-[14px] font-semibold disabled:opacity-60"
              style={{ background: GREEN }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
        <div
          className="text-center mt-5 text-[13.5px]"
          style={{ color: MUTED }}
        >
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold" style={{ color: GREEN }}>
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
