import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextInput, Field } from '@/components/inos';
import { useRequestEmailVerificationMutation, useVerifyEmailMutation } from '@/api/auth/auth.api';

const validCode = /^[2-9A-HJ-NP-Z]{16}$/;

export default function EmailVerificationCodeForm({ email: accountEmail, onVerified }) {
  const id = useId();
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [requestCode, { isLoading: sending }] = useRequestEmailVerificationMutation();
  const [verify, { isLoading: verifying }] = useVerifyEmailMutation();
  const address = (accountEmail || email).trim();
  const enteringCode = !!sentTo && sentTo === address;
  const busy = sending || verifying;
  const token = code.replace(/[\s-]/g, '').toUpperCase();

  const send = async () => {
    setFeedback(null);
    try {
      const result = await requestCode({ email: address, delivery: 'code' }).unwrap();
      setSentTo(address);
      setCode('');
      setFeedback({ message: result.message });
    } catch (error) {
      const message = error?.data?.message || 'Could not request a code. Try again.';
      setFeedback({ message: Array.isArray(message) ? message.join(' ') : message, error: true });
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (busy || !address) return;
    if (!enteringCode) return send();
    if (!validCode.test(token)) return;
    setFeedback(null);
    try {
      const result = await verify({ token, email: sentTo }).unwrap();
      onVerified(result.message);
    } catch (error) {
      const message = error?.data?.message || 'Could not verify the code. Try again.';
      setFeedback({ message: Array.isArray(message) ? message.join(' ') : message, error: true });
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      {!accountEmail && (
        <Field label="Email" htmlFor={`${id}-email`} required>
          <TextInput
            id={`${id}-email`}
            type="email"
            autoComplete="email"
            value={email}
            required
            disabled={busy}
            onChange={(event) => {
              setEmail(event.target.value);
              setSentTo('');
              setCode('');
              setFeedback(null);
            }}
          />
        </Field>
      )}
      {enteringCode && (
        <Field label="Verification code" htmlFor={`${id}-code`} required>
          <TextInput
            id={`${id}-code`}
            autoComplete="one-time-code"
            autoCapitalize="characters"
            spellCheck={false}
            value={code}
            disabled={busy}
            onChange={(event) => setCode(event.target.value)}
          />
        </Field>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy || !address || (enteringCode && !validCode.test(token))}>
          {enteringCode ? (verifying ? 'Verifying…' : 'Verify code') : (sending ? 'Sending…' : 'Send verification code')}
        </Button>
        {enteringCode && (
          <Button type="button" variant="outline" disabled={busy} onClick={send}>
            {sending ? 'Sending…' : 'Send another code'}
          </Button>
        )}
      </div>
      {feedback && <p role={feedback.error ? 'alert' : 'status'} className="text-sm">{feedback.message}</p>}
    </form>
  );
}
