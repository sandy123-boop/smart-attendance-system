import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  department: '',
  rollNo: '',
  avatarUrl: '',
  role: '',
};

export default function Profile() {
  const { auth, login } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .get('/users/me')
      .then((res) => {
        if (cancelled) return;
        setForm({ ...EMPTY, ...res.data.user });
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage(null);
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        avatarUrl: form.avatarUrl,
      };
      if (form.role === 'teacher') payload.department = form.department;
      if (form.role === 'student') payload.rollNo = form.rollNo;

      const { data } = await api.put('/users/me', payload);
      setForm({ ...EMPTY, ...data.user });
      login(data.user, auth.token);
      setMessage('Profile updated');
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-slate-500">Loading…</div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 grid place-items-center text-white text-xl font-bold overflow-hidden">
            {form.avatarUrl ? (
              <img src={form.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              (form.name || '?').slice(0, 1).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">My Profile</h1>
            <p className="text-sm text-slate-500 capitalize">{form.role}</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full name" value={form.name} onChange={update('name')} required />
          <Field label="Email" value={form.email} readOnly hint="Email cannot be changed" />
          <Field label="Phone" value={form.phone} onChange={update('phone')} />
          {form.role === 'teacher' && (
            <Field
              label="Department"
              value={form.department}
              onChange={update('department')}
            />
          )}
          {form.role === 'student' && (
            <Field
              label="Roll number"
              value={form.rollNo}
              onChange={update('rollNo')}
            />
          )}
          <div className="sm:col-span-2">
            <Field
              label="Avatar URL"
              value={form.avatarUrl}
              onChange={update('avatarUrl')}
              placeholder="https://…"
            />
          </div>

          {error && (
            <div className="sm:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}
          {message && (
            <div className="sm:col-span-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
              {message}
            </div>
          )}

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, hint, readOnly, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        {...props}
        readOnly={readOnly}
        className={`mt-1 w-full px-3 py-2 rounded-lg border outline-none transition ${
          readOnly
            ? 'border-slate-200 bg-slate-50 text-slate-500'
            : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
        }`}
      />
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}
