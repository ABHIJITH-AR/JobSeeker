import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  Eye,
  Loader2,
  MapPin,
  Pencil,
  PlusCircle,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import { Select, Textarea } from '../../components/FormField';
import { useToast } from '../../context/ToastContext';
import { adminApi, jobApi } from '../../services';
import { getErrorMessage } from '../../services/api';
import { formatDate, formatLocation } from '../../utils/format';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'closed', label: 'Closed' },
];

export default function ManageJobs() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';

  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [status, setStatus] = useState('');
  const [sector, setSector] = useState('');
  const [verified, setVerified] = useState('');
  const [term, setTerm] = useState(initialQ);
  const [q, setQ] = useState(initialQ);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    adminApi
      .jobs({
        page,
        limit: 15,
        status: status || undefined,
        sector: sector || undefined,
        verified: verified || undefined,
        q: q || undefined,
      })
      .then((response) => {
        if (!active) return;
        setJobs(response.data.jobs || []);
        setPagination(response.data.pagination || null);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Unable to load jobs.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, status, sector, verified, q, reloadKey]);

  const handleApprove = async (job) => {
    setBusyId(job._id);
    try {
      const response = await adminApi.approveJob(job._id);
      setJobs((current) => current.map((item) => (item._id === job._id ? { ...item, ...response.data.job } : item)));
      toast.success(response.data.message || 'Job approved.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not approve the job.'));
    } finally {
      setBusyId('');
    }
  };

  const openReject = (job) => {
    setRejectTarget(job);
    setReason('');
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (reason.trim().length < 5) {
      toast.error('Please provide a rejection reason of at least 5 characters.');
      return;
    }
    setRejecting(true);
    try {
      const response = await adminApi.rejectJob(rejectTarget._id, reason.trim());
      setJobs((current) => current.map((item) => (item._id === rejectTarget._id ? { ...item, ...response.data.job } : item)));
      setRejectTarget(null);
      toast.success('Job rejected.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not reject the job.'));
    } finally {
      setRejecting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await jobApi.remove(deleteTarget._id);
      setJobs((current) => current.filter((job) => job._id !== deleteTarget._id));
      setDeleteTarget(null);
      setReloadKey((value) => value + 1);
      toast.success('Job deleted successfully.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete the job.'));
    } finally {
      setDeleting(false);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setQ(term.trim());
  };

  const hasFilters = Boolean(status || sector || verified || q);
  const clearFilters = () => {
    setTerm('');
    setQ('');
    setStatus('');
    setSector('');
    setVerified('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Manage jobs</h2>
          <p className="mt-1 text-sm text-muted">Review, approve, reject and manage every job listing on the platform.</p>
        </div>
        <Link to="/admin/post-job" className="btn-primary btn-sm self-start">
          <PlusCircle className="h-4 w-4" />
          Post a job
        </Link>
      </div>

      <div className="card p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="Status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            {STATUS_OPTIONS.map((item) => (
              <option key={item.value || 'all'} value={item.value}>{item.label}</option>
            ))}
          </Select>
          <Select label="Sector" value={sector} onChange={(event) => { setSector(event.target.value); setPage(1); }}>
            <option value="">All sectors</option>
            <option value="private">Private</option>
            <option value="government">Government</option>
          </Select>
          <Select label="Government verification" value={verified} onChange={(event) => { setVerified(event.target.value); setPage(1); }}>
            <option value="">Any verification</option>
            <option value="true">Verified</option>
            <option value="false">Not verified</option>
          </Select>
          <form onSubmit={handleSearch} className="flex items-end gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                className="input pl-10"
                placeholder="Search title, company or category"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                aria-label="Search jobs"
              />
            </div>
            <button type="submit" className="btn-primary">Search</button>
          </form>
        </div>
        {hasFilters && (
          <button type="button" className="btn-ghost btn-sm mt-2" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="card h-40 animate-pulse bg-slate-50" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={Briefcase}
          title="Could not load jobs"
          description={error}
          action={<button type="button" className="btn-primary" onClick={() => setReloadKey((value) => value + 1)}>Try again</button>}
        />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description={hasFilters ? 'Try different filters or a different search term.' : 'No jobs have been posted yet.'}
          action={hasFilters ? <button type="button" className="btn-primary" onClick={clearFilters}>Clear filters</button> : undefined}
        />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const government = job.sector === 'government';
            const govVerified = government && job.government?.isVerified;
            return (
              <div key={job._id} className="card p-4 sm:p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-ink">{job.title}</h3>
                      <span className={government ? 'badge-navy' : 'badge-blue'}>{government ? 'Government' : 'Private'}</span>
                      <StatusBadge status={job.status} />
                      {govVerified && (
                        <span className="badge-green">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      )}
                      {!job.isActive && <span className="badge-slate">Inactive</span>}
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                      <Building2 className="h-4 w-4" />
                      {job.companyName || 'Company'}
                      {job.employer?.name ? ` • ${job.employer.name}` : ''}
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
                        <Eye className="h-3.5 w-3.5 text-brand" />
                        {job.views || 0} views
                      </span>
                      <span>{job.category}</span>
                    </div>
                    {job.rejectionReason && (
                      <p className="mt-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
                        Rejection reason: {job.rejectionReason}
                      </p>
                    )}
                    {government && job.government?.notificationNumber && (
                      <p className="mt-1 text-xs text-muted">Notification: {job.government.notificationNumber}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {job.status !== 'approved' && (
                      <button
                        type="button"
                        className="btn-primary btn-sm"
                        onClick={() => handleApprove(job)}
                        disabled={busyId === job._id}
                      >
                        {busyId === job._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Approve
                      </button>
                    )}
                    {job.status !== 'rejected' && (
                      <button type="button" className="btn-outline btn-sm text-red-600 hover:bg-red-50" onClick={() => openReject(job)}>
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    )}
                    <Link to={`/admin/jobs/${job._id}/edit`} className="btn-ghost btn-sm">
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Link>
                    {job.status === 'approved' && (
                      <Link to={`/jobs/${job._id}`} className="btn-ghost btn-sm">
                        <Eye className="h-4 w-4" />
                        View
                      </Link>
                    )}
                    <button type="button" className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => setDeleteTarget(job)}>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete job?"
        message={`"${deleteTarget?.title || 'This job'}" and all applications linked to it will be permanently deleted. This action cannot be undone.`}
        confirmLabel="Delete job"
        danger
        loading={deleting}
      />
    </div>
  );
}
