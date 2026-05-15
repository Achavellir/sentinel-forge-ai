import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Chrome } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { Button, Field, Input } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { supabase, supabaseConfigured } from '../../lib/supabase';
import { AuthShell } from './AuthShell';

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  function validate() {
    const nextErrors = {};
    if (form.name.trim().length < 2) nextErrors.name = 'Enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Enter a valid email address.';
    if (form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.';
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
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Account created. Check your email if confirmation is enabled.');
    navigate(location.state?.plan ? '/pricing' : '/dashboard');
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
      title="Create your account"
      subtitle="Start scanning suspicious emails in minutes."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-cyan">
            Login
          </Link>
        </>
      }
    >
      <SEO title="Sign Up" description="Create a 1PhishGuard AI account with email or Google OAuth." />
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Full name" error={errors.name}>
          <Input
            value={form.name}
            onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))}
            autoComplete="name"
          />
        </Field>
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
            autoComplete="new-password"
          />
        </Field>
        <Button type="submit" loading={loading}>
          Sign Up
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
