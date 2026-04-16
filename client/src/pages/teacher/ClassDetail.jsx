import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';
import Modal from '../../components/Modal.jsx';
import StudentPicker from '../../components/StudentPicker.jsx';
import SessionList from '../../components/SessionList.jsx';

export default function ClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [klass, setKlass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editError, setEditError] = useState('');
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    title: '',
    startTime: '',
    durationMin: 60,
  });
  const [startingSession, setStartingSession] = useState(false);
  const [sessionError, setSessionError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/classes/${id}`);
      setKlass(data.class);
      setForm({
        name: data.class.name,
        code: data.class.code,
        description: data.class.description || '',
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const { data } = await api.get('/sessions', { params: { classId: id } });
      setSessions(data.sessions);
    } catch {
      /* ignore */
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadSessions();
  }, [id]);

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setEditError('');
    try {
      const { data } = await api.put(`/classes/${id}`, form);
      setKlass((k) => ({ ...k, ...data.class }));
      setEditOpen(false);
    } catch (err) {
      setEditError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const onStartSession = async (e) => {
    e.preventDefault();
    setSessionError('');
    setStartingSession(true);
    try {
      const payload = {
        classId: id,
        title: sessionForm.title,
        durationMin: Number(sessionForm.durationMin),
      };
      if (sessionForm.startTime) payload.startTime = new Date(sessionForm.startTime).toISOString();
      const { data } = await api.post('/sessions', payload);
      setSessions((prev) => [data.session, ...prev]);
      setSessionOpen(false);
      setSessionForm({ title: '', startTime: '', durationMin: 60 });
      navigate(`/teacher/sessions/${data.session._id}`);
    } catch (err) {
      setSessionError(err.response?.data?.error || 'Failed to start session');
    } finally {
      setStartingSession(false);
    }
  };

  const onAddStudent = async (student) => {
    try {
      const { data } = await api.post(`/classes/${id}/assign`, { studentId: student._id });
      setKlass(data.class);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign student');
    }
  };

  const onRemoveStudent = async (studentId) => {
    try {
      const { data } = await api.delete(`/classes/${id}/assign/${studentId}`);
      setKlass(data.class);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove student');
    }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/classes/${id}`);
      navigate('/teacher/classes', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete');
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-slate-500">Loading…</div>;
  }
  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
        <Link to="/teacher/classes" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
          ← Back to classes
        </Link>
      </div>
    );
  }
  if (!klass) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <Link to="/teacher/classes" className="text-sm text-slate-500 hover:text-slate-700">
        ← Back
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs font-semibold text-indigo-600">{klass.code}</div>
          <h1 className="text-2xl font-semibold text-slate-900">{klass.name}</h1>
          {klass.description && (
            <p className="mt-2 text-slate-600 max-w-2xl">{klass.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/teacher/classes/${id}/reports`}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            Reports
          </Link>
          <button
            onClick={() => setEditOpen(true)}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
          >
            Edit
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="px-4 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-medium hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 bg-white">
          <div className="text-xs text-slate-500">Students</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">
            {klass.students?.length || 0}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Use the roster below to manage.
          </p>
        </div>
        <div className="p-5 rounded-2xl border border-slate-200 bg-white">
          <div className="text-xs text-slate-500">Sessions</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">—</div>
          <p className="mt-2 text-xs text-slate-400">Start a session from the section below.</p>
        </div>
        <Link
          to={`/teacher/classes/${id}/reports`}
          className="block p-5 rounded-2xl border border-slate-200 bg-white hover:shadow-md transition"
        >
          <div className="text-xs text-slate-500">Reports</div>
          <div className="mt-1 text-2xl font-semibold text-indigo-600">View →</div>
          <p className="mt-2 text-xs text-slate-400">
            Per-student stats, session drill-down, CSV export
          </p>
        </Link>
      </div>

      <div className="mt-8 bg-white rounded-2xl border border-slate-200">
        <div className="px-5 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-900">Sessions</h2>
            <p className="text-xs text-slate-500 mt-1">
              Start a session to generate a QR for attendance.
            </p>
          </div>
          <button
            onClick={() => setSessionOpen(true)}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
          >
            + Start Session
          </button>
        </div>
        {sessionsLoading ? (
          <div className="px-5 py-8 text-sm text-slate-500">Loading…</div>
        ) : (
          <SessionList
            sessions={sessions}
            basePath="/teacher/sessions"
            empty="No sessions yet. Start one to begin."
          />
        )}
      </div>

      <div className="mt-6 bg-white rounded-2xl border border-slate-200">
        <div className="px-5 pt-5 pb-3 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Roster</h2>
          <p className="text-xs text-slate-500 mt-1">
            Search and add students. They'll see this class in their dashboard.
          </p>
          <div className="mt-4">
            <StudentPicker
              enrolledIds={(klass.students || []).map((s) => s._id)}
              onAdd={onAddStudent}
            />
          </div>
        </div>

        {(klass.students || []).length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            No students yet. Use the search above to add some.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {klass.students.map((s) => (
              <li key={s._id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-slate-100 grid place-items-center text-sm font-semibold text-slate-700">
                    {(s.name || '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{s.name}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {s.email}
                      {s.rollNo ? ` · ${s.rollNo}` : ''}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveStudent(s._id)}
                  className="text-xs font-medium px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-red-600 hover:border-red-200"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal open={sessionOpen} onClose={() => setSessionOpen(false)} title="Start a Session">
        <form onSubmit={onStartSession} className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Title (lecture name)</span>
            <input
              required
              value={sessionForm.title}
              onChange={(e) =>
                setSessionForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="e.g. Lecture 3 — Graph traversal"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Start time</span>
              <input
                type="datetime-local"
                value={sessionForm.startTime}
                onChange={(e) =>
                  setSessionForm((f) => ({ ...f, startTime: e.target.value }))
                }
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
              <span className="mt-1 block text-xs text-slate-400">
                Leave blank to start now
              </span>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Duration (min)</span>
              <input
                type="number"
                required
                min={1}
                max={480}
                value={sessionForm.durationMin}
                onChange={(e) =>
                  setSessionForm((f) => ({ ...f, durationMin: e.target.value }))
                }
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </label>
          </div>

          {sessionError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {sessionError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSessionOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={startingSession}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-60"
            >
              {startingSession ? 'Starting…' : 'Start session'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Class">
        <form onSubmit={onSave} className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Name</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Code</span>
            <input
              required
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none uppercase"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </label>

          {editError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {editError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Class">
        <p className="text-sm text-slate-600">
          This will permanently delete <span className="font-semibold">{klass.name}</span>. This action cannot be undone.
        </p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={() => setDeleteOpen(false)}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
