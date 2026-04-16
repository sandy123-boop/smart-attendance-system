import { useEffect, useRef, useState } from 'react';
import api from '../lib/api';

export default function StudentPicker({ enrolledIds = [], onAdd, disabled }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/users/students', { params: { search: q } });
        setResults(data.students);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timerRef.current);
  }, [q]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!boxRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const enrolledSet = new Set(enrolledIds.map(String));

  return (
    <div className="relative" ref={boxRef}>
      <input
        disabled={disabled}
        value={q}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        placeholder="Search students by name, email, or roll no."
        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none disabled:bg-slate-50"
      />
      {open && (q || results.length > 0) && (
        <div className="absolute z-10 mt-1 w-full max-h-72 overflow-auto bg-white border border-slate-200 rounded-lg shadow-lg">
          {loading && <div className="px-3 py-2 text-sm text-slate-500">Searching…</div>}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-sm text-slate-500">No students found</div>
          )}
          {!loading &&
            results.map((s) => {
              const isEnrolled = enrolledSet.has(String(s._id));
              return (
                <button
                  key={s._id}
                  type="button"
                  disabled={isEnrolled}
                  onClick={() => {
                    onAdd(s);
                    setQ('');
                    setResults([]);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between gap-3 border-b border-slate-100 last:border-b-0 ${
                    isEnrolled
                      ? 'bg-slate-50 cursor-not-allowed'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium text-slate-900">{s.name}</div>
                    <div className="text-xs text-slate-500">
                      {s.email}
                      {s.rollNo ? ` · ${s.rollNo}` : ''}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isEnrolled ? 'text-slate-400' : 'text-indigo-600'
                    }`}
                  >
                    {isEnrolled ? 'Enrolled' : '+ Add'}
                  </span>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}
