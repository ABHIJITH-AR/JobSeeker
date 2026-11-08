import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import Logo from '../components/Logo';
import { Field, Input } from '../components/FormField';
import useLocations from '../hooks/useLocations';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { dashboardPath } from '../utils/format';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  companyName: '',
  companyEmail: '',
  contactNumber: '',
  website: '',
  state: '',
  city: '',
};

export default function Register() {
  const { user, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { states, citiesFor, loading: locationsLoading } = useLocations();
  const [role, setRole] = useState('jobseeker');
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={dashboardPath(user.role)} replace />;

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
    setFormError('');
  };

  const switchRole = (nextRole) => {
    setRole(nextRole);
    setErrors({});
    setFormError('');
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim() || form.name.trim().length < 2) next.name = 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Please enter a valid email address.';
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) next.phone = 'Enter a valid 10 digit Indian mobile number.';
    if (role === 'employer' && !form.companyName.trim()) next.companyName = 'Company name is required.';
    if (form.website.trim() && !/^https?:\/\/.+/i.test(form.website.trim())) next.website = 'Website must start with http:// or https://';
    if (form.password.length < 8) next.password = 'Password must be at least 8 characters.';
    else if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(form.password)) next.password = 'Use at least one letter and one number.';
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setFormError('');
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        role,
        state: form.state,
        city: form.city,
      };
      if (role === 'employer') {
        payload.companyName = form.companyName.trim();
        payload.companyEmail = form.companyEmail.trim() || form.email.trim();
        payload.contactNumber = form.contactNumber.trim() || form.phone.trim();
        payload.website = form.website.trim();
      }
      const created = await register(payload);
      toast.success('Account created successfully. Welcome to JobSeeker!');
      navigate(dashboardPath(created.role), { replace: true });
    } catch (err) {
      setFormError(getErrorMessage(err, 'Unable to create your account. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const isEmployer = role === 'employer';
  const cities = form.state ? citiesFor(form.state) : [];

  return (
    <section className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-brand/30 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" aria-hidden="true" />
        <div className="relative">
          <Logo variant="light" />
          <h2 className="mt-12 max-w-md text-3xl font-extrabold leading-tight text-white">
            {isEmployer ? 'Find the right people for your team.' : 'Your next opportunity starts here.'}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-slate-200">
            {isEmployer
              ? 'Create a company profile, post jobs and review applicants from one simple dashboard.'
              : 'Create a free account to apply for private and government jobs anywhere in India.'}
          </p>
          <ul className="mt-8 space-y-3 text-sm text-slate-200">
            {(isEmployer
              ? [
                  'Post jobs and reach candidates across India',
                  'Every listing is reviewed before publishing',
                  'Review applicant profiles and resumes',
                  'Update application status and notify candidates',
                ]
              : [
                  'Search jobs by role, location and salary',
                  'Upload your resume once and apply quickly',
                  'Save jobs and track application status',
                  'Get notified when your application moves forward',
                ]
            ).map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative flex items-start gap-2.5 rounded-xl border border-white/15 bg-white/5 p-4 text-xs leading-5 text-slate-300">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
          JobSeeker is free for job seekers. We never charge for job applications or government job information.
        </div>
      </div>

      <div className="flex items-center justify-center bg-white px-4 py-12 sm:px-8">
        <div className="w-full max-w-lg">
          <div className="lg:hidden">
            <Logo variant="dark" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-ink lg:mt-0">Create your account</h1>
          <p className="mt-1.5 text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand hover:text-brandDark">Login</Link>
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl border border-line bg-slate-50 p-1.5">
            <button
              type="button"
              onClick={() => switchRole('jobseeker')}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                !isEmployer ? 'bg-white text-brand shadow-sm' : 'text-muted hover:text-ink'
              }`}
              aria-pressed={!isEmployer}
            >
              <UserRound className="h-4 w-4" />
              Job Seeker
            </button>
            <button
              type="button"
              onClick={() => switchRole('employer')}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                isEmployer ? 'bg-white text-brand shadow-sm' : 'text-muted hover:text-ink'
              }`}
              aria-pressed={isEmployer}
            >
              <Building2 className="h-4 w-4" />
              Employer
            </button>
          </div>

          {formError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Full name"
                required
                value={form.name}
                error={errors.name}
                onChange={(event) => update('name', event.target.value)}
                placeholder="Your full name"
                autoComplete="name"
              />
              <Input
                label="Email address"
                type="email"
                required
                value={form.email}
                error={errors.email}
                onChange={(event) => update('email', event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <Input
              label="Mobile number"
              required
              value={form.phone}
              error={errors.phone}
              onChange={(event) => update('phone', event.target.value.replace(/\D/g, ''))}
              placeholder="10 digit Indian mobile number"
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel"
            />

            {isEmployer && (
              <div className="space-y-4 rounded-xl border border-line bg-slate-50/60 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">Company details</p>
                <Input
                  label="Company name"
                  required
                  value={form.companyName}
                  error={errors.companyName}
                  onChange={(event) => update('companyName', event.target.value)}
                  placeholder="Your company name"
                  autoComplete="organization"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Company email"
                    type="email"
                    value={form.companyEmail}
                    onChange={(event) => update('companyEmail', event.target.value)}
                    placeholder="hr@company.com"
                    help="Defaults to your login email"
                  />
                  <Input
                    label="Contact number"
                    value={form.contactNumber}
                    onChange={(event) => update('contactNumber', event.target.value.replace(/\D/g, ''))}
                    placeholder="Company contact number"
                    maxLength={10}
                  />
                </div>
                <Input
                  label="Website"
                  value={form.website}
                  error={errors.website}
                  onChange={(event) => update('website', event.target.value)}
                  placeholder="https://company.com"
                />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="register-state">State / UT</label>
                <select
                  id="register-state"
                  className="input"
                  value={form.state}
                  onChange={(event) => {
                    update('state', event.target.value);
                    update('city', '');
                  }}
                  disabled={locationsLoading}
                >
                  <option value="">Select State / UT</option>
                  {states.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="register-city">City</label>
                <select
                  id="register-city"
                  className="input"
                  value={form.city}
                  onChange={(event) => update('city', event.target.value)}
                  disabled={!form.state}
                >
                  <option value="">Select City</option>
                  {cities.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Password"
                htmlFor="register-password"
                error={errors.password}
                help="At least 8 characters with a letter and a number."
                required
              >
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                    value={form.password}
                    onChange={(event) => update('password', event.target.value)}
                    placeholder="Create a password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted hover:text-ink"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              <Input
                label="Confirm password"
                type={showPassword ? 'text' : 'password'}
                required
                value={form.confirmPassword}
                error={errors.confirmPassword}
                onChange={(event) => update('confirmPassword', event.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
            </div>

            <p className="text-xs leading-5 text-muted">
              By creating an account you agree to provide accurate information and to use JobSeeker honestly. Job
              seekers should never pay for a job application.
            </p>

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? 'Creating account...' : isEmployer ? 'Create employer account' : 'Create job seeker account'}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-4 flex items-start gap-2 rounded-lg border border-line bg-skysoft/50 px-3 py-2.5 text-xs leading-5 text-muted">
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            Employer accounts can post jobs after completing the company profile. Every job is reviewed by our admin
            team before it goes live.
          </div>
        </div>
      </div>
    </section>
  );
}
