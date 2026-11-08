import { useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  Bell,
  Bookmark,
  Briefcase,
  Building2,
  ClipboardList,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  PlusCircle,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import Logo from '../components/Logo';
import NotificationBell from '../components/NotificationBell';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { initials, roleLabel } from '../utils/format';

const NAVIGATION = {
  jobseeker: [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, end: true },
    { label: 'My Profile', to: '/dashboard/profile', icon: UserRound },
    { label: 'Resume', to: '/dashboard/resume', icon: FileText },
    { label: 'My Applications', to: '/dashboard/applications', icon: ClipboardList },
    { label: 'Saved Jobs', to: '/dashboard/saved-jobs', icon: Bookmark },
    { label: 'Notifications', to: '/dashboard/notifications', icon: Bell },
    { label: 'Settings', to: '/dashboard/settings', icon: Settings },
  ],
  employer: [
    { label: 'Dashboard', to: '/employer', icon: LayoutDashboard, end: true },
    { label: 'Company Profile', to: '/employer/profile', icon: Building2 },
    { label: 'Post a Job', to: '/employer/post-job', icon: PlusCircle },
    { label: 'Manage Jobs', to: '/employer/jobs', icon: Briefcase },
    { label: 'Applicants', to: '/employer/applicants', icon: Users },
    { label: 'Notifications', to: '/employer/notifications', icon: Bell },
    { label: 'Settings', to: '/employer/settings', icon: Settings },
  ],
  admin: [
    { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Manage Users', to: '/admin/users', icon: Users },
    { label: 'Manage Employers', to: '/admin/employers', icon: Building2 },
    { label: 'Manage Jobs', to: '/admin/jobs', icon: Briefcase },
    { label: 'Post Government Job', to: '/admin/post-job', icon: PlusCircle },
    { label: 'Pending Approvals', to: '/admin/pending-approvals', icon: ShieldCheck },
    { label: 'Government Verification', to: '/admin/government-verification', icon: BadgeCheck },
    { label: 'Applications', to: '/admin/applications', icon: ClipboardList },
    { label: 'Messages', to: '/admin/messages', icon: MessageSquare },
    { label: 'Notifications', to: '/admin/notifications', icon: Bell },
    { label: 'Settings', to: '/admin/settings', icon: Settings },
  ],
};

const profilePath = (role) => {
  if (role === 'employer') return '/employer/profile';
  if (role === 'admin') return '/admin/settings';
  return '/dashboard/profile';
};

export default function DashboardLayout({ role = 'jobseeker' }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const items = NAVIGATION[role] || NAVIGATION.jobseeker;

  const title = useMemo(() => {
    const match = [...items]
      .sort((a, b) => b.to.length - a.to.length)
      .find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`));
    return match?.label || 'Dashboard';
  }, [items, location.pathname]);

  const handleLogout = async () => {
    await logout();
    toast.info('You have been logged out.');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {open && (
        <div
          className="fixed inset-0 z-40 bg-navy/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-navy text-white transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <Logo variant="light" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="shrink-0 border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
              {initials(user?.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="text-xs text-slate-300">{roleLabel(role)}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="shrink-0 space-y-1 border-t border-white/10 p-3">
          <Link to="/" className="sidebar-link">
            <Home className="h-4 w-4 shrink-0" />
            <span>Back to website</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="sidebar-link w-full text-red-200 hover:bg-red-500/20 hover:text-white"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line text-ink hover:bg-skysoft lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                {roleLabel(role)} Dashboard
              </p>
              <h1 className="truncate text-base font-bold text-ink sm:text-lg">{title}</h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <NotificationBell />
            <Link
              to={profilePath(role)}
              className="hidden items-center gap-2 rounded-lg border border-line px-2.5 py-1.5 transition hover:bg-skysoft sm:flex"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
                {initials(user?.name)}
              </span>
              <span className="max-w-[120px] truncate text-sm font-semibold text-ink">{user?.name}</span>
            </Link>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
