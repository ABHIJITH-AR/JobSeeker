import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  GraduationCap,
  IndianRupee,
  Loader2,
  MapPin,
  MonitorSmartphone,
  Send,
  Share2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import JobCard from '../components/JobCard';
import Modal from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { applicationApi, jobApi, savedJobApi } from '../services';
import { assetUrl, getErrorMessage } from '../services/api';
import { deadlineLabel, formatDate, formatLocation, formatNumber, formatSalary, isExpired, timeAgo } from '../utils/format';

export default function JobDetails() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [job, setJob] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyOpen, setApplyOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [officialConfirmed, setOfficialConfirmed] = useState(false);
  const [applyError, setApplyError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    jobApi
      .get(id)
      .then((response) => {
        if (!active) return;
        setJob(response.data.job);
        setCoverLetter('');
        setOfficialConfirmed(false);
        setApplyError(null);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'This job could not be found.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (searchParams.get('apply') === '1') setApplyOpen(true);
  }, [searchParams]);

  useEffect(() => {
    if (!job) return undefined;
    let active = true;
    jobApi
      .list({ sector: job.sector, category: job.category, limit: 4 })
      .then((response) => {
        if (!active) return;
        setSimilar((response.data.jobs || []).filter((item) => item._id !== job._id).slice(0, 3));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [job]);

  const government = job?.sector === 'government';
  const gov = job?.government || {};
  const expired = job ? job.isExpired || isExpired(job.applicationDeadline) : false;
  const open = Boolean(job && job.status === 'approved' && job.isActive && !expired);
  const company = job?.company;

  const overview = useMemo(() => {
    if (!job) return [];
    return [
      { label: 'Job type', value: job.jobType, icon: Briefcase },
      { label: 'Work mode', value: job.workMode, icon: MonitorSmartphone },
      { label: 'Qualification', value: job.qualification || 'Any', icon: GraduationCap },
      { label: 'Age limit', value: job.ageLimit || job.government?.ageLimit || 'Not specified', icon: CalendarClock },
      { label: 'Experience', value: job.experience || 'Any experience', icon: Clock },
      { label: 'Vacancies', value: job.vacancies ? formatNumber(job.vacancies) : '—', icon: Users },
      { label: 'Posted', value: formatDate(job.postedDate), icon: CalendarClock },
      { label: 'Deadline', value: formatDate(job.applicationDeadline), icon: CalendarClock },
    ];
  }, [job]);

  const closeApply = () => {
    setApplyOpen(false);
    if (searchParams.get('apply')) {
      const next = new URLSearchParams(searchParams);
      next.delete('apply');
      setSearchParams(next, { replace: true });
    }
  };

  const requireJobSeeker = () => {
    if (!user) {
      navigate('/login', { state: { from: `/jobs/${id}` } });
      return false;
    }
    if (user.role !== 'jobseeker') {
      toast.info('Only job seeker accounts can apply for jobs.');
      return false;
    }
    return true;
  };

  const handleApply = async (event) => {
    event.preventDefault();
    if (!requireJobSeeker()) return;
    if (government && gov.officialWebsite && !officialConfirmed) {
      toast.error('Please confirm that you completed the application on the official website.');
      return;
    }

    setSubmitting(true);
    setApplyError(null);
    try {
      const payload = { jobId: job._id, coverLetter };
      if (government) payload.viaOfficialSite = true;
      await applicationApi.apply(payload);
      toast.success(
        government
          ? 'Application tracked successfully. Complete or verify your application on the official website.'
          : 'Application submitted successfully.'
      );
      setJob((current) => ({ ...current, hasApplied: true, applicationStatus: 'Submitted' }));
      closeApply();
    } catch (err) {
      const data = err.response?.data || {};
      setApplyError({
        message: getErrorMessage(err),
        code: data.code,
        officialWebsite: data.officialWebsite,
        notificationPdf: data.notificationPdf,
      });
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/jobs/${id}` } });
      return;
    }
    if (user.role !== 'jobseeker') {
      toast.info('Only job seeker accounts can save jobs.');
      return;
    }
    setSaving(true);
    try {
      if (job.isSaved) {
        await savedJobApi.remove(job._id);
        setJob((current) => ({ ...current, isSaved: false }));
        toast.success('Job removed from saved jobs.');
      } else {
        await savedJobApi.save(job._id);
        setJob((current) => ({ ...current, isSaved: true }));
        toast.success('Job saved successfully.');
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: job.title, text: `${job.title} at ${job.companyName}`, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Job link copied to clipboard.');
      }
    } catch (err) {
      // Sharing was cancelled or is unavailable.
    }
  };

  if (loading) {
    return (
      <section className="container-page py-16">
        <LoadingSpinner label="Loading job details..." />
      </section>
    );
  }

  if (error || !job) {
    return (
      <section className="container-page py-16">
        <EmptyState
          title="Job not found"
          description={error || 'This job may have been removed or is no longer available.'}
          action={
            <Link to="/jobs" className="btn-primary">
              Browse all jobs
            </Link>
          }
        />
      </section>
    );
  }

  const applyLabel = !open
    ? 'Applications closed'
    : job.hasApplied
      ? `Applied${job.applicationStatus ? ` • ${job.applicationStatus}` : ''}`
      : government
        ? 'Track Government Application'
        : 'Apply Now';

  return (
    <>
      <div className="border-b border-line bg-skysoft/50">
        <div className="container-page flex flex-wrap items-center gap-2 py-3 text-xs text-muted">
          <Link to="/" className="hover:text-brand">Home</Link>
          <span>/</span>
          <Link to={government ? '/government-jobs' : '/private-jobs'} className="hover:text-brand">
            {government ? 'Government Jobs' : 'Private Jobs'}
          </Link>
          <span>/</span>
          <span className="truncate text-ink">{job.title}</span>
        </div>
      </div>

      <section className="container-page py-8">
        <button type="button" onClick={() => navigate(-1)} className="btn-ghost btn-sm mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-6">
            <div className="card p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <Avatar name={job.companyName || gov.organization} src={job.companyLogo} size="xl" rounded="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={government ? 'badge-navy' : 'badge-blue'}>{government ? 'Government' : 'Private'}</span>
                    {government && gov.isVerified && (
                      <span className="badge-green">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Verified vacancy
                      </span>
                    )}
                    {expired && <span className="badge-red">Expired</span>}
                    {job.hasApplied && (
                      <span className="badge-green">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {job.applicationStatus || 'Applied'}
                      </span>
                    )}
                  </div>
                  <h1 className="mt-2 text-2xl font-bold leading-tight text-ink sm:text-3xl">{job.title}</h1>
                  <p className="mt-1.5 text-sm font-semibold text-muted">
                    {job.companyName || gov.organization || 'Company'}
                    {gov.department ? ` • ${gov.department}` : ''}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-brand" />
                      {formatLocation(job.location)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-brand" />
                      {job.jobType}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MonitorSmartphone className="h-4 w-4 text-brand" />
                      {job.workMode}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Eye className="h-4 w-4 text-brand" />
                      {formatNumber(job.views || 0)} views
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 text-lg font-bold text-navy">
                      <IndianRupee className="h-4 w-4" />
                      {formatSalary(job).replace('₹', '')}
                    </span>
                    {job.experience && <span className="text-sm text-muted">• {job.experience}</span>}
                    <span className={`text-xs font-semibold ${expired ? 'text-red-600' : 'text-muted'}`}>
                      {deadlineLabel(job.applicationDeadline)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5">
                {open ? (
                  job.hasApplied ? (
                    <button type="button" className="btn-primary" disabled>
                      <CheckCircle2 className="h-4 w-4" />
                      {applyLabel}
                    </button>
                  ) : (
                    <button type="button" className="btn-primary" onClick={() => setApplyOpen(true)}>
                      <Send className="h-4 w-4" />
                      {applyLabel}
                    </button>
                  )
                ) : (
                  <button type="button" className="btn-outline" disabled>
                    {applyLabel}
                  </button>
                )}

                <button type="button" className="btn-outline" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : job.isSaved ? (
                    <BookmarkCheck className="h-4 w-4 text-brand" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                  {job.isSaved ? 'Saved' : 'Save Job'}
                </button>

                <button type="button" className="btn-outline" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                  Share
                </button>

                {government && gov.officialWebsite && (
                  <a href={gov.officialWebsite} target="_blank" rel="noopener noreferrer" className="btn-navy">
                    <ExternalLink className="h-4 w-4" />
                    Official Website
                  </a>
                )}
              </div>
            </div>

            <div className="card p-5 sm:p-6">
              <h2 className="text-lg font-bold text-ink">Job description</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{job.description}</p>

              {job.responsibilities?.length > 0 && (
                <>
                  <h3 className="mt-6 text-base font-bold text-ink">Key responsibilities</h3>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-slate-600">
                    {job.responsibilities.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </>
              )}

              {job.skills?.length > 0 && (
                <>
                  <h3 className="mt-6 text-base font-bold text-ink">Required skills</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
                      <span key={skill} className="rounded-full bg-skysoft px-3 py-1 text-xs font-semibold text-brand">
                        {skill}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {(job.qualification || job.experience || (job.ageLimit && !government)) && (
                <>
                  <h3 className="mt-6 text-base font-bold text-ink">Eligibility</h3>
                  <div className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                    {job.qualification && (
                      <p className="flex items-start gap-2">
                        <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                        <span><strong className="font-semibold text-ink">Qualification:</strong> {job.qualification}</span>
                      </p>
                    )}
                    {job.ageLimit && !government && (
                      <p className="flex items-start gap-2">
                        <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                        <span><strong className="font-semibold text-ink">Age limit:</strong> {job.ageLimit}</span>
                      </p>
                    )}
                    {job.experience && (
                      <p className="flex items-start gap-2">
                        <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                        <span><strong className="font-semibold text-ink">Experience:</strong> {job.experience}</span>
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {government && (
              <div className="card p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-brand" />
                  <h2 className="text-lg font-bold text-ink">Government vacancy details</h2>
                </div>

                {gov.isVerified ? (
                  <p className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-800">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
                    This vacancy has been verified by the JobSeeker admin team against the official recruitment
                    website and notification.
                  </p>
                ) : (
                  <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    This vacancy is not yet marked as verified. Always confirm details on the official recruitment
                    website before applying.
                  </p>
                )}

                <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                  {[
                    ['Organization', gov.organization],
                    ['Department', gov.department],
                    ['Post name', gov.postName],
                    ['Notification number', gov.notificationNumber],
                    ['Pay scale', gov.payScale],
                    ['Age limit', gov.ageLimit],
                    ['Application fee', gov.applicationFee],
                    ['Application starts', gov.applicationStartDate ? formatDate(gov.applicationStartDate) : ''],
                    ['Exam date', gov.examDate ? formatDate(gov.examDate) : ''],
                  ]
                    .filter(([, value]) => value)
                    .map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
                        <dd className="mt-0.5 font-medium text-ink">{value}</dd>
                      </div>
                    ))}
                </dl>

                {gov.eligibility && (
                  <div className="mt-5">
                    <h3 className="text-sm font-bold text-ink">Eligibility details</h3>
                    <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-slate-600">{gov.eligibility}</p>
                  </div>
                )}
                {gov.selectionProcess && (
                  <div className="mt-5">
                    <h3 className="text-sm font-bold text-ink">Selection process</h3>
                    <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-slate-600">{gov.selectionProcess}</p>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  {gov.officialWebsite && (
                    <a href={gov.officialWebsite} target="_blank" rel="noopener noreferrer" className="btn-navy btn-sm">
                      <ExternalLink className="h-4 w-4" />
                      Apply on official website
                    </a>
                  )}
                  {gov.notificationPdf && (
                    <a
                      href={assetUrl(gov.notificationPdf)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline btn-sm"
                    >
                      <FileText className="h-4 w-4" />
                      Official notification PDF
                    </a>
                  )}
                </div>
              </div>
            )}

            {!government && company && (
              <div className="card p-5 sm:p-6">
                <h2 className="text-lg font-bold text-ink">About the company</h2>
                <div className="mt-3 flex items-start gap-4">
                  <Avatar name={company.companyName} src={company.logo} size="lg" rounded="lg" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-ink">{company.companyName}</h3>
                      {company.isVerified && (
                        <span className="badge-green">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {[company.industry, company.companySize, company.city, company.state].filter(Boolean).join(' • ') ||
                        'Company details'}
                    </p>
                    {company.description && (
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{company.description}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link to={`/companies/${company._id}`} className="btn-outline btn-sm">
                        <Building2 className="h-4 w-4" />
                        View company profile
                      </Link>
                      {company.website && (
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm">
                          <ExternalLink className="h-4 w-4" />
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="card p-5 lg:sticky lg:top-24">
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Job overview</h2>
              <dl className="mt-4 space-y-3">
                {overview.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-skysoft text-brand">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <dt className="text-xs text-muted">{item.label}</dt>
                        <dd className="text-sm font-semibold text-ink">{item.value}</dd>
                      </div>
                    </div>
                  );
                })}
              </dl>

              <div className="mt-5 border-t border-line pt-4 text-xs text-muted">
                <p>Applications received: <span className="font-semibold text-ink">{formatNumber(job.applicationCount || 0)}</span></p>
                <p className="mt-1">Posted {timeAgo(job.postedDate)}</p>
              </div>

              {open && !job.hasApplied && (
                <button type="button" className="btn-primary mt-5 w-full" onClick={() => setApplyOpen(true)}>
                  <Send className="h-4 w-4" />
                  {government ? 'Track Government Application' : 'Apply Now'}
                </button>
              )}

              {job.hasApplied && (
                <Link to="/dashboard/applications" className="btn-outline mt-5 w-full">
                  View my applications
                </Link>
              )}

              <p className="mt-3 text-center text-[11px] leading-4 text-muted">
                {government
                  ? 'Government applications are completed on the official recruitment website.'
                  : 'Never pay money to an employer for a job offer.'}
              </p>
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <div className="mt-10">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="eyebrow">Similar jobs</p>
                <h2 className="section-title mt-1">More roles you may like</h2>
              </div>
              <Link to={government ? '/government-jobs' : '/private-jobs'} className="text-sm font-semibold text-brand">
                View all
              </Link>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((item) => (
                <JobCard key={item._id} job={item} />
              ))}
            </div>
          </div>
        )}
      </section>

      <Modal
        open={applyOpen}
        onClose={closeApply}
        title={government ? 'Track your government application' : 'Apply for this job'}
        description={
          government
            ? 'Government applications must be completed on the official recruitment website. Use this form only to track your application in JobSeeker.'
            : `Your profile and resume will be shared with ${job.companyName || 'the employer'}.`
        }
        size="lg"
        footer={
          <>
            <button type="button" className="btn-outline" onClick={closeApply} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" form="apply-form" className="btn-primary" disabled={submitting || (government && Boolean(gov.officialWebsite) && !officialConfirmed)}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {government ? 'Confirm & Track' : 'Submit Application'}
            </button>
          </>
        }
      >
        <form id="apply-form" onSubmit={handleApply} className="space-y-4">
          {government && (
            <div className="space-y-3">
              <div className="rounded-lg border border-line bg-skysoft/60 p-3 text-sm text-ink">
                <p className="font-semibold">How government applications work on JobSeeker</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-5 text-muted">
                  <li>Open the official recruitment website and complete the application there.</li>
                  <li>Return to this page and confirm you have applied.</li>
                  <li>We will add the application to your dashboard so you can track it.</li>
                </ol>
              </div>

              {gov.officialWebsite ? (
                <a href={gov.officialWebsite} target="_blank" rel="noopener noreferrer" className="btn-navy w-full">
                  <ExternalLink className="h-4 w-4" />
                  Open official application website
                </a>
              ) : (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  The official website for this vacancy is not available. Please contact support before applying.
                </p>
              )}

              {gov.notificationPdf && (
                <a href={assetUrl(gov.notificationPdf)} target="_blank" rel="noopener noreferrer" className="btn-outline w-full">
                  <FileText className="h-4 w-4" />
                  View official notification PDF
                </a>
              )}

              <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-line p-3">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-line text-brand focus:ring-brand"
                  checked={officialConfirmed}
                  onChange={(event) => setOfficialConfirmed(event.target.checked)}
                />
                <span className="text-xs leading-5 text-slate-600">
                  I confirm that I have completed (or will complete) my application on the official government
                  recruitment website. I understand JobSeeker only tracks this application and does not submit it on my
                  behalf.
                </span>
              </label>
            </div>
          )}

          {applyError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <p className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{applyError.message}</span>
              </p>
              {applyError.code === 'RESUME_REQUIRED' && (
                <Link to="/dashboard/resume" className="mt-2 inline-block text-xs font-bold text-red-700 underline">
                  Upload a resume
                </Link>
              )}
              {applyError.code === 'PROFILE_INCOMPLETE' && (
                <Link to="/dashboard/profile" className="mt-2 inline-block text-xs font-bold text-red-700 underline">
                  Complete my profile
                </Link>
              )}
              {applyError.code === 'OFFICIAL_SITE_REQUIRED' && applyError.officialWebsite && (
                <a
                  href={applyError.officialWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-red-700 underline"
                >
                  Open official website
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

          <div>
            <label htmlFor="cover-letter" className="label">
              {government ? 'Tracking note (optional)' : 'Cover letter (optional)'}
            </label>
            <textarea
              id="cover-letter"
              rows={5}
              className="input resize-y"
              maxLength={3000}
              placeholder={
                government
                  ? 'Add your official application / registration number or a short note for your records.'
                  : 'Tell the employer why you are a good fit for this role.'
              }
              value={coverLetter}
              onChange={(event) => setCoverLetter(event.target.value)}
            />
            <p className="help-text">{coverLetter.length}/3000 characters</p>
          </div>

          {!government && (
            <p className="rounded-lg border border-line bg-skysoft/50 px-3 py-2 text-xs leading-5 text-muted">
              Tip: Make sure your profile is complete and your resume is up to date before applying. You can update
              both from your dashboard.
            </p>
          )}
        </form>
      </Modal>
    </>
  );
}
