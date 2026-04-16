import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../lib/api';
import SessionList from '../../components/SessionList.jsx';

export default function StudentClassDetail() {
  const { id } = useParams();
  const [klass, setKlass] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [attData, setAttData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get(`/classes/${id}`),
      api.get('/sessions', { params: { classId: id } }),
      api.get(`/attendance/me/${id}`).catch(() => ({ data: null })),
    ])
      .then(([cRes, sRes, aRes]) => {
        if (cancelled) return;
        setKlass(cRes.data.class);
        setSessions(sRes.data.sessions);
        setAttData(aRes.data);
      })
      .catch((err) => !cancelled && setError(err.response?.data?.error || 'Failed to load'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-slate-500">Loading…</div>;
  }
  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
        <Link to="/student/classes" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
          ← Back to classes
        </Link>
      </div>
    );
  }
  if (!klass) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <Link to="/student/classes" className="text-sm text-slate-500 hover:text-slate-700">
        ← Back
      </Link>

      <div className="mt-4">
        <div className="text-xs font-semibold text-indigo-600">{klass.code}</div>
        <h1 className="text-2xl font-semibold text-slate-900">{klass.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Teacher: {klass.teacher?.name} ({klass.teacher?.email})
        </p>
        {klass.description && (
          <p className="mt-3 text-slate-600 max-w-2xl">{klass.description}</p>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 bg-white">
          <div className="text-xs text-slate-500">Classmates</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">
            {klass.students?.length || 0}
          </div>
        </div>
        <div className="p-5 rounded-2xl border border-slate-200 bg-white">
          <div className="text-xs text-slate-500">Present</div>
          <div className="mt-1 text-2xl font-semibold text-emerald-700">
            {attData ? attData.present : '—'}
          </div>
          <div className="text-xs text-slate-400">
            of {attData ? attData.total : '—'} sessions
          </div>
        </div>
        <div className="p-5 rounded-2xl border border-slate-200 bg-white">
          <div className="text-xs text-slate-500">Attendance %</div>
          <div className={`mt-1 text-2xl font-semibold ${
            attData
              ? attData.percentage >= 75
                ? 'text-emerald-700'
                : attData.percentage >= 50
                ? 'text-amber-600'
                : 'text-red-600'
              : 'text-slate-900'
          }`}>
            {attData ? `${attData.percentage}%` : '—'}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-2xl border border-slate-200">
        <div className="px-5 pt-5 pb-3 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Sessions</h2>
          <p className="text-xs text-slate-500 mt-1">
            Scan the QR code when a session is active to mark attendance.
          </p>
        </div>
        <SessionList
          sessions={sessions}
          basePath={`/student/classes/${id}/sessions`}
          empty="No sessions yet. Your teacher hasn't started one."
        />
      </div>
    </div>
  );
}
