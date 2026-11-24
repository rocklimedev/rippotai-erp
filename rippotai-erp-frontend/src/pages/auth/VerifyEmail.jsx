import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { API_URL } from "@/lib/config";
import { useVerifyEmailMutation } from "@/api/auth/auth.api";
import EmailVerificationCodeForm from "@/components/users/EmailVerificationCodeForm";

const zohoMessages = new Map([
  ["verified", "Email verified. You can now sign in."],
  ["failed", "Zoho could not verify your ERP email. Use the Zoho account with your ERP email address, or request a verification code."],
  ["unavailable", "Zoho verification is unavailable. You can request a verification code below."],
]);

export default function VerifyEmail() {
  const location = useLocation();
  const [token] = useState(
    () => new URLSearchParams(location.hash.slice(1)).get("token") || "",
  );
  const zohoStatus = new URLSearchParams(location.search).get("zoho");
  const [message, setMessage] = useState(zohoMessages.get(zohoStatus) || "");
  const [verified, setVerified] = useState(zohoStatus === "verified");
  const [verifyEmail, { isLoading: verifying }] = useVerifyEmailMutation();

  async function submit(event) {
    event.preventDefault();
    try {
      const result = await verifyEmail({ token }).unwrap();
      setMessage(result.message);
      setVerified(true);
    } catch (error) {
      setMessage(
        error?.data?.message ||
          "Unable to verify email. Please request a verification code.",
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
        {!verified && token && (
          <form onSubmit={submit} className="space-y-4">
            <button
              disabled={verifying}
              className="rounded-lg bg-[#1F453B] text-white p-3 disabled:opacity-60"
              type="submit"
            >
              {verifying ? "Please wait…" : "Verify email"}
            </button>
          </form>
        )}
        {!verified && !token && (
          <>
            <EmailVerificationCodeForm onVerified={(confirmation) => {
              setMessage(confirmation);
              setVerified(true);
            }} />
            <a className="block rounded-lg border p-3 text-center font-semibold"
              href={`${API_URL}/auth/zoho-email/start`}>
              Verify with Zoho
            </a>
          </>
        )}
        {message && <p role="status">{message}</p>}
        {token && !verified && (
          <a className="block underline" href="/verify-email">
            Request a verification code
          </a>
        )}
        <Link to="/login" className="block underline">
          Back to sign in
        </Link>
      </main>
    </div>
  );
}
