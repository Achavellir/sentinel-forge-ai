import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Chrome } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { Button, Field, Input } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { supabase, supabaseConfigured } from '../../lib/supabase';
import { AuthShell } from './AuthShell';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const redirectTo = location.state?.from?.pathname || '/dashboard';

  function validate() {
    const nextErrors = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Enter a valid email address.';
    if (!form.password) nextErrors.password = 'Enter your password.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;
    if (!supabaseConfigured) {
      toast.error('Supabase is not configured yet. Add your environment variables first.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(form);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Welcome back.');
    navigate(redirectTo, { replace: true });
  }

  async function handleGoogle() {
    if (!supabaseConfigured) {
      toast.error('Supabase is not configured yet. Add your environment variables first.');
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your PGA dashboard."
      footer={
        <>
          Need an account?{' '}
          <Link to="/signup" className="font-bold text-cyan">
            Sign up
          </Link>
        </>
      }
    >
      <SEO title="Login" description="Log in to 1PhishGuard AI with email or Google OAuth." />
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Email" error={errors.email}>
          <Input
            type="email"
            value={form.email}
            onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))}
            autoComplete="email"
          />
        </Field>
        <Field label="Password" error={errors.password}>
          <Input
            type="password"
            value={form.password}
            onChange={(event) => setForm((value) => ({ ...value, password: event.target.value }))}
            autoComplete="current-password"
          />
        </Field>
        <div className="-mt-1 text-right">
          <Link to="/forgot-password" className="text-sm font-bold text-cyan">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" loading={loading}>
          Login
        </Button>
      </form>
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-800" />
        <span className="font-mono text-xs font-bold uppercase text-slate-600">or</span>
        <div className="h-px flex-1 bg-slate-800" />
      </div>
      <Button variant="secondary" className="w-full" onClick={handleGoogle}>
        <Chrome className="h-4 w-4" /> Continue with Google
      </Button>
    </AuthShell>
  );
}
