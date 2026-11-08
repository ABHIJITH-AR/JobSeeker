import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  FileText,
  Search,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import Avatar from '../../components/Avatar';
import JobCard from '../../components/JobCard';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { JobCardSkeleton } from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { applicationApi, jobApi, savedJobApi } from '../../services';
import { formatDate, timeAgo } from '../../utils/format';

export default function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [applications, setApplications] = useState([]);
  const [counts, setCounts] = useState({});
  const [totalApplications, setTotalApplications] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      applicationApi.myApplications({ limit: 5 }),
      savedJobApi.list(),
      jobApi.list({ limit: 4, sort: 'latest' }),
    ]).then(([appsResult, savedResult, jobsResult]) => {
      if (!active) return;
      if (appsResult.status === 'fulfilled') {
        setApplications(appsResult.value.data.applications || []);
        setCounts(appsResult.value.data.counts || {});
        setTotalApplications(appsResult.value.data.totalApplications || 0);
      }
      if (savedResult.status === 'fulfilled') {
        setSavedCount((savedResult.value.data.jobs || []).length);
      }
      if (jobsResult.status === 'fulfilled') {
        setRecommended(jobsResult.value.data.jobs || []);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const profile = user?.profile || {};
  const completion = profile.completion || 0;
  const hasResume = Boolean(profile.hasResume || (profile.resume && profile.resume.filename));

  const handleSearch = (event) => {
    event.preventDefault();
    const query = keyword.trim();
    navigate(query ? `/jobs?q=${encodeURIComponent(query)}` : '/jobs');
  };

  return (
    <div className="space-y-6">
      <div className="card flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex items-center gap-4">
          <Avatar name={user?.name} src={profile.profilePhoto} size="lg" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Welcome back</p>
            <h2 className="mt-0.5 text-xl font-bold text-ink sm:text-2xl">{user?.name}</h2>
            <p className="mt-0.5 text-sm text-muted">
              {[profile.city, profile.state].filter(Boolean).join(', ') || 'Add your location to get better matches'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/jobs" className="btn-primary btn-sm">
            <Search className="h-4 w-4" />
            Find Jobs
          </Link>
          <Link to="/dashboard/profile" className="btn-outline btn-sm">
            <UserRound className="h-4 w-4" />
            Edit Profile
          </Link>
        </div>
      </div>

      <form onSubmit={handleSearch} className="card flex flex-col gap-2.5 p-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <label htmlFor="dashboard-job-search" className="sr-only">
            Search jobs
          </label>
          <input
            id="dashboard-job-search"
            className="input h-11 pl-10"
            placeholder="Search jobs by title, skill or company"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary h-11 px-5">
          <Search className="h-4 w-4" />
          Search Jobs
        </button>
      </form>

      {(!hasResume || completion < 100) && (
        <div className="card border-amber-200 bg-amber-50/60 p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <TrendingUp className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-ink">Make your profile stand out</h3>
                <p className="mt-0.5 text-xs leading-5 text-muted">
                  {!hasResume
                    ? 'Upload a resume to apply for private jobs. A complete profile also improves your chances.'
                    : 'Your profile is almost complete. Finish the remaining details to improve your job matches.'}
                </p>
                <div className="mt-2 h-2 w-full max-w-xs overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, completion)}%` }} />
                </div>
                <p className="mt-1 text-[11px] font-semibold text-muted">{completion}% complete</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {!hasResume && (
                <Link to="/dashboard/resume" className="btn-primary btn-sm">
                  <FileText className="h-4 w-4" />
                  Upload Resume
                </Link>
              )}
              <Link to="/dashboard/profile" className="btn-outline btn-sm">Complete Profile</Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total applications" value={totalApplications} icon={ClipboardList} tone="brand" />
        <StatCard label="Shortlisted" value={counts.Shortlisted || 0} icon={CheckCircle2} tone="green" />
        <StatCard label="Saved jobs" value={savedCount} icon={Bookmark} tone="navy" />
        <StatCard label="Profile completion" value={`${completion}%`} icon={UserRound} tone="amber" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { to: '/jobs', label: 'Browse all jobs', icon: Search },
          { to: '/dashboard/applications', label: 'My applications', icon: ClipboardList },
          { to: '/dashboard/saved-jobs', label: 'Saved jobs', icon: Bookmark },
          { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.to} to={action.to} className="card card-hover flex items-center gap-3 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-skysoft text-brand">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold text-ink">{action.label}</span>
              <ArrowRight className="ml-auto h-4 w-4 text-muted" />
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-ink">Recent applications</h2>
            <Link to="/dashboard/applications" className="text-xs font-semibold text-brand">View all</Link>
          </div>

          {loading ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={ClipboardList}
                title="No applications yet"
                description="Find a job that matches your skills and submit your first application."
                action={
                  <Link to="/jobs" className="btn-primary btn-sm">
                    Browse jobs
                  </Link>
                }
              />
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {applications.map((application) => (
                <li key={application._id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {application.job?.title || 'Job removed'}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {application.job?.companyName || 'Company'} • Applied {formatDate(application.appliedAt)}
                    </p>
                  </div>
                  <StatusBadge status={application.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-ink">Latest opportunities</h2>
            <Link to="/jobs" className="text-xs font-semibold text-brand">View all</Link>
          </div>
          <div className="mt-4 space-y-3">
            {loading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-20 animate-pulse rounded-lg bg-slate-100" />
                ))
              : recommended.map((job) => (
                  <Link key={job._id} to={`/jobs/${job._id}`} className="block rounded-lg border border-line p-3 transition hover:border-brand/40 hover:bg-skysoft/40">
                    <div className="flex items-start gap-2.5">
                      <Avatar name={job.companyName} src={job.companyLogo} size="sm" rounded="lg" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{job.title}</p>
                        <p className="truncate text-xs text-muted">{job.companyName}</p>
                        <p className="mt-1 text-[11px] text-muted">
                          {job.jobType} • {job.location?.city || job.location?.state || 'India'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
            {!loading && recommended.length === 0 && (
              <p className="text-sm text-muted">No jobs available right now.</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="eyebrow">Recommended for you</p>
            <h2 className="section-title mt-1">Fresh jobs on JobSeeker</h2>
          </div>
          <Link to="/jobs" className="text-sm font-semibold text-brand">Browse all</Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => <JobCardSkeleton key={index} />)
            : recommended.map((job) => <JobCard key={job._id} job={job} />)}
        </div>
      </div>
    </div>
  );
}
