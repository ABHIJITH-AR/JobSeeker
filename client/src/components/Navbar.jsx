import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, LogOut, Menu, Settings, UserRound, X } from 'lucide-react';
import Logo from '../components/Logo';
import NotificationBell from '../components/NotificationBell';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { dashboardPath, initials, roleLabel } from '../utils/format';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Find Jobs', to: '/jobs' },
  { label: 'Private Jobs', to: '/private-jobs' },
  { label: 'Government Jobs', to: '/government-jobs' },
  { label: 'Companies', to: '/companies' },
  { label: 'About Us', to: '/about' },
  { label: 'Contact Us', to: '/contact' },
];

const profilePath = (role) => {
  if (role === 'employer') return '/employer/profile';
  if (role === 'admin') return '/admin/settings';
  return '/dashboard/profile';
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    setMobileOpen(false);
    toast.info('You have been logged out.');
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    `rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors ${
      isActive ? 'bg-white/15 text-white' : 'text-slate-200 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-navy text-white shadow-md">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Logo variant="light" />

        <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 xl:flex">
          {user ? (
            <>
              <NotificationBell variant="light" />
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((value) => !value)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-white/10"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                    {initials(user.name)}
                  </span>
                  <span className="max-w-[120px] truncate font-medium">{user.name}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-white p-1.5 text-ink shadow-cardHover">
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                      <p className="text-xs text-muted">{roleLabel(user.role)}</p>
                    </div>
                    <div className="my-1 h-px bg-line" />
                    <Link
                      to={dashboardPath(user.role)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium hover:bg-skysoft"
                    >
                      <LayoutDashboard className="h-4 w-4 text-brand" />
                      Dashboard
                    </Link>
                    <Link
                      to={profilePath(user.role)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium hover:bg-skysoft"
                    >
                      <UserRound className="h-4 w-4 text-brand" />
                      {user.role === 'employer' ? 'Company Profile' : 'Profile'}
                    </Link>
                    <Link
                      to={user.role === 'admin' ? '/admin/settings' : `/${user.role === 'employer' ? 'employer' : 'dashboard'}/settings`}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium hover:bg-skysoft"
                    >
                      <Settings className="h-4 w-4 text-brand" />
                      Settings
                    </Link>
                    <div className="my-1 h-px bg-line" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
                Login
              </Link>
              <Link to="/register" className="btn-white btn-sm">
                Register
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white transition hover:bg-white/10 xl:hidden"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-navy xl:hidden">
          <div className="container-page space-y-1 py-4">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive ? 'bg-white/15 text-white' : 'text-slate-200 hover:bg-white/10'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            <div className="my-3 h-px bg-white/10" />

            {user ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                    {initials(user.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                    <p className="text-xs text-slate-300">{roleLabel(user.role)}</p>
                  </div>
                </div>
                <Link to={dashboardPath(user.role)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/10">
                  Dashboard
                </Link>
                <Link to={profilePath(user.role)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/10">
                  {user.role === 'employer' ? 'Company Profile' : 'Profile'}
                </Link>
                <Link
                  to={user.role === 'admin' ? '/admin/notifications' : `/${user.role === 'employer' ? 'employer' : 'dashboard'}/notifications`}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/10"
                >
                  Notifications
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-200 hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 px-1 pt-1">
                <Link to="/login" className="btn-outline w-full border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  Login
                </Link>
                <Link to="/register" className="btn-white w-full">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
