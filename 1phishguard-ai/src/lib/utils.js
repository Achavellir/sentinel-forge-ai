export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(value, options = {}) {
  if (!value) return 'N/A';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  }).format(new Date(value));
}

export function clamp(value, min = 0, max = 100) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

export function getVerdictMeta(verdict = 'SAFE') {
  const key = String(verdict).toUpperCase();
  if (key === 'PHISHING') {
    return {
      label: 'Phishing',
      badge: 'border-phishing/40 bg-phishing/15 text-red-200',
      dot: 'bg-phishing',
      bar: 'risk-bar-phishing',
      text: 'text-red-200',
    };
  }
  if (key === 'SUSPICIOUS') {
    return {
      label: 'Suspicious',
      badge: 'border-suspicious/40 bg-suspicious/15 text-amber-200',
      dot: 'bg-suspicious',
      bar: 'risk-bar-suspicious',
      text: 'text-amber-200',
    };
  }
  return {
    label: 'Safe',
    badge: 'border-safe/40 bg-safe/15 text-emerald-200',
    dot: 'bg-safe',
    bar: 'risk-bar-safe',
    text: 'text-emerald-200',
  };
}

export function buildEmailPreview(emailText) {
  return emailText
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
}

export function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? '');
          return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
        })
        .join(','),
    )
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const planRank = {
  free: 0,
  pro: 1,
  business: 2,
};
