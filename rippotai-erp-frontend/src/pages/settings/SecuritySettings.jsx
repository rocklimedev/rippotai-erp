import { useState } from 'react';
import { KeyRound, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/inos';
import { useAuth } from '@/context/AuthContext';
import EmailVerificationCodeForm from '@/components/users/EmailVerificationCodeForm';
import { Link } from 'react-router-dom';
import ChangePasswordModal from '../../components/users/ChangePasswordModal';

export default function SecuritySettings() {
  const { user, refresh } = useAuth();
  const [openPasswordModal, setOpenPasswordModal] = useState(false);
  const email = user?.email;
  const verified = user?.email_verified === true;

  return (
    <>
      <div className="max-w-4xl space-y-8">
        {/* Heading */}
        <div>
          <h2 className="text-2xl font-semibold" style={{ color: 'var(--ink-green)' }}>
            Security Settings
          </h2>

          <p className="text-[#6B7B7C] mt-2">
            Protect your account by managing passwords, authentication, sessions, and security
            notifications.
          </p>
        </div>

        {email && (
          <section className="rounded-xl border bg-white">
            <div className="px-6 py-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Mail size={18} aria-hidden="true" />
                Email verification
              </h3>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-medium break-all">{email}</p>
                <Pill tone={verified ? 'ok' : 'mute'}>{verified ? 'Verified' : 'Unverified'}</Pill>
              </div>
              {!verified && (
                <EmailVerificationCodeForm key={email} email={email} onVerified={() => refresh()} />
              )}
            </div>
          </section>
        )}

        {/* Password */}
        <div className="rounded-xl border bg-white">
          <div className="px-6 py-4 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Lock size={18} />
              Password
            </h3>
          </div>

          <div className="px-6 py-5 flex items-center justify-between">
            <div>
              <p className="font-medium">Password</p>

              <p className="text-sm text-[#6B7B7C]">Last changed 30 days ago.</p>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/forgot-password"
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--ink-green)' }}
              >
                Forgot password?
              </Link>

              <Button onClick={() => setOpenPasswordModal(true)}>
                <KeyRound className="mr-2 h-4 w-4" />
                Change Password
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ChangePasswordModal open={openPasswordModal} onOpenChange={setOpenPasswordModal} />
    </>
  );
}
