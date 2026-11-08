import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Download, Eye, FileText, Loader2, Search } from 'lucide-react';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { applicationApi } from '../../services';
import { downloadBlob, getErrorMessage } from '../../services/api';
import { APPLICATION_STATUSES } from '../../utils/constants';
import { formatDate, formatDateTime, formatLocation } from '../../utils/format';

export default function Applications() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [term, setTerm] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [applications, setApplications] = useState([]);
  const [counts, setCounts] = useState({});
  const [totalApplications, setTotalApplications] = useState(0);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState('');

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    applicationApi
      .myApplications({ page, limit: 10, status: status || undefined, q: q || undefined })
      .then((response) => {
        if (!active) return;
        setApplications(response.data.applications || []);
        setCounts(response.data.counts || {});
        setTotalApplications(response.data.totalApplications || 0);
        setPagination(response.data.pagination || null);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Unable to load your applications.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, status, q, reloadKey]);

  const openDetails = (id) => {
    setDetailsOpen(true);
    setDetails(null);
    setDetailsLoading(true);
    applicationApi
      .get(id)
      .then((response) => setDetails(response.data.application))
      .catch((err) => toast.error(getErrorMessage(err, 'Could not load application details.')))
      .finally(() => setDetailsLoading(false));
  };

  const downloadResume = async (application) => {
    setDownloadingId(application._id);
    try {
      const response = await applicationApi.downloadResume(application._id);
      downloadBlob(response, application.resume?.originalName || 'resume.pdf');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not download the resume.'));
    } finally {
      setDownloadingId('');
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
          <h2 className="text-lg font-bold text-ink">My applications</h2>
          <p className="mt-1 text-sm text-muted">
            {totalApplications} application{totalApplications === 1 ? '' : 's'} submitted in total.
          </p>
        </div>
        <Link to="/jobs" className="btn-primary btn-sm self-start">
          <Search className="h-4 w-4" />
          Find more jobs
        </Link>
      </div>

      <div className="card p-4 sm:p-5">
        <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              className="input pl-10"
              placeholder="Search by job title or company"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              aria-label="Search applications"
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
          <button
            type="button"
            onClick={() => {
              setStatus('');
              setPage(1);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              !status ? 'bg-navy text-white' : 'border border-line bg-white text-ink hover:bg-skysoft'
            }`}
          >
            All ({totalApplications})
          </button>
          {APPLICATION_STATUSES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setStatus(item);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                status === item ? 'bg-navy text-white' : 'border border-line bg-white text-ink hover:bg-skysoft'
              }`}
            >
              {item} ({counts[item] || 0})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="card h-36 animate-pulse bg-slate-50" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={ClipboardList}
          title="Could not load applications"
          description={error}
          action={
            <button type="button" className="btn-primary" onClick={() => setReloadKey((value) => value + 1)}>
              Try again
            </button>
          }
        />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={hasFilters ? 'No applications match your filters' : 'No applications yet'}
          description={
            hasFilters
              ? 'Try a different status or search term.'
              : 'When you apply for a job, it will appear here so you can track its status.'
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
              <Link to="/jobs" className="btn-primary">Browse jobs</Link>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {applications.map((application) => {
            const job = application.job;
            return (
              <div key={application._id} className="card p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <Avatar name={job?.companyName} size="md" rounded="lg" />
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-ink">
                        {job ? (
                          <Link to={`/jobs/${job._id}`} className="hover:text-brand">{job.title}</Link>
                        ) : (
                          'Job no longer available'
                        )}
                      </h3>
                      <p className="mt-0.5 truncate text-sm text-muted">
                        {job?.companyName || 'Company'}
                        {job ? ` • ${formatLocation(job.location)}` : ''}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                        {job?.sector && <span className={job.sector === 'government' ? 'badge-navy' : 'badge-blue'}>{job.sector === 'government' ? 'Government' : 'Private'}</span>}
                        {job?.jobType && <span>{job.jobType}</span>}
                        <span>Applied {formatDate(application.appliedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={application.status} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                  <button type="button" className="btn-outline btn-sm" onClick={() => openDetails(application._id)}>
                    <Eye className="h-4 w-4" />
                    View details
                  </button>
                  {job && (
                    <Link to={`/jobs/${job._id}`} className="btn-ghost btn-sm">
                      View job
                    </Link>
                  )}
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => downloadResume(application)}
                    disabled={downloadingId === application._id}
                  >
                    {downloadingId === application._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Resume
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />

      <Modal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title="Application details"
        size="lg"
        footer={<button type="button" className="btn-outline" onClick={() => setDetailsOpen(false)}>Close</button>}
      >
        {detailsLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand" />
            <p className="mt-2 text-sm text-muted">Loading application...</p>
          </div>
        ) : details ? (
          <div className="space-y-5">
            <div className="rounded-lg border border-line bg-slate-50/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-ink">{details.job?.title || 'Job removed'}</h3>
                  <p className="mt-0.5 text-sm text-muted">
                    {details.job?.companyName || 'Company'}
                    {details.job ? ` • ${formatLocation(details.job.location)}` : ''}
                  </p>
                </div>
                <StatusBadge status={details.status} />
              </div>
              <p className="mt-2 text-xs text-muted">
                Applied on {formatDateTime(details.appliedAt)}
                {details.job?.applicationDeadline ? ` • Deadline ${formatDate(details.job.applicationDeadline)}` : ''}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-ink">Status history</h4>
              <ol className="mt-2 space-y-2">
                {(details.statusHistory || []).map((item, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                    <div>
                      <p className="font-semibold text-ink">{item.status}</p>
                      <p className="text-xs text-muted">{formatDateTime(item.changedAt)}</p>
                      {item.note && <p className="mt-0.5 text-xs text-slate-600">{item.note}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {details.coverLetter && (
              <div>
                <h4 className="text-sm font-bold text-ink">Your cover letter / note</h4>
                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">{details.coverLetter}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 border-t border-line pt-4">
              {details.job && (
                <Link to={`/jobs/${details.job._id}`} className="btn-outline btn-sm">
                  <Eye className="h-4 w-4" />
                  View job
                </Link>
              )}
              {details.resume && (
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  onClick={() => downloadResume(details)}
                  disabled={downloadingId === details._id}
                >
                  {downloadingId === details._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  Download resume
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">Application details are not available.</p>
        )}
      </Modal>
    </div>
  );
}
