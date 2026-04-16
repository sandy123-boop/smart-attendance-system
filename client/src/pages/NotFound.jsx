import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-24 text-center">
      <div className="text-6xl">🧭</div>
      <h1 className="mt-4 text-2xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-1 text-sm text-slate-500">
        The page you were looking for doesn't exist.
      </p>
      <Link
        to="/"
        className="mt-6 inline-block px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
      >
        Back home
      </Link>
    </div>
  );
}
