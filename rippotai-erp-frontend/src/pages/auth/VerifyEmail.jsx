import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { API_URL } from "@/lib/config";
import {
  useRequestEmailVerificationMutation,
  useVerifyEmailMutation,
} from "@/api/auth/auth.api";

const zohoMessages = new Map([
  ["verified", "Email verified. You can now sign in."],
  ["failed", "Zoho could not verify your ERP email. Use the Zoho account with your ERP email address, or request a verification link."],
  ["unavailable", "Zoho verification is unavailable. You can request a verification link below."],
]);

export default function VerifyEmail() {
  const location = useLocation();
  const [token] = useState(
    () => new URLSearchParams(location.hash.slice(1)).get("token") || "",
  );
  const [email, setEmail] = useState("");
  const zohoStatus = new URLSearchParams(location.search).get("zoho");
  const [message, setMessage] = useState(zohoMessages.get(zohoStatus) || "");
  const [verified, setVerified] = useState(zohoStatus === "verified");
  const [requestVerification, { isLoading: sending }] =
    useRequestEmailVerificationMutation();
  const [verifyEmail, { isLoading: verifying }] = useVerifyEmailMutation();

  async function submit(event) {
    event.preventDefault();
    try {
      const result = token
        ? await verifyEmail({ token }).unwrap()
        : await requestVerification({ email }).unwrap();
      setMessage(result.message);
      if (token) setVerified(true);
    } catch (error) {
      setMessage(
        error?.data?.message ||
          "Unable to verify email. Please request a new link.",
      );
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <main className="w-full max-w-md rounded-2xl border p-7 space-y-5">
        <h1 className="text-2xl font-semibold">Verify your email</h1>
        <p>
          Accounts are provisioned by your administrator. Verify your email
          before signing in.
        </p>
        {!verified && (
          <form onSubmit={submit} className="space-y-4">
            {!token && (
              <label className="block">
                Email
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="block w-full border rounded-lg p-3 mt-2"
                />
              </label>
            )}
            <button
              disabled={sending || verifying}
              className="rounded-lg bg-[#1F453B] text-white p-3 disabled:opacity-60"
              type="submit"
            >
              {sending || verifying
                ? "Please wait…"
                : token
                  ? "Verify email"
                  : "Send verification link"}
            </button>
          </form>
        )}
        {!verified && !token && (
          <a className="block rounded-lg border p-3 text-center font-semibold"
            href={`${API_URL}/auth/zoho-email/start`}>
            Verify with Zoho
          </a>
        )}
        {message && <p role="status">{message}</p>}
        {token && !verified && (
          <a className="block underline" href="/verify-email">
            Request a new link
          </a>
        )}
        <Link to="/login" className="block underline">
          Back to sign in
        </Link>
      </main>
    </div>
  );
}
