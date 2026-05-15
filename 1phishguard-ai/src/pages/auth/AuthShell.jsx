import { Link } from 'react-router-dom';
import { Logo } from '../../components/Logo';
import { Card } from '../../components/ui';

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen place-items-center bg-navy px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.2),transparent_34%),radial-gradient(circle_at_20%_80%,rgba(6,182,212,0.12),transparent_28%)]" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <Card>
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-black text-white">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-slate-400">{subtitle}</p>}
          </div>
          {children}
          {footer && <div className="mt-6 text-center text-sm text-slate-400">{footer}</div>}
        </Card>
        <div className="mt-6 text-center">
          <Link to="/" className="font-mono text-xs font-bold uppercase text-slate-500 hover:text-cyan">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
