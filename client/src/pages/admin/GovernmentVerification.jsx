import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  PlusCircle,
  Search,
  ShieldCheck,
  ShieldOff,
  XCircle,
} from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import { Input, Select, Textarea } from '../../components/FormField';
import { useToast } from '../../context/ToastContext';
import { adminApi } from '../../services';
import { assetUrl, getErrorMessage } from '../../services/api';
import { formatDate, formatDateTime, formatLocation } from '../../utils/format';

export default function GovernmentVerification() {
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [verified, setVerified] = useState('');
  const [status, setStatus] = useState('');
  const [term, setTerm] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState(null);
  const [form, setForm] = useState({ officialWebsite: '', notificationNumber: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    adminApi
      .governmentVerification({ page, limit: 10, verified: verified || undefined, status: status || undefined, q: q || undefined })
      .then((response) => {
        if (!active) return;
        setJobs(response.data.jobs || []);
        setPagination(response.data.pagination || null);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Unable to load government jobs.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, verified, status, q, reloadKey]);

  const openAction = (job, shouldVerify) => {
    const gov = job.government || {};
    setAction({ job, verify: shouldVerify });
    setForm({
      officialWebsite: gov.officialWebsite || '',
      notificationNumber: gov.notificationNumber || '',
      notes: gov.verificationNotes || '',
    });
  };

  const handleSubmit = async () => {
    if (!action) return;
    if (action.verify) {
      if (!form.officialWebsite.trim()) {
        toast.error('Official application website is required before verification.');
        return;
      }
      if (!/^https?:\/\/.+/i.test(form.officialWebsite.trim())) {
        toast.error('Official website must start with http:// or https://');
        return;
      }
      const hasPdf = Boolean(action.job.government?.notificationPdf);
      if (!form.notificationNumber.trim() && !hasPdf) {
        toast.error('Provide the official notification number or upload a notification PDF before verifying.');
        return;
      }
    }
    setSaving(true);
    try {
      const response = await adminApi.verifyGovernmentJob(action.job._id, {
        isVerified: action.verify,
        officialWebsite: form.officialWebsite.trim(),
        notificationNumber: form.notificationNumber.trim(),
        notes: form.notes.trim(),
      });
      setJobs((current) => current.map((item) => (item._id === action.job._id ? { ...item, ...response.data.job } : item)));
      toast.success(response.data.message || 'Government job updated.');
      setAction(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update verification.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setQ(term.trim());
  };

  const hasFilters = Boolean(verified || status || q);
  const clearFilters = () => {
    setTerm('');
    setQ('');
    setVerified('');
    setStatus('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Government verification</h2>
          <p className="mt-1 text-sm text-muted">Verify government vacancies against their official website and notification.</p>
        </div>
        <Link to="/admin/post-job" className="btn-primary btn-sm self-start">
          <PlusCircle className="h-4 w-4" />
          Post government job
        </Link>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-skysoft bg-skysoft/60 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
        <p className="text-xs leading-5 text-slate-700">
          Only mark a vacancy as verified after confirming it on the official government website. A verified vacancy shows a
          verified badge to job seekers. Verification requires a valid official URL and either a notification number or PDF.
        </p>
      </div>

      <div className="card p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="Verification" value={verified} onChange={(event) => { setVerified(event.target.value); setPage(1); }}>
            <option value="">All government jobs</option>
            <option value="true">Verified</option>
            <option value="false">Not verified</option>
          </Select>
          <Select label="Job status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
          <form onSubmit={handleSearch} className="flex items-end gap-2 sm:col-span-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                className="input pl-10"
                placeholder="Search title, organization or notification number"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                aria-label="Search government jobs"
              />
            </div>
            <button type="submit" className="btn-primary">Search</button>
            {hasFilters && <button type="button" className="btn-ghost" onClick={clearFilters}>Reset</button>}
          </form>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="card h-48 animate-pulse bg-slate-50" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={ShieldCheck}
          title="Could not load government jobs"
          description={error}
          action={<button type="button" className="btn-primary" onClick={() => setReloadKey((value) => value + 1)}>Try again</button>}
        />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No government jobs found"
          description={hasFilters ? 'Try different filters or a different search term.' : 'No government vacancies have been posted yet.'}
          action={
            hasFilters ? (
              <button type="button" className="btn-primary" onClick={clearFilters}>Clear filters</button>
            ) : (
              <Link to="/admin/post-job" className="btn-primary">Post a government job</Link>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const gov = job.government || {};
            return (
              <div key={job._id} className="card p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-ink">{job.title}</h3>
                      <span className="badge-navy">Government</span>
                      {gov.isVerified ? (
                        <span className="badge-green">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      ) : (
                        <span className="badge-amber">Not verified</span>
                      )}
                      <span className={`badge-${job.status === 'approved' ? 'green' : job.status === 'pending' ? 'amber' : 'slate'}`}>
                        {job.status}
                      </span>
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-brand" />
                        {gov.organization || job.companyName || 'Organization'}
                      </span>
                      {gov.department && <span>• {gov.department}</span>}
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
                      {gov.notificationNumber && <span>Notification: {gov.notificationNumber}</span>}
                      {gov.postName && <span>Post: {gov.postName}</span>}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      {gov.officialWebsite && (
                        <a href={gov.officialWebsite} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Official website
                        </a>
                      )}
                      {gov.notificationPdf && (
                        <a href={assetUrl(gov.notificationPdf)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
                          <FileText className="h-3.5 w-3.5" />
                          Notification PDF
                        </a>
                      )}
                      {job.employer?.name && <span className="text-muted">Posted by {job.employer.name}</span>}
                    </div>
                    {gov.verificationNotes && (
                      <p className="mt-2 rounded-lg border border-line bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        Verification notes: {gov.verificationNotes}
                      </p>
                    )}
                    {gov.isVerified && gov.verifiedAt && (
                      <p className="mt-1 text-[11px] text-muted">Verified on {formatDateTime(gov.verifiedAt)}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {gov.isVerified ? (
                      <button type="button" className="btn-outline btn-sm text-red-600 hover:bg-red-50" onClick={() => openAction(job, false)}>
                        <ShieldOff className="h-4 w-4" />
                        Remove verification
                      </button>
                    ) : (
                      <button type="button" className="btn-primary btn-sm" onClick={() => openAction(job, true)}>
                        <ShieldCheck className="h-4 w-4" />
                        Verify vacancy
                      </button>
                    )}
                    <Link to={`/admin/jobs/${job._id}/edit`} className="btn-ghost btn-sm">
                      Edit
                    </Link>
                    {job.status === 'approved' && (
                      <Link to={`/jobs/${job._id}`} className="btn-ghost btn-sm">
                        View
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />

      <Modal
        open={Boolean(action)}
        onClose={() => setAction(null)}
        title={action?.verify ? 'Verify government vacancy' : 'Remove verification'}
        description={
          action?.verify
            ? `Confirm "${action?.job?.title}" against its official government notification before verifying.`
            : `Remove the verified badge from "${action?.job?.title}".`
        }
        footer={
          <>
            <button type="button" className="btn-outline" onClick={() => setAction(null)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className={action?.verify ? 'btn-primary' : 'btn-danger'} onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : action?.verify ? 'Verify vacancy' : 'Remove verification'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-line bg-slate-50/60 p-3 text-sm">
            <p className="font-semibold text-ink">{action?.job?.government?.organization || action?.job?.companyName}</p>
            <p className="mt-0.5 text-xs text-muted">{action?.job?.title}</p>
            <p className="mt-0.5 text-xs text-muted">
              {[action?.job?.government?.notificationNumber ? `Notification ${action.job.government.notificationNumber}` : null, action?.job?.government?.notificationPdf ? 'PDF attached' : null]
                .filter(Boolean)
                .join(' • ') || 'No notification number or PDF on file'}
            </p>
          </div>
          <Input
            label="Official application website"
            value={form.officialWebsite}
            onChange={(event) => setForm((current) => ({ ...current, officialWebsite: event.target.value }))}
            placeholder="https://official-recruitment-site.gov.in"
            help="Required before a government vacancy can be verified."
          />
          <Input
            label="Official notification number"
            value={form.notificationNumber}
            onChange={(event) => setForm((current) => ({ ...current, notificationNumber: event.target.value }))}
            placeholder="e.g. SSC/2026/01"
            help="Required if no notification PDF is attached."
          />
          <Textarea
            label="Verification notes (optional)"
            rows={3}
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Add an internal note about this verification decision."
            maxLength={500}
          />
          <p className="help-text">{form.notes.length}/500 characters</p>
          {!action?.verify && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              Removing verification will hide the verified badge from this government vacancy.
            </div>
          )}
          {action?.verify && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              Verify only after checking the official website and notification. Job seekers rely on this badge.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
