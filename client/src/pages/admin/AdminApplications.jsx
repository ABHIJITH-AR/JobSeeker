import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
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
  Users,
} from 'lucide-react';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import { Input, Select, Textarea } from '../../components/FormField';
import { useToast } from '../../context/ToastContext';
import { adminApi, applicationApi } from '../../services';
import { downloadBlob, getErrorMessage } from '../../services/api';
import { APPLICATION_STATUSES } from '../../utils/constants';
import { formatDateTime, formatLocation } from '../../utils/format';

const profileLocation = (profile) => {
  if (!profile) return 'India';
  return formatLocation({ state: profile.state, district: profile.district, city: profile.city });
};

export default function AdminApplications() {
  const toast = useToast();
  const [applications, setApplications] = useState([]);
  const [counts, setCounts] = useState({});
  const [pagination, setPagination] = useState(null);
  const [sector, setSector] = useState('');
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
    let active = true;
    setLoading(true);
    setError('');
    adminApi
      .applications({ page, limit: 10, sector: sector || undefined, status: status || undefined, q: q || undefined })
      .then((response) => {
        if (!active) return;
        setApplications(response.data.applications || []);
        setCounts(response.data.counts || {});
        setPagination(response.data.pagination || null);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Unable to load applications.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, sector, status, q, reloadKey]);

  const openDetails = (application) => {
    setDetailsOpen(true);
    setDetails(null);
    setDetailsLoading(true);
    applicationApi
      .get(application._id)
      .then((response) => setDetails(response.data.application))
      .catch((err) => toast.error(getErrorMessage(err, 'Could not load application details.')))
      .finally(() => setDetailsLoading(false));
  };

  const openStatus = (application) => {
    setStatusTarget(application);
    setNewStatus(application.status || 'Submitted');
    setNote('');
  };

  const handleUpdateStatus = async () => {
    if (!statusTarget) return;
    if (!newStatus) {
      toast.error('Please choose a status.');
      return;
    }
    setUpdating(true);
    try {
      await applicationApi.updateStatus(statusTarget._id, { status: newStatus, note: note.trim() });
      setApplications((current) => current.map((item) => (item._id === statusTarget._id ? { ...item, status: newStatus } : item)));
      if (details && details._id === statusTarget._id) {
        setDetails((current) => (current ? { ...current, status: newStatus } : current));
      }
      setStatusTarget(null);
      setReloadKey((value) => value + 1);
      toast.success(`Application status updated to ${newStatus}.`);
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

  const hasFilters = Boolean(sector || status || q);
  const clearFilters = () => {
    setTerm('');
    setQ('');
    setSector('');
    setStatus('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-ink">Applications</h2>
        <p className="mt-1 text-sm text-muted">Monitor every application across private and government vacancies.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {APPLICATION_STATUSES.map((item) => (
          <div key={item} className="card p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{item}</p>
            <p className="mt-1 text-2xl font-bold text-ink">{counts[item] ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="card p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="Sector" value={sector} onChange={(event) => { setSector(event.target.value); setPage(1); }}>
            <option value="">All sectors</option>
            <option value="private">Private</option>
            <option value="government">Government</option>
          </Select>
          <Select label="Status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
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
                placeholder="Search applicant name or email"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                aria-label="Search applications"
              />
            </div>
            <button type="submit" className="btn-primary">Search</button>
            {hasFilters && <button type="button" className="btn-ghost" onClick={clearFilters}>Reset</button>}
          </form>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="card h-40 animate-pulse bg-slate-50" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={Users}
          title="Could not load applications"
          description={error}
          action={<button type="button" className="btn-primary" onClick={() => setReloadKey((value) => value + 1)}>Try again</button>}
        />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No applications found"
          description={hasFilters ? 'Try different filters or a different search term.' : 'No applications have been submitted yet.'}
          action={hasFilters ? <button type="button" className="btn-primary" onClick={clearFilters}>Clear filters</button> : undefined}
        />
      ) : (
        <div className="space-y-3">
          {applications.map((application) => {
            const profile = application.seekerProfile;
            const job = application.job || {};
            return (
              <div key={application._id} className="card p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar name={application.jobSeeker?.name || profile?.fullName} src={profile?.profilePhoto} size="md" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-ink">{application.jobSeeker?.name || profile?.fullName || 'Applicant'}</h3>
                        <StatusBadge status={application.status} />
                        {job.sector && <span className={job.sector === 'government' ? 'badge-navy' : 'badge-blue'}>{job.sector === 'government' ? 'Government' : 'Private'}</span>}
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-brand" />
                          {application.jobSeeker?.email || '-'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-brand" />
                          {application.jobSeeker?.phone || profile?.phone || '-'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-brand" />
                          {profileLocation(profile)}
                        </span>
                      </p>
                      <p className="mt-2 text-sm text-ink">
                        Applied for <span className="font-semibold">{job.title || 'a job'}</span>
                        {job.companyName ? <span className="text-muted"> at {job.companyName}</span> : null}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatDateTime(application.appliedAt)}
                        {profile?.education ? ` • ${profile.education}` : ''}
                        {profile?.experience ? ` • ${profile.experience}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button type="button" className="btn-outline btn-sm" onClick={() => openDetails(application)}>
                      <Eye className="h-4 w-4" />
                      Details
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
        title="Application details"
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
            <p className="mt-2 text-sm text-muted">Loading application...</p>
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

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-line p-3">
                <h4 className="text-xs font-bold uppercase tracking-wide text-muted">Contact</h4>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink">
                  <Phone className="h-4 w-4 text-brand" />
                  {details.jobSeeker?.phone || details.seekerProfile?.phone || '-'}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink">
                  <Mail className="h-4 w-4 text-brand" />
                  {details.jobSeeker?.email || '-'}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink">
                  <MapPin className="h-4 w-4 text-brand" />
                  {profileLocation(details.seekerProfile)}
                </p>
              </div>
              <div className="rounded-lg border border-line p-3">
                <h4 className="text-xs font-bold uppercase tracking-wide text-muted">Education & experience</h4>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink">
                  <GraduationCap className="h-4 w-4 text-brand" />
                  {details.seekerProfile?.education || 'Not specified'}
                </p>
                {details.seekerProfile?.collegeName && <p className="mt-1 text-sm text-ink">{details.seekerProfile.collegeName}</p>}
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
              <ul className="mt-2 space-y-2">
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
              </ul>
            </div>

            <div className="flex flex-wrap gap-2">
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
          <p className="text-sm text-muted">Application details are not available.</p>
        )}
      </Modal>

      <Modal
        open={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        title="Update application status"
        description={statusTarget ? `${statusTarget.jobSeeker?.name || 'Applicant'} • ${statusTarget.job?.title || 'Job'}` : ''}
        footer={
          <>
            <button type="button" className="btn-outline" onClick={() => setStatusTarget(null)} disabled={updating}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={handleUpdateStatus} disabled={updating}>
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
          <Input
            label="Note to job seeker (optional)"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Visible in the application status history"
            maxLength={300}
          />
        </div>
      </Modal>
    </div>
  );
}
