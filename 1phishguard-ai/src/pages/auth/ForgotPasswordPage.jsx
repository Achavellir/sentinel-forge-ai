import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { Button, Field, Input } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { supabase, supabaseConfigured } from '../../lib/supabase';
import { AuthShell } from './AuthShell';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function handleSubmit(event) {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setError('');
    if (!supabaseConfigured) {
      toast.error('Supabase is not configured yet. Add your environment variables first.');
      return;
    }
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dashboard/settings`,
    });
    setLoading(false);
    if (resetError) {
      toast.error(resetError.message);
      return;
    }
    toast.success('Password reset email sent.');
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="Receive a secure password reset link."
      footer={
        <Link to="/login" className="font-bold text-cyan">
          Back to login
        </Link>
      }
    >
      <SEO title="Forgot Password" description="Reset your 1PhishGuard AI account password." />
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Email" error={error}>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </Field>
        <Button type="submit" loading={loading}>
          Send Reset Link
        </Button>
      </form>
    </AuthShell>
  );
}
