import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  CalendarClock,
  Eye,
  MapPin,
  Pencil,
  PlusCircle,
  Power,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { employerApi, jobApi } from '../../services';
import { getErrorMessage } from '../../services/api';
import { formatDate, formatLocation } from '../../utils/format';

const STATUS_FILTERS = ['', 'pending', 'approved', 'rejected', 'closed'];

export default function ManageJobs() {
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [status, setStatus] = useState('');
  const [term, setTerm] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    employerApi
      .jobs({ page, limit: 10, status: status || undefined, q: q || undefined })
      .then((response) => {
        if (!active) return;
        setJobs(response.data.jobs || []);
        setPagination(response.data.pagination || null);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Unable to load your jobs.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, status, q, reloadKey]);

  const handleToggle = async (job) => {
    setBusyId(job._id);
    try {
      const response = await jobApi.toggleStatus(job._id, !job.isActive);
      setJobs((current) => current.map((item) => (item._id === job._id ? { ...item, ...response.data.job } : item)));
      toast.success(response.data.message || 'Job updated.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update the job.'));
    } finally {
      setBusyId('');
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

  const hasFilters = Boolean(status || q);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Manage jobs</h2>
          <p className="mt-1 text-sm text-muted">Track, edit and control the visibility of your job listings.</p>
        </div>
        <Link to="/employer/post-job" className="btn-primary btn-sm self-start">
          <PlusCircle className="h-4 w-4" />
          Post a job
        </Link>
      </div>

      <div className="card p-4 sm:p-5">
        <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              className="input pl-10"
              placeholder="Search by job title or category"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              aria-label="Search jobs"
            />
          </div>
          <button type="submit" className="btn-primary">Search</button>
          {hasFilters && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setTerm('');
                setQ('');
                setStatus('');
                setPage(1);
              }}
            >
              Reset
            </button>
          )}
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((item) => (
            <button
              key={item || 'all'}
              type="button"
              onClick={() => {
                setStatus(item);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
                status === item ? 'bg-navy text-white' : 'border border-line bg-white text-ink hover:bg-skysoft'
              }`}
            >
              {item || 'All jobs'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="card h-40 animate-pulse bg-slate-50" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={Briefcase}
          title="Could not load jobs"
          description={error}
          action={
            <button type="button" className="btn-primary" onClick={() => setReloadKey((value) => value + 1)}>
              Try again
            </button>
          }
        />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={hasFilters ? 'No jobs match your filters' : 'No jobs posted yet'}
          description={
            hasFilters
              ? 'Try a different status or search term.'
              : 'Post your first job to start receiving applications from candidates.'
          }
          action={
            hasFilters ? (
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setTerm('');
                  setQ('');
                  setStatus('');
                  setPage(1);
                }}
              >
                Clear filters
              </button>
            ) : (
              <Link to="/employer/post-job" className="btn-primary">Post a job</Link>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job._id} className="card p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-ink">{job.title}</h3>
                    <StatusBadge status={job.status} />
                    {!job.isActive && <span className="badge-slate">Inactive</span>}
                  </div>
                  <p className="mt-1 text-sm text-muted">{job.category}</p>
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
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-brand" />
                      {job.vacancies || 1} vacanc{(job.vacancies || 1) === 1 ? 'y' : 'ies'}
                    </span>
                  </div>
                  {job.rejectionReason && job.status === 'rejected' && (
                    <p className="mt-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
                      Rejected: {job.rejectionReason}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link to={`/employer/applicants?jobId=${job._id}`} className="btn-outline btn-sm">
                    <Users className="h-4 w-4" />
                    Applicants
                  </Link>
                  <Link to={`/employer/jobs/${job._id}/edit`} className="btn-ghost btn-sm">
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Link>
                  {job.status === 'approved' && (
                    <Link to={`/jobs/${job._id}`} className="btn-ghost btn-sm">
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                  )}
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => handleToggle(job)}
                    disabled={busyId === job._id}
                  >
                    <Power className="h-4 w-4" />
                    {job.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
                    onClick={() => setDeleteTarget(job)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />

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
