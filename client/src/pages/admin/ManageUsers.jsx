import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Building2, GraduationCap, Search, ShieldCheck, UserRound, Users } from 'lucide-react';
import Avatar from '../../components/Avatar';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import { Select } from '../../components/FormField';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { adminApi } from '../../services';
import { getErrorMessage } from '../../services/api';
import { formatDate, roleLabel } from '../../utils/format';

const ROLE_FILTERS = [
  { value: '', label: 'All roles' },
  { value: 'jobseeker', label: 'Job seekers' },
  { value: 'employer', label: 'Employers' },
  { value: 'admin', label: 'Admins' },
];

export default function ManageUsers() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState('');
  const [term, setTerm] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [target, setTarget] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    adminApi
      .users({ page, limit: 15, role: role || undefined, isActive: isActive || undefined, q: q || undefined })
      .then((response) => {
        if (!active) return;
        setUsers(response.data.users || []);
        setPagination(response.data.pagination || null);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Unable to load users.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, role, isActive, q, reloadKey]);

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setQ(term.trim());
  };

  const handleToggle = async () => {
    if (!target) return;
    setUpdating(true);
    try {
      const response = await adminApi.updateUserStatus(target._id, !target.isActive);
      setUsers((current) =>
        current.map((item) => (item._id === target._id ? { ...item, isActive: response.data.user.isActive } : item))
      );
      setTarget(null);
      toast.success(response.data.message || 'User updated.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update the user.'));
    } finally {
      setUpdating(false);
    }
  };

  const hasFilters = Boolean(role || isActive || q);
  const clearFilters = () => {
    setTerm('');
    setQ('');
    setRole('');
    setIsActive('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-ink">Manage users</h2>
        <p className="mt-1 text-sm text-muted">View all accounts and activate or deactivate access.</p>
      </div>

      <div className="card p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="Role" value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }}>
            {ROLE_FILTERS.map((item) => (
              <option key={item.value || 'all'} value={item.value}>{item.label}</option>
            ))}
          </Select>
          <Select label="Account status" value={isActive} onChange={(event) => { setIsActive(event.target.value); setPage(1); }}>
            <option value="">All accounts</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
          <form onSubmit={handleSearch} className="flex items-end gap-2 sm:col-span-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                className="input pl-10"
                placeholder="Search name, email or phone"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                aria-label="Search users"
              />
            </div>
            <button type="submit" className="btn-primary">Search</button>
            {hasFilters && <button type="button" className="btn-ghost" onClick={clearFilters}>Reset</button>}
          </form>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="card h-20 animate-pulse bg-slate-50" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={Users}
          title="Could not load users"
          description={error}
          action={<button type="button" className="btn-primary" onClick={() => setReloadKey((value) => value + 1)}>Try again</button>}
        />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description={hasFilters ? 'Try different filters or a different search term.' : 'There are no users on the platform yet.'}
          action={hasFilters ? <button type="button" className="btn-primary" onClick={clearFilters}>Clear filters</button> : undefined}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Profile</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((item, index) => {
                  const profile = item.profile;
                  const self = item._id === currentUser?.id || item._id === currentUser?._id;
                  return (
                    <tr key={item._id || item.email || `user-${index}`} className="align-top">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <Avatar name={item.name} src={profile?.logo} size="sm" />
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 font-semibold text-ink">
                              {item.name}
                              {item.role === 'employer' && profile?.isVerified && <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />}
                            </p>
                            <p className="truncate text-xs text-muted">{item.email}</p>
                            <p className="text-xs text-muted">{item.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={item.role === 'admin' ? 'badge-navy' : item.role === 'employer' ? 'badge-blue' : 'badge-slate'}>
                          {roleLabel(item.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.role === 'employer' ? (
                          <div className="text-xs text-slate-600">
                            <p className="flex items-center gap-1.5 font-medium text-ink">
                              <Building2 className="h-3.5 w-3.5 text-brand" />
                              {profile?.companyName || 'No company profile'}
                            </p>
                            <p className="mt-0.5">{[profile?.city, profile?.state].filter(Boolean).join(', ') || '—'}</p>
                          </div>
                        ) : item.role === 'jobseeker' ? (
                          <div className="text-xs text-slate-600">
                            <p className="flex items-center gap-1.5 font-medium text-ink">
                              <GraduationCap className="h-3.5 w-3.5 text-brand" />
                              {profile?.education || 'Education not added'}
                            </p>
                            <p className="mt-0.5">{[profile?.city, profile?.state].filter(Boolean).join(', ') || '—'}</p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                            <ShieldCheck className="h-3.5 w-3.5 text-brand" />
                            Platform administrator
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">{formatDate(item.createdAt)}</td>
                      <td className="px-4 py-3">
                        {item.isActive ? <span className="badge-green">Active</span> : <span className="badge-red">Inactive</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className={`btn-sm ${item.isActive ? 'btn-outline text-red-600 hover:bg-red-50' : 'btn-primary'}`}
                          onClick={() => setTarget(item)}
                          disabled={self}
                          title={self ? 'You cannot change your own account status' : undefined}
                        >
                          {item.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />

      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        onConfirm={handleToggle}
        title={target?.isActive ? 'Deactivate account?' : 'Activate account?'}
        message={
          target?.isActive
            ? `${target?.name} will no longer be able to log in or use JobSeeker until the account is reactivated.`
            : `${target?.name} will be able to log in and use JobSeeker again.`
        }
        confirmLabel={target?.isActive ? 'Deactivate' : 'Activate'}
        danger={Boolean(target?.isActive)}
        loading={updating}
      />
    </div>
  );
}
