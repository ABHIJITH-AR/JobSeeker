import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import Logo from './Logo';
import { Field, Input } from './FormField';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { dashboardPath } from '../utils/format';

const PORTALS = {
  admin: {
    label: 'Administrator',
    title: 'Administrator sign in',
    heading: 'Manage JobSeeker with confidence.',
    subtitle:
      'Sign in to review employers, approve job listings and keep every vacancy on the platform trusted.',
    panel: 'bg-navy',
    glowA: 'bg-brand/30',
    glowB: 'bg-sky-400/20',
    accent: 'text-sky-300',
    features: [
      'Approve or reject new job listings',
      'Verify official government vacancies',
      'Manage users, employers and messages',
      'Monitor applications across the platform',
    ],
    security: 'Admin access is restricted. Every action is tied to a verified administrator account.',
    submit: 'Sign in to admin portal',
    switchTo: 'employer',
    note: 'Admin accounts are provisioned by the platform team.',
    noteLink: { to: '/contact', label: 'Contact the platform team' },
  },
  employer: {
    label: 'Employer',
    title: 'Employer sign in',
    heading: 'Hire the right people, faster.',
    subtitle:
      'Sign in to post jobs, review applicants and track every listing from your hiring dashboard.',
    panel: 'bg-navyLight',
    glowA: 'bg-emerald-400/20',
    glowB: 'bg-sky-400/20',
    accent: 'text-emerald-300',
    features: [
      'Post jobs and reach candidates across India',
      'Review applicant profiles and resumes',
      'Update application status and notify candidates',
      'Track every listing in one place',
    ],
    security: 'Your company account is protected with a securely hashed password and token-based authentication.',
    submit: 'Sign in to employer portal',
    switchTo: 'admin',
    note: 'New to JobSeeker?',
    noteLink: { to: '/register', label: 'Create an employer account', state: { role: 'employer' } },
  },
};

export default function PortalLogin({ portal = 'admin' }) {
  const config = PORTALS[portal] || PORTALS.admin;
  const { user, login, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
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

  const validate = () => {
    const next = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Please enter a valid email address.';
    if (!form.password) next.password = 'Please enter your password.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setFormError('');
    try {
      const loggedIn = await login(form.email.trim(), form.password);
      if (loggedIn.role !== portal) {
        await logout();
        setFormError(
          `These credentials are not for the ${config.label.toLowerCase()} portal. Please use the correct sign-in page.`
        );
        return;
      }
      toast.success(`Welcome back, ${loggedIn.name.split(' ')[0]}!`);
      const from = location.state?.from;
      navigate(from || dashboardPath(loggedIn.role), { replace: true });
    } catch (err) {
      setFormError(getErrorMessage(err, 'Unable to log in. Please check your details.'));
    } finally {
      setSubmitting(false);
    }
  };

  const PortalIcon = portal === 'admin' ? ShieldCheck : Building2;
  const SwitchIcon = config.switchTo === 'admin' ? ShieldCheck : Building2;

  return (
    <section className="grid min-h-screen bg-white lg:grid-cols-2">
      <div
        className={`relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-between ${config.panel}`}
      >
        <div className={`absolute -left-20 -top-20 h-72 w-72 rounded-full blur-3xl ${config.glowA}`} aria-hidden="true" />
        <div className={`absolute -bottom-24 right-0 h-80 w-80 rounded-full blur-3xl ${config.glowB}`} aria-hidden="true" />

        <div className="relative">
          <Logo variant="light" portal={portal} size="lg" />
          <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider">
            <PortalIcon className={`h-4 w-4 ${config.accent}`} />
            {config.label} portal
          </div>
          <h2 className="mt-5 max-w-md text-3xl font-extrabold leading-tight text-white">{config.heading}</h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-slate-200">{config.subtitle}</p>
          <ul className="mt-8 space-y-3 text-sm text-slate-200">
            {config.features.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${config.accent}`} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mt-10 flex items-start gap-2.5 rounded-xl border border-white/15 bg-white/5 p-4 text-xs leading-5 text-slate-300">
          <ShieldCheck className={`mt-0.5 h-4 w-4 shrink-0 ${config.accent}`} />
          {config.security}
        </div>
      </div>

      <div className="flex flex-col bg-white">
        <div className="flex items-center justify-between px-4 py-5 sm:px-8">
          <Link to="/" className="text-xs font-semibold text-muted transition hover:text-brand">
            &larr; Back to website
          </Link>
          <span className="text-xs font-semibold text-muted">
            {config.label} access only
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-8">
          <div className="w-full max-w-md">
            <div className="lg:hidden">
              <Logo variant="dark" portal={portal} size="lg" />
            </div>
            <span className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-skysoft px-3 py-1 text-xs font-semibold text-brand lg:mt-0">
              <PortalIcon className="h-3.5 w-3.5" />
              {config.label} portal
            </span>
            <h1 className="mt-3 text-2xl font-bold text-ink">{config.title}</h1>
            <p className="mt-1.5 text-sm text-muted">
              Sign in with your {config.label.toLowerCase()} account to continue.
            </p>

            {formError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
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

              <Field label="Password" htmlFor="portal-password" error={errors.password} required>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    id="portal-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                    value={form.password}
                    onChange={(event) => update('password', event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
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

              <button type="submit" className="btn-primary w-full" disabled={submitting}>
                {submitting ? 'Signing in...' : config.submit}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <div className="mt-5 flex items-start gap-2 rounded-lg border border-line bg-skysoft/50 px-3 py-2.5 text-xs leading-5 text-muted">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>
                {config.note}{' '}
                <Link to={config.noteLink.to} state={config.noteLink.state} className="font-semibold text-brand hover:underline">
                  {config.noteLink.label}
                </Link>
              </span>
            </div>

            <div className="mt-6 flex flex-col gap-2 rounded-xl border border-line p-3 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-1.5">
                <SwitchIcon className="h-4 w-4 text-brand" />
                Looking for the {config.switchTo} portal?
              </span>
              <Link
                to={`/${config.switchTo}/login`}
                className="font-semibold text-brand hover:underline"
              >
                Go to {config.switchTo} sign in
              </Link>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-muted">
              <BadgeCheck className="h-4 w-4 text-brand" />
              <span>
                Job seeker instead?{' '}
                <Link to="/login" className="font-semibold text-brand hover:underline">
                  Use the main sign in
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
