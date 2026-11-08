import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarX,
  ClipboardList,
  MessageSquare,
  PlusCircle,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { adminApi } from '../../services';
import { getErrorMessage } from '../../services/api';
import { APPLICATION_STATUSES } from '../../utils/constants';
import { formatDate, roleLabel, timeAgo } from '../../utils/format';

const QUICK_ACTIONS = [
  { to: '/admin/users', label: 'Manage users', icon: Users, description: 'Job seekers, employers and admins' },
  { to: '/admin/employers', label: 'Verify employers', icon: Building2, description: 'Review company profiles' },
  { to: '/admin/pending-approvals', label: 'Pending approvals', icon: ShieldCheck, description: 'Review new job listings' },
  { to: '/admin/government-verification', label: 'Government verification', icon: BadgeCheck, description: 'Verify official vacancies' },
  { to: '/admin/applications', label: 'Applications', icon: ClipboardList, description: 'All candidate applications' },
  { to: '/admin/messages', label: 'Messages', icon: MessageSquare, description: 'Contact form enquiries' },
  { to: '/admin/post-job', label: 'Post government job', icon: PlusCircle, description: 'Publish an official vacancy' },
];

export default function AdminDashboard() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    adminApi
      .dashboard()
      .then((response) => {
        if (active) setData(response.data);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Unable to load the admin dashboard.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <LoadingSpinner label="Loading admin dashboard..." />;

  if (error) {
    return (
      <EmptyState
        icon={ShieldCheck}
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

  const stats = data?.stats || {};
  const counts = data?.applicationCounts || {};
  const recentUsers = data?.recentUsers || [];
  const recentJobs = data?.recentJobs || [];
  const recentApplications = data?.recentApplications || [];
  const totalApplications = APPLICATION_STATUSES.reduce((sum, status) => sum + (counts[status] || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink">Platform overview</h2>
        <p className="mt-1 text-sm text-muted">Monitor users, jobs, applications and verification activity across JobSeeker.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total users" value={stats.totalUsers || 0} hint={`${stats.totalJobSeekers || 0} seekers • ${stats.totalEmployers || 0} employers`} tone="brand" />
        <StatCard icon={Briefcase} label="Total jobs" value={stats.totalJobs || 0} hint={`${stats.totalPrivateJobs || 0} private • ${stats.totalGovernmentJobs || 0} government`} tone="navy" />
        <StatCard icon={ShieldCheck} label="Pending approvals" value={stats.pendingApprovals || 0} hint="Jobs awaiting review" tone="amber" />
        <StatCard icon={BadgeCheck} label="Gov verification" value={stats.pendingGovVerification || 0} hint="Unverified government jobs" tone="amber" />
        <StatCard icon={ClipboardList} label="Applications" value={stats.totalApplications || 0} hint="All time" tone="green" />
        <StatCard icon={Activity} label="Active jobs" value={stats.activeJobs || 0} hint="Open for applications" tone="green" />
        <StatCard icon={MessageSquare} label="Unread messages" value={stats.unreadMessages || 0} hint="Contact enquiries" tone="brand" />
        <StatCard icon={CalendarX} label="Expired jobs" value={stats.expiredJobs || 0} hint="Past deadline" tone="slate" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5 sm:p-6 lg:col-span-1">
          <h2 className="text-base font-bold text-ink">Application status</h2>
          <p className="mt-0.5 text-xs text-muted">{totalApplications} applications in total.</p>
          <div className="mt-4 space-y-3">
            {APPLICATION_STATUSES.map((status) => {
              const value = counts[status] || 0;
              const percent = totalApplications ? Math.round((value / totalApplications) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-ink">{status}</span>
                    <span className="text-muted">{value} ({percent}%)</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5 sm:p-6 lg:col-span-2">
          <h2 className="text-base font-bold text-ink">Quick actions</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex items-start gap-3 rounded-lg border border-line p-3 transition hover:border-brand/40 hover:bg-skysoft"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-skysoft text-brand">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink">{action.label}</span>
                    <span className="block text-xs text-muted">{action.description}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-ink">Newest users</h2>
            <Link to="/admin/users" className="text-xs font-semibold text-brand hover:underline">View all</Link>
          </div>
          {recentUsers.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No users yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {recentUsers.map((item) => (
                <li key={item._id} className="flex items-center gap-3 py-3">
                  <Avatar name={item.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                    <p className="truncate text-xs text-muted">{item.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={item.role === 'admin' ? 'badge-navy' : item.role === 'employer' ? 'badge-blue' : 'badge-slate'}>
                      {roleLabel(item.role)}
                    </span>
                    <p className="mt-1 text-[11px] text-muted">{formatDate(item.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-ink">Newest jobs</h2>
            <Link to="/admin/jobs" className="text-xs font-semibold text-brand hover:underline">View all</Link>
          </div>
          {recentJobs.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No jobs yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {recentJobs.map((job) => (
                <li key={job._id} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-skysoft text-brand">
                    <Briefcase className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{job.title}</p>
                    <p className="truncate text-xs text-muted">
                      {job.companyName || 'Company'} • {job.sector === 'government' ? 'Government' : 'Private'}
                    </p>
                  </div>
                  <StatusBadge status={job.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-ink">Recent applications</h2>
          <Link to="/admin/applications" className="text-xs font-semibold text-brand hover:underline">View all</Link>
        </div>
        {recentApplications.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No applications yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="pb-2 pr-4 font-semibold">Candidate</th>
                  <th className="pb-2 pr-4 font-semibold">Job</th>
                  <th className="pb-2 pr-4 font-semibold">Applied</th>
                  <th className="pb-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentApplications.map((application) => (
                  <tr key={application._id}>
                    <td className="py-2.5 pr-4">
                      <p className="font-semibold text-ink">{application.jobSeeker?.name || 'Candidate'}</p>
                      <p className="text-xs text-muted">{application.jobSeeker?.email}</p>
                    </td>
                    <td className="py-2.5 pr-4">
                      <p className="text-ink">{application.job?.title || 'Job removed'}</p>
                      <p className="text-xs text-muted">{application.job?.companyName || '—'}</p>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-muted">{timeAgo(application.appliedAt)}</td>
                    <td className="py-2.5"><StatusBadge status={application.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
