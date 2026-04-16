import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setOpen(false);
  };

  const close = () => setOpen(false);

  const dashPath = auth?.user?.role === 'teacher' ? '/teacher' : '/student';

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" onClick={close}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 grid place-items-center text-white font-bold text-sm">
            SA
          </div>
          <span className="font-semibold text-slate-800 hidden sm:inline">Smart Attendance</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-2">
          {auth?.token ? (
            <>
              <NavLink to={dashPath}>Dashboard</NavLink>
              {auth.user?.role === 'student' && (
                <NavLink to="/student/attendance">Attendance</NavLink>
              )}
              <NavLink to="/profile">Profile</NavLink>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <Link
                to="/signup"
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="sm:hidden w-10 h-10 grid place-items-center rounded-lg hover:bg-slate-100"
          aria-label="Menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M4 4l12 12M16 4L4 16" />
            ) : (
              <path d="M3 5h14M3 10h14M3 15h14" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="sm:hidden border-t border-slate-100 bg-white">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1">
            {auth?.token ? (
              <>
                <MobileLink to={dashPath} onClick={close}>Dashboard</MobileLink>
                {auth.user?.role === 'student' && (
                  <>
                    <MobileLink to="/student/attendance" onClick={close}>Attendance</MobileLink>
                    <MobileLink to="/student/scan" onClick={close}>Scan QR</MobileLink>
                  </>
                )}
                <MobileLink to="/profile" onClick={close}>Profile</MobileLink>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <MobileLink to="/login" onClick={close}>Login</MobileLink>
                <MobileLink to="/signup" onClick={close}>Sign up</MobileLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({ to, children }) {
  return (
    <Link
      to={to}
      className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900"
    >
      {children}
    </Link>
  );
}

function MobileLink({ to, onClick, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 active:bg-slate-100"
    >
      {children}
    </Link>
  );
}
