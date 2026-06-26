import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../store/use-auth";
import { formatApiError } from "../../utils/api";
import { FileText, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      console.log(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#E31E24] rounded-xl mb-4">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#333333]">
            Quotation Manager
          </h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                data-testid="login-error"
                className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-md"
              >
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                data-testid="login-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
                className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm text-[#333333] focus:outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  data-testid="login-password-input"
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 pr-10 text-sm text-[#333333] focus:outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              data-testid="login-submit-button"
              type="submit"
              disabled={loading}
              className="w-full bg-[#E31E24] text-white font-medium py-2.5 rounded-md hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
            <p className="text-xs text-gray-400 text-center mb-2">
              Demo Credentials
            </p>
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  setEmail("admin@example.com");
                  setPassword("Admin@123");
                }}
                className="w-full text-left px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded text-xs text-gray-600 transition-colors"
              >
                <span className="font-medium text-[#E31E24]">Admin:</span>{" "}
                admin@example.com / Admin@123
              </button>
              <button
                onClick={() => {
                  setEmail("employee@example.com");
                  setPassword("Employee@123");
                }}
                className="w-full text-left px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded text-xs text-gray-600 transition-colors"
              >
                <span className="font-medium">Employee:</span>{" "}
                employee@example.com / Employee@123
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
