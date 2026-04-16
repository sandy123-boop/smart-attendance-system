import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { SkeletonCard } from '../../components/Skeleton.jsx';

export default function StudentClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/classes')
      .then((res) => setClasses(res.data.classes))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My Classes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Classes you're enrolled in.
          </p>
        </div>
        <Link
          to="/student/scan"
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
        >
          📷 Scan QR
        </Link>
      </div>

      {error && (
        <div className="mt-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : classes.length === 0 ? (
        <div className="mt-10 text-center p-10 rounded-2xl border border-dashed border-slate-300 bg-white">
          <div className="text-4xl">🎓</div>
          <h3 className="mt-3 font-semibold text-slate-800">No classes yet</h3>
          <p className="text-sm text-slate-500 mt-1">
            Your teacher will add you to a class soon.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => (
            <Link
              key={c._id}
              to={`/student/classes/${c._id}`}
              className="block p-5 rounded-2xl border border-slate-200 bg-white hover:shadow-md hover:border-slate-300 transition"
            >
              <div className="text-xs font-semibold text-indigo-600">{c.code}</div>
              <h3 className="mt-1 font-semibold text-slate-900">{c.name}</h3>
              {c.description && (
                <p className="mt-2 text-sm text-slate-500 line-clamp-2">{c.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
