import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  FileText,
  Info,
  Loader2,
  MapPin,
  Save,
  ShieldCheck,
  Upload,
  Wallet,
  X,
} from 'lucide-react';
import LocationSelect from '../../components/LocationSelect';
import { Input, Select, Textarea } from '../../components/FormField';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { jobApi } from '../../services';
import { assetUrl, getErrorMessage } from '../../services/api';
import {
  EXPERIENCE_LEVELS,
  GOVERNMENT_CATEGORIES,
  JOB_TYPES,
  PRIVATE_CATEGORIES,
  QUALIFICATIONS,
  WORK_MODES,
} from '../../utils/constants';
import { fileSize, formatDateTime, toDateInput } from '../../utils/format';

const defaultDeadline = () => toDateInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

const buildEmptyForm = () => ({
  title: '',
  category: '',
  description: '',
  responsibilities: '',
  skills: '',
  qualification: '',
  experience: '',
  experienceMin: '',
  jobType: 'Full Time',
  workMode: 'On-site',
  vacancies: '1',
  applicationDeadline: defaultDeadline(),
  salaryMin: '',
  salaryMax: '',
  salaryPeriod: 'month',
  salaryText: '',
  state: '',
  district: '',
  city: '',
  pincode: '',
  companyName: '',
  government: {
    organization: '',
    department: '',
    notificationNumber: '',
    postName: '',
    ageLimit: '',
    eligibility: '',
    payScale: '',
    applicationStartDate: '',
    examDate: '',
    selectionProcess: '',
    applicationFee: '',
    officialWebsite: '',
  },
});

export default function PostJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === 'admin';
  const editing = Boolean(id);
  const logoInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  const [meta, setMeta] = useState(null);
  const [job, setJob] = useState(null);
  const [sector, setSector] = useState(isAdmin && !editing ? 'government' : 'private');
  const [form, setForm] = useState(buildEmptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [notificationFile, setNotificationFile] = useState(null);
  const [existingLogo, setExistingLogo] = useState('');
  const [existingPdf, setExistingPdf] = useState('');

  useEffect(() => {
    let active = true;
    const requests = [jobApi.meta()];
    if (id) requests.push(jobApi.get(id));

    Promise.all(requests)
      .then(([metaResponse, jobResponse]) => {
        if (!active) return;
        setMeta(metaResponse.data.meta);

        if (jobResponse) {
          const data = jobResponse.data.job;
          const gov = data.government || {};
          setJob(data);
          setSector(data.sector || 'private');
          setExistingLogo(data.companyLogo || '');
          setExistingPdf(gov.notificationPdf || '');
          setForm({
            title: data.title || '',
            category: data.category || '',
            description: data.description || '',
            responsibilities: (data.responsibilities || []).join('\n'),
            skills: (data.skills || []).join(', '),
            qualification: data.qualification || '',
            experience: data.experience || '',
            experienceMin: data.experienceMin ? String(data.experienceMin) : '',
            jobType: data.jobType || 'Full Time',
            workMode: data.workMode || 'On-site',
            vacancies: data.vacancies ? String(data.vacancies) : '1',
            applicationDeadline: toDateInput(data.applicationDeadline),
            salaryMin: data.salaryMin !== null && data.salaryMin !== undefined ? String(data.salaryMin) : '',
            salaryMax: data.salaryMax !== null && data.salaryMax !== undefined ? String(data.salaryMax) : '',
            salaryPeriod: data.salaryPeriod || 'month',
            salaryText: data.salaryText || '',
            state: data.location?.state || '',
            district: data.location?.district || '',
            city: data.location?.city || '',
            pincode: data.location?.pincode || '',
            companyName: data.companyName || '',
            government: {
              organization: gov.organization || '',
              department: gov.department || '',
              notificationNumber: gov.notificationNumber || '',
              postName: gov.postName || '',
              ageLimit: gov.ageLimit || '',
              eligibility: gov.eligibility || '',
              payScale: gov.payScale || '',
              applicationStartDate: toDateInput(gov.applicationStartDate),
              examDate: toDateInput(gov.examDate),
              selectionProcess: gov.selectionProcess || '',
              applicationFee: gov.applicationFee || '',
              officialWebsite: gov.officialWebsite || '',
            },
          });
        }
      })
      .catch((err) => toast.error(getErrorMessage(err, 'Could not load the job form.')))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
  }, [logoPreview]);

  const categories = useMemo(() => {
    if (sector === 'government') return meta?.governmentCategories || GOVERNMENT_CATEGORIES;
    return meta?.privateCategories || PRIVATE_CATEGORIES;
  }, [meta, sector]);

  const qualifications = meta?.qualifications || QUALIFICATIONS;
  const experienceLevels = meta?.experienceLevels || EXPERIENCE_LEVELS;

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const updateGovernment = (key, value) => {
    setForm((current) => ({ ...current, government: { ...current.government, [key]: value } }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const switchSector = (nextSector) => {
    if (editing || nextSector === sector) return;
    setSector(nextSector);
    setForm((current) => ({ ...current, category: '' }));
    setErrors({});
  };

  const handleLogo = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a JPG, PNG, WEBP or GIF image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be smaller than 2MB.');
      return;
    }
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handlePdf = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Official notification must be a PDF file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Notification PDF must be smaller than 5MB.');
      return;
    }
    setNotificationFile(file);
  };

  const clearLogo = () => {
    setLogoFile(null);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview('');
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const clearPdf = () => {
    setNotificationFile(null);
    if (pdfInputRef.current) pdfInputRef.current.value = '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!form.title.trim()) next.title = 'Job title is required.';
    if (!form.category) next.category = 'Please select a category.';
    if (form.description.trim().length < 20) next.description = 'Description must be at least 20 characters.';
    if (!form.applicationDeadline) next.applicationDeadline = 'Select an application deadline.';
    else if (new Date(form.applicationDeadline).getTime() <= Date.now()) {
      next.applicationDeadline = 'Application deadline must be in the future.';
    }
    if (form.salaryMin && form.salaryMax && Number(form.salaryMin) > Number(form.salaryMax)) {
      next.salaryMax = 'Maximum salary must be greater than or equal to minimum salary.';
    }
    if (sector === 'government') {
      if (!form.government.organization.trim()) next.organization = 'Recruiting organization is required.';
      if (!form.government.officialWebsite.trim()) next.officialWebsite = 'Official application website is required.';
      else if (!/^https?:\/\/.+/i.test(form.government.officialWebsite.trim())) {
        next.officialWebsite = 'Enter a valid URL starting with http:// or https://';
      }
    }
    if (isAdmin && sector === 'private' && !form.companyName.trim()) {
      next.companyName = 'Company name is required for admin-posted private jobs.';
    }

    setErrors(next);
    if (Object.keys(next).length) {
      toast.error('Please fix the highlighted fields.');
      return;
    }

    const payload = {
      sector,
      title: form.title.trim(),
      category: form.category,
      description: form.description.trim(),
      responsibilities: form.responsibilities,
      skills: form.skills,
      qualification: form.qualification,
      experience: form.experience,
      experienceMin: form.experienceMin || 0,
      salaryMin: form.salaryMin || null,
      salaryMax: form.salaryMax || null,
      salaryPeriod: form.salaryPeriod,
      salaryText: form.salaryText.trim(),
      jobType: form.jobType,
      workMode: form.workMode,
      vacancies: form.vacancies || 1,
      applicationDeadline: form.applicationDeadline,
      state: form.state,
      district: form.district,
      city: form.city,
      pincode: form.pincode,
      companyName: form.companyName.trim(),
    };

    if (sector === 'government') {
      payload.government = {
        ...form.government,
        organization: form.government.organization.trim(),
        officialWebsite: form.government.officialWebsite.trim(),
      };
      payload.companyName = form.government.organization.trim();
    }

    const isMultipart = Boolean(logoFile || notificationFile);
    let requestData = payload;

    if (isMultipart) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (key === 'government') formData.append('government', JSON.stringify(value));
        else formData.append(key, value);
      });
      if (logoFile) formData.append('logo', logoFile);
      if (notificationFile) formData.append('notificationPdf', notificationFile);
      requestData = formData;
    }

    setSaving(true);
    try {
      const response = editing
        ? await jobApi.update(id, requestData, isMultipart)
        : await jobApi.create(requestData, isMultipart);
      toast.success(response.data.message || 'Job saved successfully.');
      if (isAdmin && sector === 'government' && !editing) {
        navigate('/admin/government-verification');
      } else {
        navigate(isAdmin ? '/admin/jobs' : '/employer/jobs');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save the job.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner label="Preparing job form..." />;

  const government = sector === 'government';
  const title = editing ? 'Edit job' : isAdmin ? (government ? 'Post a government job' : 'Post a job') : 'Post a new job';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to={isAdmin ? '/admin/jobs' : '/employer/jobs'} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-brand">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to jobs
          </Link>
          <h2 className="mt-2 text-xl font-bold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-muted">
            {government
              ? 'Publish an official government vacancy. Verification is required before the verified badge is shown.'
              : editing
                ? 'Changes to your job will be reviewed again before it goes live.'
                : 'Provide clear job details to attract the right candidates.'}
          </p>
        </div>
        {editing && job && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-slate">Current status: {job.status}</span>
            {government && (job.government?.isVerified ? <span className="badge-green"><BadgeCheck className="h-3.5 w-3.5" />Verified</span> : <span className="badge-amber">Not verified</span>)}
          </div>
        )}
      </div>

      {isAdmin && !editing && (
        <div className="card p-4 sm:p-5">
          <p className="label">Job sector</p>
          <div className="mt-2 inline-flex rounded-lg border border-line bg-slate-50 p-1">
            {[
              { key: 'government', label: 'Government', icon: ShieldCheck },
              { key: 'private', label: 'Private', icon: Building2 },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => switchSector(item.key)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-semibold transition ${
                    sector === item.key ? 'bg-white text-navy shadow-sm' : 'text-muted hover:text-ink'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted">
            Government jobs require an official website and are verified separately. Admin-posted jobs go live immediately.
          </p>
        </div>
      )}

      {!isAdmin && (
        <div className="flex items-start gap-2.5 rounded-xl border border-skysoft bg-skysoft/60 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
          <p className="text-xs leading-5 text-slate-700">
            New and edited jobs are sent to the JobSeeker admin team for review. Once approved, they become visible to job seekers.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-brand" />
            <h2 className="text-base font-bold text-ink">Job basics</h2>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Job title"
              required
              value={form.title}
              error={errors.title}
              onChange={(event) => update('title', event.target.value)}
              placeholder={government ? 'e.g. Assistant Section Officer' : 'e.g. Frontend Developer'}
              className="sm:col-span-2"
              maxLength={160}
            />
            <Select
              label="Category"
              required
              value={form.category}
              error={errors.category}
              onChange={(event) => update('category', event.target.value)}
            >
              <option value="">Select category</option>
              {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
            <Select label="Job type" value={form.jobType} onChange={(event) => update('jobType', event.target.value)}>
              {(meta?.jobTypes || JOB_TYPES).map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
            <Select label="Work mode" value={form.workMode} onChange={(event) => update('workMode', event.target.value)}>
              {(meta?.workModes || WORK_MODES).map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
            <Input
              label="Number of vacancies"
              type="number"
              min="1"
              max="1000000"
              value={form.vacancies}
              onChange={(event) => update('vacancies', event.target.value)}
            />
            <Input
              label="Application deadline"
              type="date"
              required
              value={form.applicationDeadline}
              error={errors.applicationDeadline}
              min={toDateInput(new Date())}
              onChange={(event) => update('applicationDeadline', event.target.value)}
              className="sm:col-span-2 sm:max-w-xs"
            />
          </div>
        </div>

        <div className="card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand" />
            <h2 className="text-base font-bold text-ink">Description and requirements</h2>
          </div>
          <div className="mt-4 space-y-4">
            <Textarea
              label="Job description"
              required
              rows={6}
              value={form.description}
              error={errors.description}
              onChange={(event) => update('description', event.target.value)}
              placeholder="Describe the role, responsibilities and what you are looking for."
              maxLength={12000}
            />
            <Textarea
              label="Responsibilities"
              rows={4}
              value={form.responsibilities}
              onChange={(event) => update('responsibilities', event.target.value)}
              placeholder="One responsibility per line"
              help="Enter each responsibility on a new line or separate with commas."
            />
            <Input
              label="Skills"
              value={form.skills}
              onChange={(event) => update('skills', event.target.value)}
              placeholder="e.g. JavaScript, React, Communication"
              help="Separate skills with commas."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Qualification" value={form.qualification} onChange={(event) => update('qualification', event.target.value)}>
                <option value="">Select qualification</option>
                {qualifications.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </Select>
              <Select label="Experience" value={form.experience} onChange={(event) => update('experience', event.target.value)}>
                <option value="">Select experience</option>
                {experienceLevels.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </Select>
              <Input
                label="Minimum experience (years)"
                type="number"
                min="0"
                max="60"
                value={form.experienceMin}
                onChange={(event) => update('experienceMin', event.target.value)}
                placeholder="e.g. 2"
              />
            </div>
          </div>
        </div>

        <div className="card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-brand" />
            <h2 className="text-base font-bold text-ink">Salary</h2>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Minimum salary (₹)"
              type="number"
              min="0"
              value={form.salaryMin}
              onChange={(event) => update('salaryMin', event.target.value)}
              placeholder="e.g. 25000"
            />
            <Input
              label="Maximum salary (₹)"
              type="number"
              min="0"
              value={form.salaryMax}
              error={errors.salaryMax}
              onChange={(event) => update('salaryMax', event.target.value)}
              placeholder="e.g. 40000"
            />
            <Select label="Salary period" value={form.salaryPeriod} onChange={(event) => update('salaryPeriod', event.target.value)}>
              <option value="month">Per month</option>
              <option value="year">Per year</option>
            </Select>
            <Input
              label="Salary display text (optional)"
              value={form.salaryText}
              onChange={(event) => update('salaryText', event.target.value)}
              placeholder="e.g. ₹25,000 - ₹40,000 per month"
              help="Overrides the minimum and maximum salary display."
            />
          </div>
        </div>

        <div className="card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-brand" />
            <h2 className="text-base font-bold text-ink">Job location</h2>
          </div>
          <div className="mt-4">
            <LocationSelect
              state={form.state}
              district={form.district}
              city={form.city}
              onChange={(values) => setForm((current) => ({ ...current, ...values }))}
            />
            <div className="mt-4 sm:max-w-xs">
              <Input
                label="Pincode (optional)"
                value={form.pincode}
                onChange={(event) => update('pincode', event.target.value.replace(/\D/g, ''))}
                placeholder="6 digit pincode"
                maxLength={6}
                inputMode="numeric"
              />
            </div>
          </div>
        </div>

        {government && (
          <div className="card p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand" />
              <h2 className="text-base font-bold text-ink">Government vacancy details</h2>
            </div>
            <p className="mt-1 text-xs text-muted">
              Only publish vacancies from official government notifications. Do not create speculative or unverified listings.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input
                label="Recruiting organization"
                required
                value={form.government.organization}
                error={errors.organization}
                onChange={(event) => updateGovernment('organization', event.target.value)}
                placeholder="e.g. Staff Selection Commission"
              />
              <Input
                label="Department"
                value={form.government.department}
                onChange={(event) => updateGovernment('department', event.target.value)}
                placeholder="e.g. Ministry of Finance"
              />
              <Input
                label="Notification number"
                value={form.government.notificationNumber}
                onChange={(event) => updateGovernment('notificationNumber', event.target.value)}
                placeholder="e.g. SSC/2026/01"
              />
              <Input
                label="Post name"
                value={form.government.postName}
                onChange={(event) => updateGovernment('postName', event.target.value)}
                placeholder="Official post name"
              />
              <Input
                label="Official application website"
                required
                value={form.government.officialWebsite}
                error={errors.officialWebsite}
                onChange={(event) => updateGovernment('officialWebsite', event.target.value)}
                placeholder="https://official-recruitment-site.gov.in"
                help="Candidates are redirected here to apply."
                className="sm:col-span-2"
              />
              <Input
                label="Pay scale"
                value={form.government.payScale}
                onChange={(event) => updateGovernment('payScale', event.target.value)}
                placeholder="e.g. ₹35,400 - ₹1,12,400"
              />
              <Input
                label="Age limit"
                value={form.government.ageLimit}
                onChange={(event) => updateGovernment('ageLimit', event.target.value)}
                placeholder="e.g. 18 - 30 years"
              />
              <Input
                label="Application fee"
                value={form.government.applicationFee}
                onChange={(event) => updateGovernment('applicationFee', event.target.value)}
                placeholder="e.g. ₹100 (exemptions apply)"
              />
              <Input
                label="Application start date"
                type="date"
                value={form.government.applicationStartDate}
                onChange={(event) => updateGovernment('applicationStartDate', event.target.value)}
              />
              <Input
                label="Exam date (if announced)"
                type="date"
                value={form.government.examDate}
                onChange={(event) => updateGovernment('examDate', event.target.value)}
              />
              <Textarea
                label="Eligibility"
                rows={3}
                value={form.government.eligibility}
                onChange={(event) => updateGovernment('eligibility', event.target.value)}
                placeholder="Educational qualification, age relaxation and other eligibility conditions."
                className="sm:col-span-2"
              />
              <Textarea
                label="Selection process"
                rows={3}
                value={form.government.selectionProcess}
                onChange={(event) => updateGovernment('selectionProcess', event.target.value)}
                placeholder="Written exam, interview, document verification, etc."
                className="sm:col-span-2"
              />
            </div>

            <div className="mt-5 rounded-lg border border-line bg-slate-50/60 p-4">
              <p className="label">Official notification PDF</p>
              {existingPdf && !notificationFile && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-brand" />
                  <a href={assetUrl(existingPdf)} target="_blank" rel="noreferrer" className="font-semibold text-brand hover:underline">
                    View current notification PDF
                  </a>
                  <span className="text-xs text-muted">Upload a new PDF to replace it.</span>
                </div>
              )}
              {notificationFile ? (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-line bg-white p-2.5">
                  <FileText className="h-4 w-4 shrink-0 text-brand" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{notificationFile.name}</span>
                  <span className="text-xs text-muted">{fileSize(notificationFile.size)}</span>
                  <button type="button" className="btn-icon h-7 w-7" onClick={clearPdf} aria-label="Remove PDF">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="mt-2">
                  <button type="button" className="btn-outline btn-sm" onClick={() => pdfInputRef.current?.click()}>
                    <Upload className="h-4 w-4" />
                    Upload notification PDF
                  </button>
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="sr-only"
                    onChange={handlePdf}
                  />
                  <p className="mt-1 text-[11px] text-muted">PDF only • maximum 5MB</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-brand" />
            <h2 className="text-base font-bold text-ink">{government ? 'Organization branding' : 'Company branding'}</h2>
          </div>
          <div className="mt-4 space-y-4">
            {isAdmin && !government && (
              <Input
                label="Company name"
                required
                value={form.companyName}
                error={errors.companyName}
                onChange={(event) => update('companyName', event.target.value)}
                placeholder="Company name shown on the listing"
              />
            )}

            <div>
              <p className="label">Job listing logo</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-line bg-slate-50">
                  {logoPreview || existingLogo ? (
                    <img src={logoPreview || assetUrl(existingLogo)} alt="Job logo preview" className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="h-6 w-6 text-slate-300" />
                  )}
                </span>
                <div>
                  <button type="button" className="btn-outline btn-sm" onClick={() => logoInputRef.current?.click()}>
                    <Upload className="h-4 w-4" />
                    {logoPreview || existingLogo ? 'Change logo' : 'Upload logo'}
                  </button>
                  {logoFile && (
                    <button type="button" className="btn-ghost btn-sm ml-2 text-red-600 hover:bg-red-50" onClick={clearLogo}>
                      Remove
                    </button>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={handleLogo}
                  />
                  <p className="mt-1 text-[11px] text-muted">JPG, PNG, WEBP or GIF • maximum 2MB</p>
                </div>
              </div>
              {!isAdmin && (
                <p className="mt-2 text-xs text-muted">If you do not upload a logo, your company profile logo is used automatically.</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">
            {editing ? 'Editing this job will require admin approval again.' : 'Review all details before submitting.'}
          </p>
          <div className="flex gap-2">
            <Link to={isAdmin ? '/admin/jobs' : '/employer/jobs'} className="btn-outline">
              Cancel
            </Link>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving...' : editing ? 'Update job' : isAdmin ? 'Publish job' : 'Submit for approval'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
