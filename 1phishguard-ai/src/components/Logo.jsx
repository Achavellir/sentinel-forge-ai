import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export function Logo({ to = '/', className, compact = false }) {
  const content = (
    <span className={cn('inline-flex items-center gap-3 text-white', className)}>
      <span className="grid h-10 w-10 place-items-center rounded-lg border border-cyan/30 bg-cyan/10 text-cyan shadow-cyan">
        <ShieldCheck className="h-5 w-5" aria-hidden="true" />
      </span>
      {!compact && (
        <span>
          <span className="block font-mono text-base font-bold leading-none">1PhishGuard</span>
          <span className="block font-mono text-xs font-bold uppercase text-cyan">AI</span>
        </span>
      )}
    </span>
  );

  return to ? (
    <Link to={to} aria-label="1PhishGuard AI home">
      {content}
    </Link>
  ) : (
    content
  );
}
