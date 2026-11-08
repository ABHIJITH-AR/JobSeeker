import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ label = 'Loading...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-12 text-muted ${className}`} role="status">
      <Loader2 className="h-8 w-8 animate-spin text-brand" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export function PageLoader({ label = 'Loading JobSeeker...' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy text-white shadow-card">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
        <p className="text-sm font-medium text-muted">{label}</p>
      </div>
    </div>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="card animate-pulse p-5">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-lg bg-slate-100" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-slate-100" />
          <div className="h-3 w-1/2 rounded bg-slate-100" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-5/6 rounded bg-slate-100" />
      </div>
      <div className="mt-5 flex gap-2">
        <div className="h-9 flex-1 rounded bg-slate-100" />
        <div className="h-9 flex-1 rounded bg-slate-100" />
      </div>
    </div>
  );
}

export default LoadingSpinner;
