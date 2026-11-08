import { useEffect, useRef, useState } from 'react';
import {
  BadgeCheck,
  Building2,
  Camera,
  Globe2,
  Loader2,
  MapPin,
  Save,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import Avatar from '../../components/Avatar';
import LocationSelect from '../../components/LocationSelect';
import { Input, Select, Textarea } from '../../components/FormField';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { employerApi } from '../../services';
import { getErrorMessage } from '../../services/api';
import { formatDateTime } from '../../utils/format';

const INDUSTRIES = [
  'Information Technology',
  'Software and Internet',
  'Banking and Financial Services',
  'Healthcare and Hospitals',
  'Education and Training',
  'Manufacturing',
  'Retail and E-commerce',
  'Construction and Real Estate',
  'Logistics and Transport',
  'Hospitality and Tourism',
  'Media and Entertainment',
  'Telecommunications',
  'Energy and Utilities',
  'Consulting and Professional Services',
  'Government and Public Sector',
  'Other',
];

const COMPANY_SIZES = ['1-10 employees', '11-50 employees', '51-200 employees', '201-500 employees', '501-1000 employees', '1000+ employees'];

const emptyForm = {
  companyName: '',
  companyEmail: '',
  contactNumber: '',
  website: '',
  industry: '',
  companySize: '',
  foundedYear: '',
  address: '',
  state: '',
  district: '',
  city: '',
  description: '',
};

export default function CompanyProfile() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [logoFile, setLogoFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let active = true;
    employerApi
      .getProfile()
      .then((response) => {
        if (!active) return;
        const data = response.data.profile || {};
        setProfile(data);
        setForm({
          companyName: data.companyName || '',
          companyEmail: data.companyEmail || '',
          contactNumber: data.contactNumber || '',
          website: data.website || '',
          industry: data.industry || '',
          companySize: data.companySize || '',
          foundedYear: data.foundedYear ? String(data.foundedYear) : '',
          address: data.address || '',
          state: data.state || '',
          district: data.district || '',
          city: data.city || '',
          description: data.description || '',
        });
      })
      .catch((err) => toast.error(getErrorMessage(err, 'Unable to load your company profile.')))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
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
    if (preview) URL.revokeObjectURL(preview);
    setLogoFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!form.companyName.trim()) next.companyName = 'Company name is required.';
    if (form.companyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.companyEmail)) {
      next.companyEmail = 'Enter a valid company email address.';
    }
    if (form.website && !/^https?:\/\/.+/i.test(form.website.trim())) {
      next.website = 'Website must start with http:// or https://';
    }
    if (form.contactNumber && !/^[0-9+\-\s()]{6,20}$/.test(form.contactNumber)) {
      next.contactNumber = 'Enter a valid contact number.';
    }
    if (form.foundedYear && (Number(form.foundedYear) < 1800 || Number(form.foundedYear) > new Date().getFullYear())) {
      next.foundedYear = 'Enter a valid year.';
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const payload = {
        ...form,
        companyName: form.companyName.trim(),
        website: form.website.trim(),
        foundedYear: form.foundedYear || null,
      };

      let response;
      if (logoFile) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== null && value !== undefined) formData.append(key, value);
        });
        formData.append('logo', logoFile);
        response = await employerApi.updateProfile(formData, true);
      } else {
        response = await employerApi.updateProfile(payload);
      }

      setProfile(response.data.profile);
      updateUser((current) => ({ ...current, profile: { ...(current.profile || {}), ...response.data.profile } }));
      setLogoFile(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview('');
      if (fileRef.current) fileRef.current.value = '';
      toast.success('Company profile updated successfully.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update your company profile.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading company profile..." />;

  const verified = Boolean(profile?.isVerified);

  return (
    <div className="space-y-6">
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <Avatar
              name={form.companyName || user?.name}
              src={preview || profile?.logo}
              size="xl"
              rounded="lg"
            />
            <label
              htmlFor="company-logo"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-brand text-white shadow-card transition hover:bg-brandDark"
              title="Upload company logo"
            >
              <Camera className="h-4 w-4" />
              <input
                ref={fileRef}
                id="company-logo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={handleLogo}
              />
            </label>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-ink">{form.companyName || 'Your company'}</h2>
              {verified ? (
                <span className="badge-green">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified employer
                </span>
              ) : (
                <span className="badge-amber">Verification pending</span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted">
              {[form.industry, form.city, form.state].filter(Boolean).join(' • ') || 'Add your company details to build trust with candidates.'}
            </p>
            {logoFile && <p className="mt-1 text-xs font-semibold text-brand">New logo selected: {logoFile.name}</p>}
          </div>
          <div className="shrink-0 text-xs leading-5 text-muted">
            <p>JPG, PNG, WEBP or GIF</p>
            <p>Maximum 2MB</p>
          </div>
        </div>
      </div>

      <div className={`flex items-start gap-3 rounded-xl border p-4 ${verified ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
        {verified ? (
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        ) : (
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        )}
        <div>
          <p className={`text-sm font-semibold ${verified ? 'text-emerald-900' : 'text-amber-900'}`}>
            {verified ? 'Your company is verified' : 'Your company is awaiting verification'}
          </p>
          <p className={`mt-0.5 text-xs leading-5 ${verified ? 'text-emerald-800' : 'text-amber-800'}`}>
            {verified
              ? `Verified on ${formatDateTime(profile?.verifiedAt)}. Verified employers display a trust badge on their job listings.`
              : 'Our team reviews completed company profiles. Make sure your company name, website and contact details are accurate.'}
          </p>
          {profile?.verificationNotes && (
            <p className="mt-1 text-xs italic text-slate-600">Admin notes: {profile.verificationNotes}</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-brand" />
            <h2 className="text-base font-bold text-ink">Company information</h2>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Company name"
              required
              value={form.companyName}
              error={errors.companyName}
              onChange={(event) => update('companyName', event.target.value)}
              placeholder="Registered company name"
            />
            <Input
              label="Company email"
              type="email"
              value={form.companyEmail}
              error={errors.companyEmail}
              onChange={(event) => update('companyEmail', event.target.value)}
              placeholder="hr@company.com"
            />
            <Input
              label="Contact number"
              value={form.contactNumber}
              error={errors.contactNumber}
              onChange={(event) => update('contactNumber', event.target.value)}
              placeholder="Office or HR contact number"
            />
            <Input
              label="Website"
              value={form.website}
              error={errors.website}
              onChange={(event) => update('website', event.target.value)}
              placeholder="https://www.company.com"
              help="Include https:// in the website address."
            />
            <Select label="Industry" value={form.industry} onChange={(event) => update('industry', event.target.value)}>
              <option value="">Select industry</option>
              {INDUSTRIES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
            <Select label="Company size" value={form.companySize} onChange={(event) => update('companySize', event.target.value)}>
              <option value="">Select company size</option>
              {COMPANY_SIZES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
            <Input
              label="Founded year"
              type="number"
              min="1800"
              max={new Date().getFullYear()}
              value={form.foundedYear}
              error={errors.foundedYear}
              onChange={(event) => update('foundedYear', event.target.value)}
              placeholder="e.g. 2015"
            />
            <Input
              label="Address"
              value={form.address}
              onChange={(event) => update('address', event.target.value)}
              placeholder="Office address"
              maxLength={300}
            />
          </div>
        </div>

        <div className="card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-brand" />
            <h2 className="text-base font-bold text-ink">Company location</h2>
          </div>
          <div className="mt-4">
            <LocationSelect
              state={form.state}
              district={form.district}
              city={form.city}
              onChange={(values) => setForm((current) => ({ ...current, ...values }))}
            />
          </div>
        </div>

        <div className="card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-brand" />
            <h2 className="text-base font-bold text-ink">About your company</h2>
          </div>
          <div className="mt-4">
            <Textarea
              label="Company description"
              rows={5}
              value={form.description}
              onChange={(event) => update('description', event.target.value)}
              placeholder="Tell candidates about your company, culture and what you do."
              maxLength={3000}
            />
            <p className="help-text">{form.description.length}/3000 characters</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button type="button" className="btn-outline" onClick={() => window.location.reload()}>
            Reset
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save company profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
