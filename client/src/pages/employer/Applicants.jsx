import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Briefcase,
  CalendarClock,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import { Input, Select, Textarea } from '../../components/FormField';
import { useToast } from '../../context/ToastContext';
import { applicationApi, employerApi } from '../../services';
import { downloadBlob, getErrorMessage } from '../../services/api';
import { APPLICATION_STATUSES } from '../../utils/constants';
import { formatDate, formatDateTime, formatLocation } from '../../utils/format';

const profileLocation = (profile) => {
  if (!profile) return 'India';
  return formatLocation({ state: profile.state, district: profile.district, city: profile.city });
};

export default function Applicants() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialJobId = searchParams.get('jobId') || '';

  const [applications, setApplications] = useState([]);
  const [counts, setCounts] = useState({});
  const [pagination, setPagination] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState(initialJobId);
  const [status, setStatus] = useState('');
  const [term, setTerm] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState('');

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [statusTarget, setStatusTarget] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    employerApi
      .jobs({ limit: 50 })
      .then((response) => setJobs(response.data.jobs || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    employerApi
      .applicants({ page, limit: 10, jobId: jobId || undefined, status: status || undefined, q: q || undefined })
      .then((response) => {
        if (!active) return;
        setApplications(response.data.applications || []);
        setCounts(response.data.counts || {});
        setPagination(response.data.pagination || null);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Unable to load applicants.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, jobId, status, q, reloadKey]);

  const selectedJob = useMemo(() => jobs.find((job) => job._id === jobId), [jobs, jobId]);

  const changeJob = (value) => {
    setJobId(value);
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (value) next.set('jobId', value);
    else next.delete('jobId');
    setSearchParams(next, { replace: true });
  };

  const openDetails = (application) => {
    setDetailsOpen(true);
    setDetails(null);
    setDetailsLoading(true);
    applicationApi
      .get(application._id)
      .then((response) => setDetails(response.data.application))
      .catch((err) => toast.error(getErrorMessage(err, 'Could not load applicant details.')))
      .finally(() => setDetailsLoading(false));
  };

  const openStatus = (application) => {
    setStatusTarget(application);
    setNewStatus(application.status);
    setNote('');
  };

  const handleStatusUpdate = async () => {
    if (!statusTarget) return;
    setUpdating(true);
    try {
      await applicationApi.updateStatus(statusTarget._id, { status: newStatus, note: note.trim() });
      setApplications((current) =>
        current.map((item) => (item._id === statusTarget._id ? { ...item, status: newStatus } : item))
      );
      if (details && details._id === statusTarget._id) {
        setDetails((current) => (current ? { ...current, status: newStatus } : current));
      }
      setStatusTarget(null);
      toast.success(`Application status updated to ${newStatus}.`);
      setReloadKey((value) => value + 1);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update the application status.'));
    } finally {
      setUpdating(false);
    }
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

  const hasFilters = Boolean(jobId || status || q);
  const clearFilters = () => {
    setTerm('');
    setQ('');
    setStatus('');
    changeJob('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Applicants</h2>
          <p className="mt-1 text-sm text-muted">Review applications and update candidate statuses.</p>
        </div>
        <Link to="/employer/jobs" className="btn-outline btn-sm self-start">
          <Briefcase className="h-4 w-4" />
          Manage jobs
        </Link>
      </div>

      <div className="card p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="Filter by job" value={jobId} onChange={(event) => changeJob(event.target.value)}>
            <option value="">All jobs</option>
            {jobs.map((job) => (
              <option key={job._id} value={job._id}>{job.title}</option>
            ))}
          </Select>
          <Select
            label="Filter by status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {APPLICATION_STATUSES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </Select>
          <form onSubmit={handleSearch} className="flex items-end gap-2 sm:col-span-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                className="input pl-10"
                placeholder="Search candidate name or email"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                aria-label="Search applicants"
              />
            </div>
            <button type="submit" className="btn-primary">Search</button>
            {hasFilters && (
              <button type="button" className="btn-ghost" onClick={clearFilters}>
                Reset
              </button>
            )}
          </form>
        </div>

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
            All ({Object.values(counts).reduce((sum, value) => sum + value, 0)})
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

        {jobId && selectedJob && (
          <p className="mt-3 text-xs text-muted">
            Showing applicants for <span className="font-semibold text-ink">{selectedJob.title}</span>.
          </p>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="card h-40 animate-pulse bg-slate-50" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={Users}
          title="Could not load applicants"
          description={error}
          action={
            <button type="button" className="btn-primary" onClick={() => setReloadKey((value) => value + 1)}>
              Try again
            </button>
          }
        />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={Users}
          title={hasFilters ? 'No applicants match your filters' : 'No applicants yet'}
          description={
            hasFilters
              ? 'Try a different job, status or search term.'
              : 'Once candidates apply to your jobs, their applications will appear here.'
          }
          action={hasFilters ? <button type="button" className="btn-primary" onClick={clearFilters}>Clear filters</button> : undefined}
        />
      ) : (
        <div className="space-y-3">
          {applications.map((application) => {
            const seeker = application.jobSeeker;
            const profile = application.seekerProfile;
            return (
              <div key={application._id} className="card p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <Avatar name={seeker?.name} src={profile?.profilePhoto} size="md" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-ink">{seeker?.name || profile?.fullName || 'Candidate'}</h3>
                        <StatusBadge status={application.status} />
                      </div>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                        <Briefcase className="h-3.5 w-3.5" />
                        {application.job?.title || 'Job removed'}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          {seeker?.email || '—'}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          {seeker?.phone || profile?.phone || '—'}
                        </span>
                        {profile && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {profileLocation(profile)}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarClock className="h-3.5 w-3.5" />
                          Applied {formatDate(application.appliedAt)}
                        </span>
                      </div>
                      {profile?.education && (
                        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-600">
                          <GraduationCap className="h-3.5 w-3.5 text-brand" />
                          {profile.education}
                          {profile.collegeName ? ` • ${profile.collegeName}` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button type="button" className="btn-outline btn-sm" onClick={() => openDetails(application)}>
                      <Eye className="h-4 w-4" />
                      View details
                    </button>
                    <button type="button" className="btn-ghost btn-sm" onClick={() => openStatus(application)}>
                      <Sparkles className="h-4 w-4" />
                      Update status
                    </button>
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
              </div>
            );
          })}
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />

      <Modal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title="Applicant details"
        size="lg"
        footer={
          <>
            <button type="button" className="btn-outline" onClick={() => setDetailsOpen(false)}>Close</button>
            {details && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setDetailsOpen(false);
                  openStatus(details);
                }}
              >
                <Sparkles className="h-4 w-4" />
                Update status
              </button>
            )}
          </>
        }
      >
        {detailsLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand" />
            <p className="mt-2 text-sm text-muted">Loading applicant...</p>
          </div>
        ) : details ? (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <Avatar name={details.jobSeeker?.name} src={details.seekerProfile?.profilePhoto} size="lg" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-ink">{details.jobSeeker?.name || details.seekerProfile?.fullName}</h3>
                  <StatusBadge status={details.status} />
                </div>
                <p className="mt-0.5 text-sm text-muted">{details.jobSeeker?.email}</p>
                <p className="text-xs text-muted">
                  Applied for <span className="font-semibold text-ink">{details.job?.title || 'a job'}</span> on {formatDateTime(details.appliedAt)}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-line p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Contact</p>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink">
                  <Phone className="h-4 w-4 text-brand" />
                  {details.jobSeeker?.phone || details.seekerProfile?.phone || '—'}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink">
                  <Mail className="h-4 w-4 text-brand" />
                  {details.jobSeeker?.email || '—'}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink">
                  <MapPin className="h-4 w-4 text-brand" />
                  {profileLocation(details.seekerProfile)}
                </p>
              </div>
              <div className="rounded-lg border border-line p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Education & experience</p>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink">
                  <GraduationCap className="h-4 w-4 text-brand" />
                  {details.seekerProfile?.education || 'Not specified'}
                </p>
                {details.seekerProfile?.collegeName && (
                  <p className="mt-1 text-sm text-ink">{details.seekerProfile.collegeName}</p>
                )}
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink">
                  <Briefcase className="h-4 w-4 text-brand" />
                  {details.seekerProfile?.experience || 'Experience not specified'}
                </p>
              </div>
            </div>

            {details.seekerProfile?.skills?.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-ink">Skills</h4>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {details.seekerProfile.skills.map((skill) => (
                    <span key={skill} className="badge-blue">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {details.seekerProfile?.careerObjective && (
              <div>
                <h4 className="text-sm font-bold text-ink">Career objective</h4>
                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">{details.seekerProfile.careerObjective}</p>
              </div>
            )}

            {details.coverLetter && (
              <div>
                <h4 className="text-sm font-bold text-ink">Cover letter / note</h4>
                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">{details.coverLetter}</p>
              </div>
            )}

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

            <div className="flex flex-wrap gap-2 border-t border-line pt-4">
              <button
                type="button"
                className="btn-outline btn-sm"
                onClick={() => downloadResume(details)}
                disabled={downloadingId === details._id}
              >
                {downloadingId === details._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Download resume
              </button>
              {details.job && (
                <Link to={`/jobs/${details.job._id}`} className="btn-ghost btn-sm">
                  <Eye className="h-4 w-4" />
                  View job
                </Link>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">Applicant details are not available.</p>
        )}
      </Modal>

      <Modal
        open={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        title="Update application status"
        description={statusTarget ? `${statusTarget.jobSeeker?.name || 'Candidate'} • ${statusTarget.job?.title || 'Job'}` : ''}
        footer={
          <>
            <button type="button" className="btn-outline" onClick={() => setStatusTarget(null)} disabled={updating}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={handleStatusUpdate} disabled={updating || !newStatus}>
              {updating && <Loader2 className="h-4 w-4 animate-spin" />}
              {updating ? 'Updating...' : 'Update status'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="New status" value={newStatus} onChange={(event) => setNewStatus(event.target.value)}>
            {APPLICATION_STATUSES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </Select>
          <Textarea
            label="Note to candidate (optional)"
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Add a short note that will be shown to the candidate."
            maxLength={500}
          />
          <p className="help-text">{note.length}/500 characters</p>
        </div>
      </Modal>
    </div>
  );
}
