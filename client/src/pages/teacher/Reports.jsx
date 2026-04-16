import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../lib/api';
import { fmtDateTime, statusBadge } from '../../lib/format';

function pctColor(p) {
  if (p >= 75) return 'text-emerald-700';
  if (p >= 50) return 'text-amber-600';
  return 'text-red-600';
}

export default function Reports() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [view, setView] = useState('students'); // students | sessions

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (from) params.from = new Date(from).toISOString();
      if (to) params.to = new Date(`${to}T23:59:59`).toISOString();
      const { data: d } = await api.get(`/classes/${id}/attendance`, { params });
      setData(d);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const onFilter = (e) => {
    e.preventDefault();
    load();
  };

  const downloadCSV = () => {
    const params = new URLSearchParams();
    if (from) params.set('from', new Date(from).toISOString());
    if (to) params.set('to', new Date(`${to}T23:59:59`).toISOString());

    const stored = localStorage.getItem('sa_auth');
    const token = stored ? JSON.parse(stored).token : '';
    const url = `/api/classes/${id}/attendance/csv?${params.toString()}`;

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${data?.class?.code || 'attendance'}_report.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
  };

  if (loading && !data) {
    return <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-slate-500">Loading…</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <Link
        to={`/teacher/classes/${id}`}
        className="text-sm text-slate-500 hover:text-slate-700"
      >
        ← Back to class
      </Link>

      {data && (
        <div className="mt-4">
          <div className="text-xs font-semibold text-indigo-600">{data.class.code}</div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {data.class.name} — Attendance Reports
          </h1>
        </div>
      )}

      {error && (
        <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* Filters */}
      <form
        onSubmit={onFilter}
        className="mt-6 flex flex-wrap items-end gap-3 p-4 rounded-2xl border border-slate-200 bg-white"
      >
        <label className="block">
          <span className="text-xs font-medium text-slate-700">From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 block px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-700">To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 block px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
          />
        </label>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
        >
          Apply
        </button>
        {(from || to) && (
          <button
            type="button"
            onClick={() => {
              setFrom('');
              setTo('');
              setTimeout(load, 0);
            }}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
          >
            Clear
          </button>
        )}
        <div className="ml-auto">
          <button
            type="button"
            onClick={downloadCSV}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
          >
            ⬇ CSV
          </button>
        </div>
      </form>

      {data && (
        <>
          {/* Summary cards */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 bg-white">
              <div className="text-xs text-slate-500">Sessions</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{data.totalSessions}</div>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 bg-white">
              <div className="text-xs text-slate-500">Students</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{data.studentCount}</div>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 bg-white">
              <div className="text-xs text-slate-500">Date range</div>
              <div className="mt-1 text-sm text-slate-700">
                {data.sessions.length
                  ? `${new Date(
                      data.sessions[data.sessions.length - 1].startTime
                    ).toLocaleDateString()} — ${new Date(
                      data.sessions[0].startTime
                    ).toLocaleDateString()}`
                  : 'No sessions'}
              </div>
            </div>
          </div>

          {/* View toggle */}
          <div className="mt-6 flex gap-1 p-1 rounded-lg bg-slate-100 w-fit">
            {['students', 'sessions'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize ${
                  view === v
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {view === 'students' ? (
            <StudentTable students={data.students} />
          ) : (
            <SessionTable sessions={data.sessions} students={data.students} />
          )}
        </>
      )}
    </div>
  );
}

function StudentTable({ students }) {
  if (!students.length) {
    return (
      <div className="mt-4 p-8 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
        No students enrolled.
      </div>
    );
  }
  return (
    <>
      {/* Desktop table */}
      <div className="mt-4 hidden sm:block overflow-x-auto bg-white rounded-2xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-500 uppercase">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Roll No</th>
              <th className="px-4 py-3 text-center">Present</th>
              <th className="px-4 py-3 text-center">Absent</th>
              <th className="px-4 py-3 text-center">Total</th>
              <th className="px-4 py-3 text-center">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((s) => (
              <tr key={s.student._id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{s.student.name}</div>
                  <div className="text-xs text-slate-500">{s.student.email}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{s.student.rollNo || '—'}</td>
                <td className="px-4 py-3 text-center text-emerald-700 font-medium">
                  {s.present}
                </td>
                <td className="px-4 py-3 text-center text-red-600 font-medium">{s.absent}</td>
                <td className="px-4 py-3 text-center text-slate-700">{s.total}</td>
                <td className={`px-4 py-3 text-center font-bold ${pctColor(s.percentage)}`}>
                  {s.percentage}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mt-4 sm:hidden space-y-3">
        {students.map((s) => (
          <div
            key={s.student._id}
            className="p-4 rounded-2xl border border-slate-200 bg-white"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium text-slate-900 truncate">{s.student.name}</div>
                <div className="text-xs text-slate-500 truncate">{s.student.email}</div>
                {s.student.rollNo && (
                  <div className="text-xs text-slate-400 mt-0.5">{s.student.rollNo}</div>
                )}
              </div>
              <div className={`text-xl font-bold ${pctColor(s.percentage)}`}>
                {s.percentage}%
              </div>
            </div>
            <div className="mt-3 flex gap-4 text-xs text-slate-500">
              <span><span className="font-semibold text-emerald-700">{s.present}</span> present</span>
              <span><span className="font-semibold text-red-600">{s.absent}</span> absent</span>
              <span>{s.total} total</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function SessionTable({ sessions, students }) {
  if (!sessions.length) {
    return (
      <div className="mt-4 p-8 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
        No sessions in this range.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {sessions.map((sess) => {
        const recs = students
          .map((s) => {
            const found = s.sessions.find(
              (r) => String(r.sessionId) === String(sess._id)
            );
            return {
              student: s.student,
              status: found?.status || null,
              scannedAt: found?.scannedAt,
            };
          })
          .sort((a, b) => {
            const rank = (v) => (v === 'present' ? 0 : v === 'absent' ? 2 : 1);
            return rank(a.status) - rank(b.status);
          });

        const present = recs.filter((r) => r.status === 'present').length;
        const total = recs.length;

        return (
          <div
            key={sess._id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
              <div>
                <div className="font-medium text-slate-900">{sess.title}</div>
                <div className="text-xs text-slate-500">{fmtDateTime(sess.startTime)}</div>
              </div>
              <div className="text-sm">
                <span className="font-semibold text-emerald-700">{present}</span>
                <span className="text-slate-400">/{total}</span>
              </div>
            </div>
            <ul className="divide-y divide-slate-100">
              {recs.map((r) => (
                <li
                  key={r.student._id}
                  className="px-4 py-2 flex items-center justify-between gap-3"
                >
                  <div className="text-sm text-slate-700">
                    {r.student.name}
                    {r.student.rollNo ? (
                      <span className="text-slate-400"> · {r.student.rollNo}</span>
                    ) : null}
                  </div>
                  <span
                    className={`text-[11px] font-semibold uppercase ${
                      r.status === 'present'
                        ? 'text-emerald-700'
                        : r.status === 'absent'
                        ? 'text-red-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {r.status || 'N/A'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
