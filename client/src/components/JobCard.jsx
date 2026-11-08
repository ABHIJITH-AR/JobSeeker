import { Link } from 'react-router-dom';
import { BadgeCheck, Briefcase, MapPin, MonitorSmartphone } from 'lucide-react';
import Avatar from './Avatar';
import { deadlineLabel, formatLocation, formatSalary, isExpired, timeAgo } from '../utils/format';

export default function JobCard({ job, className = '' }) {
  if (!job) return null;
  const government = job.sector === 'government';
  const expired = job.isExpired || isExpired(job.applicationDeadline);
  const company = job.companyName || job.government?.organization || 'Company';
  const verified = government && job.government?.isVerified;
  const days = deadlineLabel(job.applicationDeadline);
  const urgent = !expired && (job.applicationDeadline ? new Date(job.applicationDeadline).getTime() - Date.now() < 3 * 86400000 : false);

  return (
    <article className={`card card-hover flex flex-col p-5 ${className}`}>
      <div className="flex items-start gap-3">
        <Avatar name={company} src={job.companyLogo} size="md" rounded="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={government ? 'badge-navy' : 'badge-blue'}>{government ? 'Government' : 'Private'}</span>
            {verified && (
              <span className="badge-green">
                <BadgeCheck className="h-3.5 w-3.5" />
                Verified
              </span>
            )}
            {expired && <span className="badge-red">Expired</span>}
          </div>
          <h3 className="mt-2 line-clamp-2 text-base font-bold leading-snug text-ink">
            <Link to={`/jobs/${job._id}`} className="transition-colors hover:text-brand">
              {job.title}
            </Link>
          </h3>
          <p className="mt-1 truncate text-sm font-medium text-muted">{company}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-brand" />
          {formatLocation(job.location)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Briefcase className="h-3.5 w-3.5 text-brand" />
          {job.jobType}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MonitorSmartphone className="h-3.5 w-3.5 text-brand" />
          {job.workMode}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold text-navy">{formatSalary(job)}</span>
        {job.experience && <span className="text-xs text-muted">• {job.experience}</span>}
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{job.description}</p>

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between gap-2 text-xs text-muted">
          <span>Posted {timeAgo(job.postedDate)}</span>
          <span className={urgent ? 'font-semibold text-red-600' : ''}>{days}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link to={`/jobs/${job._id}`} className="btn-outline btn-sm w-full">
            View Details
          </Link>
          {expired ? (
            <span className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-lg border border-line bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-400">
              Closed
            </span>
          ) : (
            <Link to={`/jobs/${job._id}?apply=1`} className="btn-primary btn-sm w-full">
              Apply Now
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
