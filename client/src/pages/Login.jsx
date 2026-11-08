import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, CheckCircle2, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import Logo from '../components/Logo';
import { Field, Input } from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { dashboardPath } from '../utils/format';

export default function Login() {
  const { user, login } = useAuth();
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
      toast.success(`Welcome back, ${loggedIn.name.split(' ')[0]}!`);
      const from = location.state?.from;
      navigate(from || dashboardPath(loggedIn.role), { replace: true });
    } catch (err) {
      setFormError(getErrorMessage(err, 'Unable to log in. Please check your details.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-brand/30 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" aria-hidden="true" />
        <div className="relative">
          <Logo variant="light" />
          <h2 className="mt-12 max-w-md text-3xl font-extrabold leading-tight text-white">
            Welcome back to your job search.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-slate-200">
            Sign in to manage your profile, applications, saved jobs and notifications.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-slate-200">
            {[
              'Track every application in one place',
              'Save jobs and apply when you are ready',
              'Manage your resume and profile securely',
              'Employers can review applicants and update status',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative flex items-start gap-2.5 rounded-xl border border-white/15 bg-white/5 p-4 text-xs leading-5 text-slate-300">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
          Your account is protected with a securely hashed password and token-based authentication.
        </div>
      </div>

      <div className="flex items-center justify-center bg-white px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <Logo variant="dark" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-ink lg:mt-0">Login to your account</h1>
          <p className="mt-1.5 text-sm text-muted">
            New to JobSeeker?{' '}
            <Link to="/register" className="font-semibold text-brand hover:text-brandDark">Create an account</Link>
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

            <Field label="Password" htmlFor="login-password" error={errors.password} required>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="login-password"
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
              {submitting ? 'Signing in...' : 'Sign in'}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-5 flex items-center gap-2 rounded-lg border border-line bg-skysoft/50 px-3 py-2.5 text-xs leading-5 text-muted">
            <Mail className="h-4 w-4 shrink-0 text-brand" />
            Cannot access your account? <Link to="/contact" className="font-semibold text-brand">Contact support</Link>
          </div>

          <div className="mt-6 grid gap-2 text-center text-xs text-muted sm:grid-cols-2">
            <p className="rounded-lg border border-line p-3">
              <BadgeCheck className="mx-auto mb-1 h-4 w-4 text-brand" />
              Job seeker looking for work?
              <Link to="/register" state={location.state} className="mt-0.5 block font-semibold text-brand">Create a job seeker account</Link>
            </p>
            <p className="rounded-lg border border-line p-3">
              <ShieldCheck className="mx-auto mb-1 h-4 w-4 text-brand" />
              Employer hiring candidates?
              <Link to="/register" state={location.state} className="mt-0.5 block font-semibold text-brand">Create an employer account</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
