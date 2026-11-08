import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../services';

const paths = {
  jobseeker: '/dashboard/notifications',
  employer: '/employer/notifications',
  admin: '/admin/notifications',
};

export default function NotificationBell({ variant = 'dark', className = '' }) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return undefined;
    }
    let active = true;
    const load = () => {
      notificationApi
        .unreadCount()
        .then((response) => {
          if (active) setCount(response.data.unreadCount || 0);
        })
        .catch(() => {});
    };
    load();
    const interval = window.setInterval(load, 60000);
    const handleChange = () => load();
    window.addEventListener('jobseeker:notifications-changed', handleChange);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('jobseeker:notifications-changed', handleChange);
    };
  }, [user]);

  if (!user) return null;

  const base =
    variant === 'light'
      ? 'text-white hover:bg-white/10'
      : 'text-ink hover:bg-skysoft';

  return (
    <Link
      to={paths[user.role] || '/'}
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${base} ${className}`}
      aria-label={`Notifications${count ? `, ${count} unread` : ''}`}
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}
