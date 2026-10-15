import { Link } from "react-router-dom";

export default function SignupClosed() {
  return (
    <main className="mx-auto max-w-md p-8 space-y-4">
      <h1 className="text-2xl font-semibold">Contact your administrator</h1>
      <p>
        Public signup is closed. Your administrator must provision your account.
      </p>
      <Link to="/login" className="block underline">
        Sign in
      </Link>
    </main>
  );
}
