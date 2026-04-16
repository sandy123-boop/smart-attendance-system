import { Link } from 'react-router-dom';
import { fmtDateTime, statusBadge } from '../lib/format';

export default function SessionList({ sessions = [], basePath, empty }) {
  if (!sessions.length) {
    return (
      <div className="px-5 py-10 text-center text-sm text-slate-500">
        {empty || 'No sessions yet.'}
      </div>
    );
  }
  return (
    <ul className="divide-y divide-slate-100">
      {sessions.map((s) => (
        <li key={s._id}>
          <Link
            to={`${basePath}/${s._id}`}
            className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate">{s.title}</div>
              <div className="text-xs text-slate-500">
                {fmtDateTime(s.startTime)} · {s.durationMin} min
              </div>
            </div>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wide ${statusBadge(
                s.status
              )}`}
            >
              {s.status}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
