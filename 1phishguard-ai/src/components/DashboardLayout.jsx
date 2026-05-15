import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  CreditCard,
  FileClock,
  Home,
  LogOut,
  Menu,
  ScanSearch,
  Settings,
  ShieldCheck,
  User,
  Users,
  X,
} from 'lucide-react';
import { Logo } from './Logo';
import { Button } from './ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { cn } from '../lib/utils';

const sidebarLinks = [
  { label: 'Dashboard', to: '/dashboard', icon: Home, end: true },
  { label: 'Scan Email', to: '/dashboard/scan', icon: ScanSearch },
  { label: 'History', to: '/dashboard/history', icon: FileClock },
  { label: 'Reports', to: '/dashboard/reports', icon: BarChart3 },
  { label: 'Team', to: '/dashboard/team', icon: Users },
  { label: 'Settings', to: '/dashboard/settings', icon: Settings },
  { label: 'Upgrade', to: '/pricing', icon: CreditCard },
];

function Sidebar({ onNavigate }) {
  return (
    <aside className="flex h-full flex-col border-r border-white/10 bg-slate-950/72 p-4 backdrop-blur-xl">
      <div className="mb-6">
        <Logo />
      </div>
      <nav className="grid gap-1">
        {sidebarLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.label}
              to={link.to}
              end={link.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-primary/18 text-white ring-1 ring-primary/30'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100',
                )
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {link.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export function DashboardLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { profile, user, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    toast.success('Logged out.');
    navigate('/login');
  }

  const initials =
    profile?.full_name
      ?.split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || user?.email?.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-navy text-slate-100">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-72 lg:block">
        <Sidebar />
      </div>
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 lg:hidden" onClick={() => setMenuOpen(false)}>
          <div className="h-full w-72" onClick={(event) => event.stopPropagation()}>
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-navy/82 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="rounded-lg border border-slate-700 p-2 text-slate-200 lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open dashboard navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <nav className="hidden items-center gap-5 font-mono text-xs font-bold uppercase text-slate-500 md:flex">
              <NavLink to="/dashboard" className="hover:text-slate-200">
                Overview
              </NavLink>
              <NavLink to="/dashboard/scan" className="hover:text-slate-200">
                Scanner
              </NavLink>
              <NavLink to="/billing" className="hover:text-slate-200">
                Billing
              </NavLink>
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                className="relative rounded-lg border border-slate-800 p-2 text-slate-400 hover:text-slate-100"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-cyan" />
              </button>
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 p-1.5 pr-3"
                  onClick={() => setUserMenuOpen((value) => !value)}
                  aria-label="Open user menu"
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-lg object-cover" />
                  ) : (
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/20 font-mono text-xs font-bold text-cyan">
                      {initials}
                    </span>
                  )}
                  <span className="hidden max-w-36 truncate text-sm text-slate-300 sm:block">
                    {profile?.full_name || user?.email}
                  </span>
                </button>
                {userMenuOpen && (
                  <div className="glass absolute right-0 mt-2 w-56 rounded-lg p-2">
                    <NavLink
                      to="/dashboard/settings"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="h-4 w-4" /> Profile
                    </NavLink>
                    <NavLink
                      to="/dashboard/settings"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" /> Settings
                    </NavLink>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="dashboard-grid min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <button
        type="button"
        className={cn('fixed right-4 top-4 z-[60] rounded-lg bg-slate-900 p-2 text-slate-200 lg:hidden', !menuOpen && 'hidden')}
        onClick={() => setMenuOpen(false)}
        aria-label="Close dashboard navigation"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

export function DashboardHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="font-mono text-xs font-bold uppercase text-cyan">{eyebrow}</p>}
        <h1 className="mt-2 text-3xl font-black tracking-normal text-white md:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-slate-400">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function LockedBusiness({ title = 'Business plan required', description }) {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="glass max-w-lg rounded-lg p-8 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-cyan" aria-hidden="true" />
        <h2 className="mt-4 text-2xl font-bold text-white">{title}</h2>
        <p className="mt-3 text-slate-400">
          {description || 'Upgrade to Business to unlock team operations, CSV exports, training mode, and API access.'}
        </p>
        <Button to="/pricing" className="mt-6">
          Upgrade Plan
        </Button>
      </div>
    </div>
  );
}
