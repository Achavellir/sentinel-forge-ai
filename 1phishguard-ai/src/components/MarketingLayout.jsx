import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import { Button } from './ui';
import { cn } from '../lib/utils';

const navLinks = [
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/#faq' },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy/82 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) =>
            link.href.startsWith('/#') ? (
              <a key={link.label} href={link.href} className="text-sm font-medium text-slate-300 transition hover:text-white">
                {link.label}
              </a>
            ) : (
              <NavLink
                key={link.label}
                to={link.href}
                className={({ isActive }) =>
                  cn('text-sm font-medium transition hover:text-white', isActive ? 'text-white' : 'text-slate-300')
                }
              >
                {link.label}
              </NavLink>
            ),
          )}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Button to="/login" variant="ghost" size="sm">
            Login
          </Button>
          <Button to="/signup" size="sm">
            Start for Free
          </Button>
        </div>
        <button
          type="button"
          className="rounded-lg border border-slate-700 p-2 text-slate-200 md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-white/10 bg-navy px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Button to="/login" variant="secondary" className="mt-2" onClick={() => setOpen(false)}>
              Login
            </Button>
            <Button to="/signup" onClick={() => setOpen(false)}>
              Start for Free
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr] lg:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-slate-400">
            AI phishing detection, reporting, and team workflows for security-conscious companies.
          </p>
        </div>
        <div>
          <h3 className="font-mono text-xs font-bold uppercase text-slate-500">Product</h3>
          <div className="mt-4 grid gap-2 text-sm text-slate-300">
            <Link to="/pricing" className="hover:text-white">
              Pricing
            </Link>
            <Link to="/dashboard/scan" className="hover:text-white">
              Scanner
            </Link>
            <Link to="/billing" className="hover:text-white">
              Billing
            </Link>
          </div>
        </div>
        <div>
          <h3 className="font-mono text-xs font-bold uppercase text-slate-500">Company</h3>
          <div className="mt-4 grid gap-2 text-sm text-slate-300">
            <Link to="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-white">
              Terms
            </Link>
            <a href="mailto:security@1phishguard.io" className="hover:text-white">
              security@1phishguard.io
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-sm text-slate-500">
        © 2026 1PhishGuard AI. All rights reserved.
      </div>
    </footer>
  );
}

export function MarketingLayout({ children }) {
  return (
    <div className="min-h-screen bg-navy text-slate-100">
      <MarketingNav />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
