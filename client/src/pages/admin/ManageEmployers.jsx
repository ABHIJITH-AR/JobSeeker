import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Briefcase,
  Building2,
  Globe2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldOff,
  ShieldCheck,
} from 'lucide-react';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import { Select, Textarea } from '../../components/FormField';
import { useToast } from '../../context/ToastContext';
import { adminApi } from '../../services';
import { getErrorMessage } from '../../services/api';
import { formatDate, formatDateTime } from '../../utils/format';

export default function ManageEmployers() {
  const toast = useToast();
  const [employers, setEmployers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [verified, setVerified] = useState('');
  const [term, setTerm] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    adminApi
      .employers({ page, limit: 12, verified: verified || undefined, q: q || undefined })
      .then((response) => {
        if (!active) return;
        setEmployers(response.data.employers || []);
        setPagination(response.data.pagination || null);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Unable to load employers.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, verified, q, reloadKey]);

  const openAction = (profile, shouldVerify) => {
    setAction({ profile, verify: shouldVerify });
    setNotes(profile.verificationNotes || '');
  };

  const handleSubmit = async () => {
    if (!action) return;
    setSaving(true);
    try {
      const response = await adminApi.verifyEmployer(action.profile._id, {
        isVerified: action.verify,
        notes: notes.trim(),
      });
      setEmployers((current) =>
        current.map((item) => (item._id === action.profile._id ? { ...item, ...response.data.employer } : item))
      );
      toast.success(response.data.message || 'Employer updated.');
      setAction(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update employer verification.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setQ(term.trim());
  };

  const hasFilters = Boolean(verified || q);
  const clearFilters = () => {
    setTerm('');
    setQ('');
    setVerified('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-ink">Manage employers</h2>
        <p className="mt-1 text-sm text-muted">Review company profiles and grant verified employer badges.</p>
      </div>

      <div className="card p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="Verification" value={verified} onChange={(event) => { setVerified(event.target.value); setPage(1); }}>
            <option value="">All employers</option>
            <option value="true">Verified</option>
            <option value="false">Not verified</option>
          </Select>
          <form onSubmit={handleSearch} className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                className="input pl-10"
                placeholder="Search by company name"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                aria-label="Search employers"
              />
            </div>
            <button type="submit" className="btn-primary">Search</button>
            {hasFilters && <button type="button" className="btn-ghost" onClick={clearFilters}>Reset</button>}
          </form>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="card h-64 animate-pulse bg-slate-50" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={Building2}
          title="Could not load employers"
          description={error}
          action={<button type="button" className="btn-primary" onClick={() => setReloadKey((value) => value + 1)}>Try again</button>}
        />
      ) : employers.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No employers found"
          description={hasFilters ? 'Try different filters or a different search term.' : 'No employer profiles have been created yet.'}
          action={hasFilters ? <button type="button" className="btn-primary" onClick={clearFilters}>Clear filters</button> : undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {employers.map((profile) => (
            <div key={profile._id} className="card flex flex-col p-5">
              <div className="flex items-start gap-3">
                <Avatar name={profile.companyName} src={profile.logo} size="md" rounded="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="truncate text-base font-bold text-ink">{profile.companyName}</h3>
                    {profile.isVerified ? (
                      <span className="badge-green">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="badge-amber">Unverified</span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted">{profile.industry || 'Industry not added'}</p>
                  {profile.user?.isActive === false && <span className="badge-red mt-1">Account inactive</span>}
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-muted">
                <p className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-brand" />
                  {profile.companyEmail || profile.user?.email || '—'}
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-brand" />
                  {profile.contactNumber || profile.user?.phone || '—'}
                </p>
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-brand" />
                  {[profile.city, profile.state].filter(Boolean).join(', ') || 'Location not added'}
                </p>
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-brand hover:underline">
                    <Globe2 className="h-3.5 w-3.5" />
                    {profile.website}
                  </a>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs">
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <Briefcase className="h-3.5 w-3.5" />
                  {profile.totalJobs || 0} jobs
                </span>
                <span className="font-semibold text-ink">{profile.activeJobs || 0} active</span>
              </div>

              <p className="mt-2 text-[11px] text-muted">
                {profile.isVerified ? `Verified ${formatDateTime(profile.verifiedAt)}` : `Joined ${formatDate(profile.createdAt)}`}
              </p>
              {profile.verificationNotes && (
                <p className="mt-1 line-clamp-2 text-[11px] italic text-slate-500">Notes: {profile.verificationNotes}</p>
              )}

              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                {profile.isVerified ? (
                  <button type="button" className="btn-outline btn-sm text-red-600 hover:bg-red-50" onClick={() => openAction(profile, false)}>
                    <ShieldOff className="h-4 w-4" />
                    Remove verification
                  </button>
                ) : (
                  <button type="button" className="btn-primary btn-sm" onClick={() => openAction(profile, true)}>
                    <ShieldCheck className="h-4 w-4" />
                    Verify employer
                  </button>
                )}
                <Link
                  to={`/admin/jobs?q=${encodeURIComponent(profile.companyName)}`}
                  className="btn-ghost btn-sm"
                >
                  <Briefcase className="h-4 w-4" />
                  View jobs
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />

      <Modal
        open={Boolean(action)}
        onClose={() => setAction(null)}
        title={action?.verify ? 'Verify employer' : 'Remove verification'}
        description={
          action?.verify
            ? `Confirm that ${action?.profile?.companyName} is a genuine employer. Verified employers show a trust badge on their job listings.`
            : `Remove the verified badge from ${action?.profile?.companyName}.`
        }
        footer={
          <>
            <button type="button" className="btn-outline" onClick={() => setAction(null)} disabled={saving}>
              Cancel
            </button>
            <button
              type="button"
              className={action?.verify ? 'btn-primary' : 'btn-danger'}
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : action?.verify ? 'Verify employer' : 'Remove verification'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-line bg-slate-50/60 p-3 text-sm">
            <p className="font-semibold text-ink">{action?.profile?.companyName}</p>
            <p className="mt-0.5 text-xs text-muted">{action?.profile?.companyEmail || action?.profile?.user?.email}</p>
            <p className="mt-0.5 text-xs text-muted">
              {[action?.profile?.city, action?.profile?.state].filter(Boolean).join(', ') || 'Location not added'}
            </p>
          </div>
          <Textarea
            label="Verification notes (optional)"
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Add an internal note about this verification decision."
            maxLength={500}
          />
          <p className="help-text">{notes.length}/500 characters</p>
        </div>
      </Modal>
    </div>
  );
}
