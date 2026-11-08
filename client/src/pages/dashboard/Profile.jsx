import { useEffect, useState } from 'react';
import { Camera, CheckCircle2, Loader2, Mail, Save, UserRound } from 'lucide-react';
import Avatar from '../../components/Avatar';
import LocationSelect from '../../components/LocationSelect';
import { Input, Select, Textarea } from '../../components/FormField';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { userApi } from '../../services';
import { getErrorMessage } from '../../services/api';
import { EXPERIENCE_LEVELS, QUALIFICATIONS } from '../../utils/constants';
import { toDateInput } from '../../utils/format';

const buildForm = (data = {}) => ({
  fullName: data.fullName || '',
  phone: data.phone || '',
  dateOfBirth: toDateInput(data.dateOfBirth),
  address: data.address || '',
  state: data.state || '',
  district: data.district || '',
  city: data.city || '',
  education: data.education || '',
  collegeName: data.collegeName || '',
  graduationYear: data.graduationYear ? String(data.graduationYear) : '',
  skills: (data.skills || []).join(', '),
  experience: data.experience || '',
  careerObjective: data.careerObjective || '',
});

export default function Profile() {
  const { user, refreshUser, updateUser } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let active = true;
    userApi
      .getProfile()
      .then((response) => {
        if (!active) return;
        const data = response.data.profile || {};
        setProfile(data);
        setForm(buildForm(data));
      })
      .catch((err) => toast.error(getErrorMessage(err, 'Unable to load your profile.')))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const handleReset = () => {
    setForm(buildForm(profile));
    setErrors({});
    toast.info('Unsaved changes were discarded.');
  };

  const handlePhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a JPG, PNG, WEBP or GIF image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Profile photo must be smaller than 2MB.');
      return;
    }
    const formData = new FormData();
    formData.append('photo', file);
    setPhotoUploading(true);
    try {
      const response = await userApi.uploadPhoto(formData);
      setProfile((current) => ({ ...current, profilePhoto: response.data.profilePhoto }));
      updateUser((current) => ({
        ...current,
        profile: { ...(current.profile || {}), profilePhoto: response.data.profilePhoto },
      }));
      toast.success('Profile photo updated.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not upload your photo.'));
    } finally {
      setPhotoUploading(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2) next.fullName = 'Please enter your full name.';
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone)) next.phone = 'Enter a valid 10 digit mobile number.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const payload = {
        ...form,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        skills: form.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
        dateOfBirth: form.dateOfBirth || null,
        graduationYear: form.graduationYear || null,
      };
      const response = await userApi.updateProfile(payload);
      setProfile(response.data.profile);
      setForm(buildForm(response.data.profile));
      updateUser((current) => ({
        ...current,
        name: response.data.profile.fullName || current.name,
        phone: response.data.profile.phone || current.phone,
        profile: { ...(current.profile || {}), ...response.data.profile },
      }));
      await refreshUser().catch(() => {});
      toast.success('Profile updated successfully.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update your profile.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return <LoadingSpinner label="Loading your profile..." />;
  }

  const completion = profile?.completion || 0;

  return (
    <div className="space-y-6">
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <Avatar name={form.fullName || user?.name} src={profile?.profilePhoto} size="xl" />
            <label
              htmlFor="profile-photo"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-brand text-white shadow-card transition hover:bg-brandDark"
              title="Upload profile photo"
            >
              {photoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              <input id="profile-photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={handlePhoto} disabled={photoUploading} />
            </label>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-ink">{form.fullName || user?.name}</h2>
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-muted">
              <Mail className="h-4 w-4" />
              {user?.email}
            </p>
            <div className="mt-3 max-w-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted">Profile completion</span>
                <span className="font-bold text-brand">{completion}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, completion)}%` }} />
              </div>
            </div>
          </div>
          <div className="shrink-0 text-xs leading-5 text-muted">
            <p className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Profile photo is optional
            </p>
            <p className="mt-1">JPG, PNG, WEBP or GIF • max 2MB</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-brand" />
            <h2 className="text-base font-bold text-ink">Personal details</h2>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Full name"
              required
              value={form.fullName}
              error={errors.fullName}
              onChange={(event) => update('fullName', event.target.value)}
              placeholder="Your full name"
            />
            <Input
              label="Mobile number"
              value={form.phone}
              error={errors.phone}
              onChange={(event) => update('phone', event.target.value.replace(/\D/g, ''))}
              placeholder="10 digit mobile number"
              maxLength={10}
              inputMode="numeric"
            />
            <Input
              label="Date of birth"
              type="date"
              value={form.dateOfBirth}
              onChange={(event) => update('dateOfBirth', event.target.value)}
              max={toDateInput(new Date())}
            />
            <Input
              label="Address"
              value={form.address}
              onChange={(event) => update('address', event.target.value)}
              placeholder="House / street / area"
              maxLength={300}
            />
          </div>
        </div>

        <div className="card p-5 sm:p-6">
          <h2 className="text-base font-bold text-ink">Location</h2>
          <p className="mt-1 text-xs text-muted">Used to show jobs near you.</p>
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
          <h2 className="text-base font-bold text-ink">Education</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Select label="Highest qualification" value={form.education} onChange={(event) => update('education', event.target.value)}>
              <option value="">Select qualification</option>
              {QUALIFICATIONS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
            <Input
              label="College / university"
              value={form.collegeName}
              onChange={(event) => update('collegeName', event.target.value)}
              placeholder="College or university name"
            />
            <Input
              label="Graduation year"
              type="number"
              min="1950"
              max="2100"
              value={form.graduationYear}
              onChange={(event) => update('graduationYear', event.target.value)}
              placeholder="e.g. 2025"
            />
            <Select label="Experience" value={form.experience} onChange={(event) => update('experience', event.target.value)}>
              <option value="">Select experience</option>
              {EXPERIENCE_LEVELS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="card p-5 sm:p-6">
          <h2 className="text-base font-bold text-ink">Skills and career objective</h2>
          <div className="mt-4 space-y-4">
            <Input
              label="Skills"
              value={form.skills}
              onChange={(event) => update('skills', event.target.value)}
              placeholder="e.g. JavaScript, React, SQL, Communication"
              help="Separate skills with commas."
            />
            <Textarea
              label="Career objective"
              rows={4}
              value={form.careerObjective}
              onChange={(event) => update('careerObjective', event.target.value)}
              placeholder="A short summary of your career goals and strengths."
              maxLength={1000}
            />
            <p className="help-text">{form.careerObjective.length}/1000 characters</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button type="button" className="btn-outline" onClick={handleReset}>
            Reset
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
