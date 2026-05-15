import { useState } from 'react';
import { AlertTriangle, Camera, KeyRound, Save, Trash2 } from 'lucide-react';
import { DashboardHeader } from '../../components/DashboardLayout';
import { SEO } from '../../components/SEO';
import { Button, Card, Field, Input, Toggle } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase, updateProfile } from '../../lib/supabase';

export default function SettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const toast = useToast();
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || '',
    email: user?.email || '',
  });
  const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' });
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState('');
  const [notifications, setNotifications] = useState({
    scanComplete: true,
    weeklyReports: true,
    billingAlerts: true,
  });

  async function saveProfile(event) {
    event.preventDefault();
    const nextErrors = {};
    if (profileForm.full_name.trim().length < 2) nextErrors.full_name = 'Enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(profileForm.email)) nextErrors.email = 'Enter a valid email address.';
    setProfileErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setLoading('profile');
    try {
      if (profileForm.email !== user.email) {
        const { error } = await supabase.auth.updateUser({ email: profileForm.email });
        if (error) throw error;
      }
      await updateProfile(user.id, { full_name: profileForm.full_name });
      await refreshProfile();
      toast.success('Profile saved.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading('');
    }
  }

  async function uploadAvatar(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading('avatar');
    try {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (error) throw error;
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(path);
      await updateProfile(user.id, { avatar_url: publicUrl });
      await refreshProfile();
      toast.success('Avatar updated.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading('');
    }
  }

  async function updatePassword(event) {
    event.preventDefault();
    if (passwordForm.password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (passwordForm.password !== passwordForm.confirm) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setPasswordError('');
    setLoading('password');
    const { error } = await supabase.auth.updateUser({ password: passwordForm.password });
    setLoading('');
    if (error) {
      toast.error(error.message);
      return;
    }
    setPasswordForm({ password: '', confirm: '' });
    toast.success('Password changed.');
  }

  async function deleteAccount() {
    const confirmed = window.confirm('Delete your account and scan history? This cannot be undone.');
    if (!confirmed) return;
    setLoading('delete');
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not delete account');
      await signOut();
      toast.success('Account deleted.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading('');
    }
  }

  return (
    <>
      <SEO title="Settings" description="Manage profile, password, notifications, and account settings in 1PhishGuard AI." />
      <DashboardHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your profile, password, notification preferences, and account controls."
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <div className="grid gap-5">
          <Card>
            <h2 className="text-xl font-black text-white">Profile</h2>
            <div className="mt-5 flex items-center gap-4">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-lg object-cover" />
              ) : (
                <span className="grid h-16 w-16 place-items-center rounded-lg bg-primary/20 font-mono text-lg font-bold text-cyan">
                  {(profile?.full_name || user?.email || 'PG').slice(0, 2).toUpperCase()}
                </span>
              )}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 font-mono text-sm font-bold text-slate-200 hover:border-cyan/50">
                <Camera className="h-4 w-4" />
                Upload Avatar
                <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
              </label>
            </div>
            <form className="mt-5 grid gap-4" onSubmit={saveProfile}>
              <Field label="Name" error={profileErrors.full_name}>
                <Input
                  value={profileForm.full_name}
                  onChange={(event) => setProfileForm((value) => ({ ...value, full_name: event.target.value }))}
                />
              </Field>
              <Field label="Email" error={profileErrors.email}>
                <Input
                  type="email"
                  value={profileForm.email}
                  onChange={(event) => setProfileForm((value) => ({ ...value, email: event.target.value }))}
                />
              </Field>
              <Button type="submit" loading={loading === 'profile'}>
                <Save className="h-4 w-4" /> Save Profile
              </Button>
            </form>
          </Card>

          <Card>
            <h2 className="text-xl font-black text-white">Password</h2>
            <form className="mt-5 grid gap-4" onSubmit={updatePassword}>
              <Field label="New password" error={passwordError}>
                <Input
                  type="password"
                  value={passwordForm.password}
                  onChange={(event) => setPasswordForm((value) => ({ ...value, password: event.target.value }))}
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Confirm password">
                <Input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(event) => setPasswordForm((value) => ({ ...value, confirm: event.target.value }))}
                  autoComplete="new-password"
                />
              </Field>
              <Button type="submit" variant="secondary" loading={loading === 'password'}>
                <KeyRound className="h-4 w-4" /> Change Password
              </Button>
            </form>
          </Card>
        </div>

        <div className="grid gap-5">
          <Card>
            <h2 className="text-xl font-black text-white">Notifications</h2>
            <div className="mt-5 grid gap-3">
              <Toggle
                checked={notifications.scanComplete}
                onChange={(value) => setNotifications((current) => ({ ...current, scanComplete: value }))}
                label="Scan completion"
                description="Send email when long scans finish."
              />
              <Toggle
                checked={notifications.weeklyReports}
                onChange={(value) => setNotifications((current) => ({ ...current, weeklyReports: value }))}
                label="Weekly reports"
                description="Receive weekly scan summaries."
              />
              <Toggle
                checked={notifications.billingAlerts}
                onChange={(value) => setNotifications((current) => ({ ...current, billingAlerts: value }))}
                label="Billing alerts"
                description="Notify account owners about payment issues."
              />
            </div>
          </Card>

          <Card className="border-phishing/30">
            <div className="flex gap-3">
              <AlertTriangle className="h-6 w-6 shrink-0 text-phishing" />
              <div>
                <h2 className="text-xl font-black text-white">Danger zone</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Delete your profile, scan history, and authentication account.
                </p>
              </div>
            </div>
            <Button variant="danger" className="mt-5 w-full" loading={loading === 'delete'} onClick={deleteAccount}>
              <Trash2 className="h-4 w-4" /> Delete Account
            </Button>
          </Card>
        </div>
      </div>
    </>
  );
}
