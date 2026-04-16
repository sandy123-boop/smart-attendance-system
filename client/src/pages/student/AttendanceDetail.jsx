import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../lib/api';
import { fmtDateTime } from '../../lib/format';

function pctColor(p) {
  if (p >= 75) return 'text-emerald-700';
  if (p >= 50) return 'text-amber-600';
  return 'text-red-600';
}

function pctBg(p) {
  if (p >= 75) return 'bg-emerald-500';
  if (p >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function AttendanceDetail() {
  const { classId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/attendance/me/${classId}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [classId]);

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-slate-500">Loading…</div>;
  }
  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
        <Link to="/student/attendance" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
          ← Back
        </Link>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <Link to="/student/attendance" className="text-sm text-slate-500 hover:text-slate-700">
        ← Back to attendance
      </Link>

      <div className="mt-4">
        <div className="text-xs font-semibold text-indigo-600">{data.class.code}</div>
        <h1 className="text-2xl font-semibold text-slate-900">{data.class.name}</h1>
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 bg-white">
          <div className="text-xs text-slate-500">Attendance %</div>
          <div className={`mt-1 text-2xl font-bold ${pctColor(data.percentage)}`}>
            {data.percentage}%
          </div>
          <div className="mt-2 w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${pctBg(data.percentage)}`}
              style={{ width: `${data.percentage}%` }}
            />
          </div>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 bg-white">
          <div className="text-xs text-slate-500">Present</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700">{data.present}</div>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 bg-white">
          <div className="text-xs text-slate-500">Absent</div>
          <div className="mt-1 text-2xl font-bold text-red-600">{data.absent}</div>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 bg-white">
          <div className="text-xs text-slate-500">Total</div>
          <div className="mt-1 text-2xl font-bold text-slate-700">{data.total}</div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-2xl border border-slate-200">
        <div className="px-5 pt-5 pb-3 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Session History</h2>
        </div>
        {data.records.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            No sessions recorded yet.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.records.map((r) => (
              <li key={r._id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">
                    {r.session?.title || 'Session'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {fmtDateTime(r.session?.startTime)}
                    {r.session?.durationMin ? ` · ${r.session.durationMin} min` : ''}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span
                    className={`text-[11px] font-semibold uppercase ${
                      r.status === 'present' ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {r.status}
                  </span>
                  {r.scannedAt && (
                    <span className="text-[10px] text-slate-400">
                      scanned {new Date(r.scannedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
