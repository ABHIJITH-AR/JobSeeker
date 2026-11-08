import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-6xl font-extrabold tracking-tight text-navy">404</p>
      <h1 className="mt-3 text-2xl font-bold text-ink">Page not found</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">
        The page you are looking for does not exist or may have been moved. Let us help you get back to the jobs.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary">
          <Home className="h-4 w-4" />
          Go to homepage
        </Link>
        <Link to="/jobs" className="btn-outline">
          <Search className="h-4 w-4" />
          Browse jobs
        </Link>
      </div>
    </section>
  );
}
