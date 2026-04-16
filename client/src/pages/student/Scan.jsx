import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import QrScanner from '../../components/QrScanner.jsx';

export default function Scan() {
  const [result, setResult] = useState(null); // {ok, message, session?}
  const [submitting, setSubmitting] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);

  const handleDecode = async (token) => {
    if (submitting) return;
    setSubmitting(true);
    setResult(null);
    try {
      const { data } = await api.post('/attendance/mark', { token });
      setResult({
        ok: true,
        message: `Attendance marked for "${data.session?.title || 'session'}"`,
      });
    } catch (err) {
      setResult({
        ok: false,
        message: err.response?.data?.error || 'Scan failed',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const scanAgain = () => {
    setResult(null);
    setScannerKey((k) => k + 1);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Link to="/student/classes" className="text-sm text-slate-500 hover:text-slate-700">
        ← Back
      </Link>

      <h1 className="mt-3 text-xl sm:text-2xl font-semibold text-slate-900">Scan QR</h1>
      <p className="mt-1 text-sm text-slate-500">
        Point your camera at the session QR to mark attendance.
      </p>

      <div className="mt-6">
        {!result && (
          <QrScanner key={scannerKey} onDecode={handleDecode} paused={submitting} />
        )}
        {submitting && (
          <div className="mt-4 text-center text-sm text-slate-500">Marking…</div>
        )}
      </div>

      {result && (
        <div
          className={`mt-6 p-5 rounded-2xl border ${
            result.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="text-2xl">{result.ok ? '✅' : '❌'}</div>
          <div className="mt-2 font-semibold">
            {result.ok ? 'You are marked present' : 'Could not mark attendance'}
          </div>
          <div className="mt-1 text-sm opacity-90">{result.message}</div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={scanAgain}
              className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
            >
              Scan another
            </button>
            <Link
              to="/student/classes"
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
            >
              Done
            </Link>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
        Tip — you must allow camera access for scanning. You must be enrolled in
        the class and the session must be active. On phones, use the browser's
        camera permission setting if the prompt doesn't appear.
      </div>
    </div>
  );
}
