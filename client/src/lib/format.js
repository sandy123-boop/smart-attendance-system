export function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function statusBadge(status) {
  const map = {
    scheduled: 'bg-amber-50 text-amber-700 border-amber-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ended: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return map[status] || map.ended;
}
