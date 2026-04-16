import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../lib/api';
import { fmtDateTime, statusBadge } from '../../lib/format';
import { useSocket } from '../../context/SocketContext.jsx';
import { useToast } from '../../components/Toast.jsx';

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function LiveSession() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [qr, setQr] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(Date.now());
  const [attendance, setAttendance] = useState(null);
  const [ending, setEnding] = useState(false);
  const [summary, setSummary] = useState(null);
  const { socket } = useSocket();
  const { addToast } = useToast();
  const rotationRef = useRef(null);

  const loadSession = async () => {
    try {
      const { data } = await api.get(`/sessions/${id}`);
      setSession(data.session);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    try {
      const { data } = await api.get(`/attendance/session/${id}`);
      setAttendance(data);
    } catch {
      /* ignore */
    }
  };

  const loadQR = async () => {
    try {
      const { data } = await api.get(`/sessions/${id}/qr`);
      setQr(data);
    } catch (err) {
      setQr(null);
      if (err.response?.data?.error) setError(err.response.data.error);
    }
  };

  const endSession = async () => {
    setEnding(true);
    try {
      const { data } = await api.post(`/sessions/${id}/end`);
      setSession((s) => ({ ...s, status: 'ended', endTime: data.session.endTime }));
      setSummary(data.summary);
      setQr(null);
      loadAttendance();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to end session');
    } finally {
      setEnding(false);
    }
  };

  useEffect(() => {
    loadSession();
    loadAttendance();
  }, [id]);

  useEffect(() => {
    if (!session) return;
    if (session.status === 'ended') return;

    loadQR();
    rotationRef.current = setInterval(() => {
      loadQR();
      setTick(Date.now());
    }, 10_000);
    const t = setInterval(() => setTick(Date.now()), 1000);
    return () => {
      clearInterval(rotationRef.current);
      clearInterval(t);
    };
  }, [session?._id, session?.status]);

  // Real-time attendance via socket
  useEffect(() => {
    if (!socket || !session) return;

    const handler = (data) => {
      if (data.sessionId !== String(session._id)) return;
      addToast(`${data.student.name} marked present`, 'success', 3000);
      setAttendance((prev) => {
        if (!prev) return prev;
        const already = prev.roster.find(
          (r) => String(r.student._id) === String(data.student._id)
        );
        if (already) {
          return {
            ...prev,
            present: prev.present + (already.status === 'present' ? 0 : 1),
            pending: Math.max(0, prev.pending - (already.status === null ? 1 : 0)),
            roster: prev.roster.map((r) =>
              String(r.student._id) === String(data.student._id)
                ? { ...r, status: 'present', scannedAt: data.scannedAt }
                : r
            ),
          };
        }
        return {
          ...prev,
          present: prev.present + 1,
          pending: Math.max(0, prev.pending - 1),
          roster: [
            { student: data.student, status: 'present', scannedAt: data.scannedAt },
            ...prev.roster,
          ],
        };
      });
    };

    const endHandler = (data) => {
      if (data.sessionId !== String(session._id)) return;
      setSession((s) => ({ ...s, status: 'ended' }));
      setSummary({ present: data.present, absent: data.absent, total: data.total });
      setQr(null);
      loadAttendance();
    };

    socket.on('attendance:marked', handler);
    socket.on('session:ended', endHandler);
    return () => {
      socket.off('attendance:marked', handler);
      socket.off('session:ended', endHandler);
    };
  }, [socket, session?._id, addToast]);

  if (loading) {
    return <div className="max-w-6xl mx-auto px-6 py-12 text-slate-500">Loading…</div>;
  }
  if (error && !session) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      </div>
    );
  }
  if (!session) return null;

  const endMs = new Date(session.endTime).getTime();
  const remainingMs = Math.max(0, endMs - tick);
  const mins = Math.floor(remainingMs / 60000);
  const secs = Math.floor((remainingMs % 60000) / 1000);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <Link
        to={`/teacher/classes/${session.class?._id}`}
        className="text-sm text-slate-500 hover:text-slate-700"
      >
        ← Back to class
      </Link>

      <div className="mt-3 sm:mt-4 flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-indigo-600 truncate">
            {session.class?.code} · {session.class?.name}
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 truncate">{session.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {fmtDateTime(session.startTime)} · {session.durationMin} min
          </p>
        </div>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full border uppercase tracking-wide ${statusBadge(
            session.status
          )}`}
        >
          {session.status}
        </span>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center">
          {session.status === 'ended' ? (
            <div className="py-12 text-center w-full">
              {summary ? (
                <div className="space-y-4">
                  <div className="text-5xl">📋</div>
                  <h3 className="text-lg font-semibold text-slate-900">Session ended</h3>
                  <div className="flex items-center justify-center gap-6">
                    <div>
                      <div className="text-2xl font-bold text-emerald-700">{summary.present}</div>
                      <div className="text-xs text-slate-500">Present</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{summary.absent}</div>
                      <div className="text-xs text-slate-500">Absent</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-700">{summary.total}</div>
                      <div className="text-xs text-slate-500">Total</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500">Session has ended. QR is no longer available.</div>
              )}
            </div>
          ) : qr ? (
            <>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Scan to mark attendance
              </div>
              <img
                src={qr.dataUrl}
                alt="QR code"
                className="mt-4 w-full max-w-md aspect-square object-contain"
              />
              <div className="mt-4 text-xs text-slate-400">
                Token rotates every 15s · Students must be enrolled in this class
              </div>
            </>
          ) : (
            <div className="py-24 text-slate-500">Generating QR…</div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-2xl border border-slate-200 bg-white">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Time remaining</div>
            <div className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </div>
            <div className="mt-1 text-xs text-slate-400">Ends at {fmtDateTime(session.endTime)}</div>
            {session.status !== 'ended' && (
              <button
                onClick={endSession}
                disabled={ending}
                className="mt-4 w-full py-2 rounded-lg border border-red-200 text-red-700 text-sm font-medium hover:bg-red-50 disabled:opacity-60"
              >
                {ending ? 'Ending…' : 'End session now'}
              </button>
            )}
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500 uppercase tracking-wide">Roster</div>
              {attendance && (
                <div className="text-xs text-slate-500">
                  <span className="font-semibold text-emerald-700">{attendance.present}</span>
                  <span className="mx-1">/</span>
                  <span>{attendance.total}</span>
                </div>
              )}
            </div>
            <div className="mt-3 max-h-80 overflow-auto divide-y divide-slate-100">
              {!attendance ? (
                <div className="py-4 text-sm text-slate-500">Loading roster…</div>
              ) : attendance.roster.length === 0 ? (
                <div className="py-4 text-sm text-slate-500">No students enrolled.</div>
              ) : (
                attendance.roster.map((r) => (
                  <div
                    key={r.student._id}
                    className="py-2 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {r.student.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {r.student.email}
                        {r.student.rollNo ? ` · ${r.student.rollNo}` : ''}
                      </div>
                    </div>
                    {r.status === 'present' ? (
                      <div className="text-right">
                        <div className="text-[11px] font-semibold text-emerald-700">
                          PRESENT
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {fmtTime(r.scannedAt)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] font-semibold text-slate-400">
                        PENDING
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
