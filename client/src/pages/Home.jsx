import { Link } from 'react-router-dom';

const features = [
  {
    title: 'QR-based Attendance',
    desc: 'Teachers start a session and students scan a secure QR to mark attendance instantly.',
    icon: '📷',
  },
  {
    title: 'Real-time Tracking',
    desc: 'Watch the roster update live as students check in during a session.',
    icon: '⚡',
  },
  {
    title: 'Accurate Reports',
    desc: 'Per-class, per-session and per-student attendance percentages with CSV export.',
    icon: '📊',
  },
  {
    title: 'Role-based Access',
    desc: 'Separate, secure experiences for teachers and students — nothing gets crossed.',
    icon: '🔐',
  },
  {
    title: 'Works on Any Device',
    desc: 'Fully responsive — use it on a classroom projector, laptop, or phone.',
    icon: '📱',
  },
  {
    title: 'Session Notifications',
    desc: 'Students are notified the moment a session opens. No missed check-ins.',
    icon: '🔔',
  },
];

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <section className="pt-16 pb-20 text-center">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
          MERN · QR · Real-time
        </span>
        <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
          Attendance that takes <span className="text-indigo-600">seconds</span>,
          <br className="hidden sm:block" /> not minutes.
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-slate-600">
          A smart, secure attendance platform for teachers and students. Start a
          session, share a QR, and watch the roster fill in real-time.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to="/signup"
            className="px-5 py-2.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800"
          >
            Get started
          </Link>
          <Link
            to="/login"
            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
          >
            I have an account
          </Link>
        </div>
      </section>

      <section className="pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl border border-slate-200 bg-white hover:shadow-md transition-shadow"
            >
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-3 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-8 text-center text-xs text-slate-400 border-t border-slate-200">
        Smart Attendance · built on the MERN stack
      </footer>
    </div>
  );
}
