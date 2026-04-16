import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import Modal from '../../components/Modal.jsx';
import { SkeletonCard } from '../../components/Skeleton.jsx';

export default function TeacherClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/classes');
      setClasses(data.classes);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const { data } = await api.post('/classes', form);
      setClasses((c) => [data.class, ...c]);
      setOpen(false);
      setForm({ name: '', code: '', description: '' });
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My Classes</h1>
          <p className="mt-1 text-sm text-slate-500">Create and manage your classes.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
        >
          + New Class
        </button>
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
          <div className="text-4xl">📚</div>
          <h3 className="mt-3 font-semibold text-slate-800">No classes yet</h3>
          <p className="text-sm text-slate-500 mt-1">
            Create your first class to start taking attendance.
          </p>
          <button
            onClick={() => setOpen(true)}
            className="mt-5 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
          >
            Create class
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => (
            <Link
              key={c._id}
              to={`/teacher/classes/${c._id}`}
              className="block p-5 rounded-2xl border border-slate-200 bg-white hover:shadow-md hover:border-slate-300 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-indigo-600">{c.code}</div>
                  <h3 className="mt-1 font-semibold text-slate-900">{c.name}</h3>
                </div>
                <span className="text-xs text-slate-400">
                  {c.students?.length || 0} students
                </span>
              </div>
              {c.description && (
                <p className="mt-2 text-sm text-slate-500 line-clamp-2">{c.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New Class">
        <form onSubmit={onCreate} className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Name</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Data Structures"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Code</span>
            <input
              required
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="CS201"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none uppercase"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Optional"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </label>

          {createError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {createError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-60"
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
