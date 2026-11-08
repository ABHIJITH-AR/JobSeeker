import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import { Textarea } from '../../components/FormField';
import { useToast } from '../../context/ToastContext';
import { adminApi } from '../../services';
import { getErrorMessage } from '../../services/api';
import { formatDate, formatLocation, timeAgo } from '../../utils/format';

export default function PendingApprovals() {
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    adminApi
      .jobs({ status: 'pending', page, limit: 10 })
      .then((response) => {
        if (!active) return;
        setJobs(response.data.jobs || []);
        setPagination(response.data.pagination || null);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Unable to load pending jobs.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, reloadKey]);

  const handleApprove = async (job) => {
    setBusyId(job._id);
    try {
      const response = await adminApi.approveJob(job._id);
      setJobs((current) => current.filter((item) => item._id !== job._id));
      toast.success(response.data.message || 'Job approved and published.');
      setReloadKey((value) => value + 1);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not approve the job.'));
    } finally {
      setBusyId('');
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (reason.trim().length < 5) {
      toast.error('Please provide a rejection reason of at least 5 characters.');
      return;
    }
    setRejecting(true);
    try {
      await adminApi.rejectJob(rejectTarget._id, reason.trim());
      setJobs((current) => current.filter((item) => item._id !== rejectTarget._id));
      setRejectTarget(null);
      toast.success('Job rejected.');
      setReloadKey((value) => value + 1);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not reject the job.'));
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Pending approvals</h2>
          <p className="mt-1 text-sm text-muted">New and edited job listings waiting for review before they go live.</p>
        </div>
        <Link to="/admin/jobs" className="btn-outline btn-sm self-start">
          <Briefcase className="h-4 w-4" />
          All jobs
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="card h-44 animate-pulse bg-slate-50" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={ShieldCheck}
          title="Could not load pending jobs"
          description={error}
          action={<button type="button" className="btn-primary" onClick={() => setReloadKey((value) => value + 1)}>Try again</button>}
        />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All caught up"
          description="There are no job listings waiting for approval right now."
          action={<Link to="/admin/jobs" className="btn-primary">View all jobs</Link>}
        />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const government = job.sector === 'government';
            return (
              <div key={job._id} className="card p-4 sm:p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-ink">{job.title}</h3>
                      <span className={government ? 'badge-navy' : 'badge-blue'}>{government ? 'Government' : 'Private'}</span>
                      <span className="badge-amber">
                        <Clock className="h-3.5 w-3.5" />
                        Pending
                      </span>
                      {government && job.government?.isVerified && (
                        <span className="badge-green">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {job.companyName || 'Company'}
                      {job.employer?.name ? ` • submitted by ${job.employer.name}` : ''}
                      {job.employer?.email ? ` (${job.employer.email})` : ''}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-brand" />
                        {formatLocation(job.location)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarClock className="h-3.5 w-3.5 text-brand" />
                        Deadline {formatDate(job.applicationDeadline)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-brand" />
                        Submitted {timeAgo(job.createdAt)}
                      </span>
                      <span>{job.category}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{job.description}</p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      onClick={() => handleApprove(job)}
                      disabled={busyId === job._id}
                    >
                      {busyId === job._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Approve
                    </button>
                    <button type="button" className="btn-outline btn-sm text-red-600 hover:bg-red-50" onClick={() => { setRejectTarget(job); setReason(''); }}>
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                    <Link to={`/admin/jobs/${job._id}/edit`} className="btn-ghost btn-sm">
                      Review & edit
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />

      <Modal
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title="Reject job"
        description={rejectTarget ? `Reject "${rejectTarget.title}" and send the reason to the employer.` : ''}
        footer={
          <>
            <button type="button" className="btn-outline" onClick={() => setRejectTarget(null)} disabled={rejecting}>
              Cancel
            </button>
            <button type="button" className="btn-danger" onClick={handleReject} disabled={rejecting}>
              {rejecting && <Loader2 className="h-4 w-4 animate-spin" />}
              {rejecting ? 'Rejecting...' : 'Reject job'}
            </button>
          </>
        }
      >
        <Textarea
          label="Rejection reason"
          required
          rows={4}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Explain why this job cannot be published."
          maxLength={500}
        />
        <p className="help-text">{reason.length}/500 characters</p>
      </Modal>
    </div>
  );
}
