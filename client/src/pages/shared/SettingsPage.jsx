import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Briefcase,
  Building2,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Loader2,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import Avatar from '../../components/Avatar';
import { Input } from '../../components/FormField';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { userApi } from '../../services';
import { getErrorMessage } from '../../services/api';
import { formatDate, formatDateTime, roleLabel } from '../../utils/format';

const roleLinks = {
  jobseeker: [
    { to: '/dashboard/profile', label: 'Edit my profile', description: 'Update your personal, education and skill details.', icon: UserRound },
    { to: '/dashboard/resume', label: 'Manage resume', description: 'Upload, replace or download your resume.', icon: FileText },
  ],
  employer: [
    { to: '/employer/profile', label: 'Company profile', description: 'Update your company information and logo.', icon: Building2 },
    { to: '/employer/post-job', label: 'Post a job', description: 'Create a new private sector job listing.', icon: Briefcase },
  ],
  admin: [
    { to: '/admin/users', label: 'Manage users', description: 'View and manage job seeker and employer accounts.', icon: UserRound },
    { to: '/admin/government-verification', label: 'Government verification', description: 'Review government job verification requests.', icon: BadgeCheck },
  ],
};

const emptyPassword = { currentPassword: '', newPassword: '', confirmPassword: '' };

export default function SettingsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(emptyPassword);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [show, setShow] = useState({ current: false, next: false, confirm: false });

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!form.currentPassword) next.currentPassword = 'Enter your current password.';
    if (!form.newPassword) next.newPassword = 'Enter a new password.';
    else if (form.newPassword.length < 8) next.newPassword = 'Password must be at least 8 characters.';
    else if (!/[A-Za-z]/.test(form.newPassword) || !/\d/.test(form.newPassword)) {
      next.newPassword = 'Password must contain at least one letter and one number.';
    } else if (form.newPassword === form.currentPassword) {
      next.newPassword = 'New password must be different from the current password.';
    }
    if (form.confirmPassword !== form.newPassword) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await userApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm(emptyPassword);
      toast.success('Password changed successfully.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not change your password.'));
    } finally {
      setSaving(false);
    }
  };

  const links = roleLinks[user?.role] || roleLinks.jobseeker;

  return (
    <div className="space-y-6">
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar name={user?.name} src={user?.profile?.profilePhoto || user?.profile?.companyLogo} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-bold text-ink">{user?.name}</h2>
            <p className="truncate text-sm text-muted">{user?.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="badge-navy">{roleLabel(user?.role)}</span>
              {user?.isActive ? <span className="badge-green">Active account</span> : <span className="badge-red">Inactive</span>}
            </div>
          </div>
        </div>

        <dl className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Mobile</dt>
            <dd className="mt-1 text-sm font-semibold text-ink">{user?.phone || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Member since</dt>
            <dd className="mt-1 text-sm font-semibold text-ink">{formatDate(user?.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Last login</dt>
            <dd className="mt-1 text-sm font-semibold text-ink">{user?.lastLoginAt ? formatDateTime(user.lastLoginAt) : '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Account ID</dt>
            <dd className="mt-1 truncate text-xs font-medium text-muted">{user?.id || user?._id || '—'}</dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-brand" />
            <h2 className="text-base font-bold text-ink">Change password</h2>
          </div>
          <p className="mt-1 text-sm text-muted">Use at least 8 characters with one letter and one number.</p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="relative">
              <Input
                label="Current password"
                type={show.current ? 'text' : 'password'}
                value={form.currentPassword}
                error={errors.currentPassword}
                onChange={(event) => update('currentPassword', event.target.value)}
                placeholder="Enter current password"
                className="pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-2.5 top-[38px] text-muted hover:text-ink"
                onClick={() => setShow((current) => ({ ...current, current: !current.current }))}
                aria-label={show.current ? 'Hide current password' : 'Show current password'}
              >
                {show.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="New password"
                type={show.next ? 'text' : 'password'}
                value={form.newPassword}
                error={errors.newPassword}
                onChange={(event) => update('newPassword', event.target.value)}
                placeholder="Enter new password"
                className="pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute right-2.5 top-[38px] text-muted hover:text-ink"
                onClick={() => setShow((current) => ({ ...current, next: !current.next }))}
                aria-label={show.next ? 'Hide new password' : 'Show new password'}
              >
                {show.next ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm new password"
                type={show.confirm ? 'text' : 'password'}
                value={form.confirmPassword}
                error={errors.confirmPassword}
                onChange={(event) => update('confirmPassword', event.target.value)}
                placeholder="Re-enter new password"
                className="pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute right-2.5 top-[38px] text-muted hover:text-ink"
                onClick={() => setShow((current) => ({ ...current, confirm: !current.confirm }))}
                aria-label={show.confirm ? 'Hide confirm password' : 'Show confirm password'}
              >
                {show.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? 'Updating...' : 'Update password'}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="card p-5 sm:p-6">
            <h2 className="text-base font-bold text-ink">Quick links</h2>
            <div className="mt-3 space-y-2">
              {links.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-start gap-3 rounded-lg border border-line p-3 transition hover:border-brand/40 hover:bg-skysoft"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-skysoft text-brand">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-ink">{item.label}</span>
                      <span className="block text-xs text-muted">{item.description}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="card p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base font-bold text-ink">Account security</h2>
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>Keep your password private and never share it with anyone.</li>
              <li>Use a unique password that you do not use on other websites.</li>
              <li>Contact support if you notice any suspicious activity on your account.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
