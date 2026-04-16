import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

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

export default function StudentAttendance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/attendance/me')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-slate-500">Loading…</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">My Attendance</h1>
      <p className="mt-1 text-sm text-slate-500">Your attendance across all classes.</p>

      {error && (
        <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {data && (
        <>
          {/* Overall stats */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Overall %"
              value={`${data.overall.percentage}%`}
              className={pctColor(data.overall.percentage)}
            />
            <StatCard label="Present" value={data.overall.present} className="text-emerald-700" />
            <StatCard label="Absent" value={data.overall.absent} className="text-red-600" />
            <StatCard label="Total Sessions" value={data.overall.total} className="text-slate-700" />
          </div>

          {/* Per-class */}
          {data.classes.length === 0 ? (
            <div className="mt-10 text-center p-10 rounded-2xl border border-dashed border-slate-300 bg-white">
              <div className="text-4xl">📊</div>
              <h3 className="mt-3 font-semibold text-slate-800">No attendance data yet</h3>
              <p className="text-sm text-slate-500 mt-1">
                Once your teachers start sessions and you scan the QR, your records appear here.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.classes.map((c) => (
                <Link
                  key={c.class._id}
                  to={`/student/attendance/${c.class._id}`}
                  className="block p-5 rounded-2xl border border-slate-200 bg-white hover:shadow-md hover:border-slate-300 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-indigo-600">{c.class.code}</div>
                      <h3 className="mt-1 font-semibold text-slate-900">{c.class.name}</h3>
                    </div>
                    <div className={`text-2xl font-bold ${pctColor(c.percentage)}`}>
                      {c.percentage}%
                    </div>
                  </div>
                  <div className="mt-3 w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pctBg(c.percentage)}`}
                      style={{ width: `${c.percentage}%` }}
                    />
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-slate-500">
                    <span>
                      <span className="font-medium text-emerald-700">{c.present}</span> present
                    </span>
                    <span>
                      <span className="font-medium text-red-600">{c.absent}</span> absent
                    </span>
                    <span>{c.total} total</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, className }) {
  return (
    <div className="p-4 rounded-2xl border border-slate-200 bg-white">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${className}`}>{value}</div>
    </div>
  );
}
