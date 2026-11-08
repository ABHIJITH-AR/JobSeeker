import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  PlusCircle,
  ShieldAlert,
  Users,
} from 'lucide-react';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { employerApi } from '../../services';
import { getErrorMessage } from '../../services/api';
import { formatDate, timeAgo } from '../../utils/format';

export default function EmployerDashboard() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    employerApi
      .dashboard()
      .then((response) => {
        if (active) setData(response.data);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Unable to load your dashboard.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    refreshUser().catch(() => {});
    return () => {
      active = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <LoadingSpinner label="Loading your dashboard..." />;

  if (error) {
    return (
      <EmptyState
        icon={Briefcase}
        title="Could not load dashboard"
        description={error}
        action={
          <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
            Try again
          </button>
        }
      />
    );
  }

  const profile = user?.profile;
  const stats = data?.stats || {};
  const recentApplications = data?.recentApplications || [];
  const recentJobs = data?.recentJobs || [];
  const verified = Boolean(profile?.isVerified);

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        <div className="h-20 bg-navy" />
        <div className="-mt-8 px-5 pb-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar name={profile?.companyName || user?.name} src={profile?.logo} size="xl" rounded="lg" className="ring-4 ring-white" />
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-ink">{profile?.companyName || user?.name}</h2>
                  {verified ? (
                    <span className="badge-green">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Verified
                    </span>
                  ) : (
                    <span className="badge-amber">Verification pending</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {[profile?.industry, profile?.city, profile?.state].filter(Boolean).join(' • ') || 'Complete your company profile'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/employer/profile" className="btn-outline btn-sm">
                <Building2 className="h-4 w-4" />
                Company profile
              </Link>
              <Link to="/employer/post-job" className="btn-primary btn-sm">
                <PlusCircle className="h-4 w-4" />
                Post a job
              </Link>
            </div>
          </div>
        </div>
      </div>

      {!verified && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Your company is not verified yet</p>
              <p className="mt-0.5 text-xs leading-5 text-amber-800">
                Verified employers get a trust badge on their jobs. Our team reviews company profiles after you complete them.
              </p>
            </div>
          </div>
          <Link to="/employer/profile" className="btn-outline btn-sm shrink-0 self-start border-amber-300 text-amber-900 hover:bg-amber-100">
            Complete profile
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Briefcase} label="Total jobs" value={stats.totalJobs || 0} hint={`${stats.activeJobs || 0} active`} tone="brand" />
        <StatCard icon={CalendarClock} label="Pending approval" value={stats.pendingJobs || 0} hint="Awaiting admin review" tone="amber" />
        <StatCard icon={Users} label="Total applicants" value={stats.totalApplicants || 0} hint={`${stats.pendingApplications || 0} need review`} tone="green" />
        <StatCard icon={CheckCircle2} label="Approved jobs" value={stats.approvedJobs || 0} hint="Live or closed" tone="navy" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-ink">Recent applicants</h2>
              <p className="mt-0.5 text-xs text-muted">Latest applications across your jobs.</p>
            </div>
            <Link to="/employer/applicants" className="text-xs font-semibold text-brand hover:underline">
              View all
            </Link>
          </div>

          {recentApplications.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-line bg-slate-50/60 px-4 py-8 text-center">
              <ClipboardList className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-ink">No applicants yet</p>
              <p className="mt-1 text-xs text-muted">Applications will appear here once candidates apply.</p>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {recentApplications.map((application) => (
                <li key={application._id} className="flex items-center gap-3 py-3">
                  <Avatar name={application.jobSeeker?.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{application.jobSeeker?.name || 'Candidate'}</p>
                    <p className="truncate text-xs text-muted">{application.job?.title || 'Job removed'}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusBadge status={application.status} />
                    <p className="mt-1 text-[11px] text-muted">{timeAgo(application.appliedAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-ink">Recent jobs</h2>
              <p className="mt-0.5 text-xs text-muted">Your latest job postings.</p>
            </div>
            <Link to="/employer/jobs" className="text-xs font-semibold text-brand hover:underline">
              Manage jobs
            </Link>
          </div>

          {recentJobs.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-line bg-slate-50/60 px-4 py-8 text-center">
              <Briefcase className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-ink">No jobs posted yet</p>
              <p className="mt-1 text-xs text-muted">Post your first job to start receiving applications.</p>
              <Link to="/employer/post-job" className="btn-primary btn-sm mt-3">Post a job</Link>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {recentJobs.map((job) => (
                <li key={job._id} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-skysoft text-brand">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{job.title}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        {formatDate(job.applicationDeadline)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {job.views || 0} views
                      </span>
                    </p>
                  </div>
                  <StatusBadge status={job.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
