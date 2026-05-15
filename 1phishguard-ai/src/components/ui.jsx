import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const variants = {
  primary: 'bg-primary text-white shadow-glow hover:bg-blue-500',
  secondary:
    'border border-slate-700 bg-slate-900/70 text-slate-100 hover:border-cyan/50 hover:bg-slate-800',
  ghost: 'text-slate-300 hover:bg-slate-800/70 hover:text-white',
  danger: 'border border-phishing/40 bg-phishing/10 text-red-100 hover:bg-phishing/20',
};

export function Button({
  as: Component = 'button',
  to,
  variant = 'primary',
  size = 'md',
  loading,
  className,
  children,
  ...props
}) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-mono text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60',
    variants[variant],
    size === 'sm' && 'h-9 px-3',
    size === 'md' && 'h-11 px-5',
    size === 'lg' && 'h-12 px-6',
    className,
  );

  const content = (
    <>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <Component className={classes} disabled={loading || props.disabled} {...props}>
      {content}
    </Component>
  );
}

export function Card({ className, children }) {
  return <div className={cn('glass rounded-lg p-5', className)}>{children}</div>;
}

export function Badge({ className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-normal',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Field({ label, error, children, hint }) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-xs font-bold uppercase text-slate-400">{label}</span>
      {children}
      {hint && !error && <span className="mt-2 block text-sm text-slate-500">{hint}</span>}
      {error && <span className="mt-2 block text-sm text-red-300">{error}</span>}
    </label>
  );
}

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan focus:ring-2 focus:ring-cyan/20',
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        'w-full rounded-lg border border-slate-700 bg-slate-950/70 p-4 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan focus:ring-2 focus:ring-cyan/20',
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        'h-11 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-slate-100 outline-none transition focus:border-cyan focus:ring-2 focus:ring-cyan/20',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-950/40 p-4">
      <span>
        <span className="block font-medium text-slate-100">{label}</span>
        {description && <span className="block text-sm text-slate-500">{description}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-cyan"
      />
    </label>
  );
}

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-lg bg-slate-800/70', className)} />;
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <Card className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && <Icon className="mb-4 h-10 w-10 text-cyan" aria-hidden="true" />}
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-400">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}
