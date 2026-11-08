import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Bell,
  Briefcase,
  Check,
  CheckCheck,
  Clock,
  FileCheck2,
  Loader2,
  PartyPopper,
  RefreshCw,
  Star,
  Trash2,
  XCircle,
} from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import { useToast } from '../../context/ToastContext';
import { notificationApi } from '../../services';
import { getErrorMessage } from '../../services/api';
import { timeAgo } from '../../utils/format';

const TYPE_META = {
  application_submitted: { icon: FileCheck2, className: 'bg-skysoft text-brand' },
  application_status: { icon: RefreshCw, className: 'bg-skysoft text-brand' },
  shortlisted: { icon: Star, className: 'bg-emerald-50 text-emerald-600' },
  rejected: { icon: XCircle, className: 'bg-red-50 text-red-600' },
  hired: { icon: PartyPopper, className: 'bg-emerald-50 text-emerald-600' },
  new_job: { icon: Briefcase, className: 'bg-skysoft text-brand' },
  deadline: { icon: Clock, className: 'bg-amber-50 text-amber-600' },
  job_approved: { icon: CheckCheck, className: 'bg-emerald-50 text-emerald-600' },
  job_rejected: { icon: XCircle, className: 'bg-red-50 text-red-600' },
  employer_verified: { icon: BadgeCheck, className: 'bg-emerald-50 text-emerald-600' },
  system: { icon: Bell, className: 'bg-slate-100 text-slate-600' },
};

export default function NotificationsPage() {
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState(null);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);
  const [busyId, setBusyId] = useState('');

  const notifyChange = () => window.dispatchEvent(new Event('jobseeker:notifications-changed'));

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    notificationApi
      .list({ page, limit: 20, unread: filter === 'unread' ? 'true' : undefined })
      .then((response) => {
        if (!active) return;
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
        setPagination(response.data.pagination || null);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Unable to load notifications.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, filter, reloadKey]);

  const handleMarkRead = async (notification) => {
    if (notification.isRead) return;
    setBusyId(notification._id);
    try {
      await notificationApi.markRead(notification._id);
      setNotifications((current) =>
        current.map((item) => (item._id === notification._id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((count) => Math.max(0, count - 1));
      notifyChange();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not mark notification as read.'));
    } finally {
      setBusyId('');
    }
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await notificationApi.markAllRead();
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
      notifyChange();
      toast.success('All notifications marked as read.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not mark notifications as read.'));
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (notification) => {
    setBusyId(notification._id);
    try {
      await notificationApi.remove(notification._id);
      setNotifications((current) => current.filter((item) => item._id !== notification._id));
      if (!notification.isRead) setUnreadCount((count) => Math.max(0, count - 1));
      notifyChange();
      toast.success('Notification deleted.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete notification.'));
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Notifications</h2>
          <p className="mt-1 text-sm text-muted">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}.` : 'You are all caught up.'}
          </p>
        </div>
        <button
          type="button"
          className="btn-outline btn-sm self-start"
          onClick={handleMarkAll}
          disabled={markingAll || unreadCount === 0}
        >
          {markingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
          Mark all as read
        </button>
      </div>

      <div className="flex gap-2">
        {[
          { key: 'all', label: 'All notifications' },
          { key: 'unread', label: `Unread${unreadCount ? ` (${unreadCount})` : ''}` },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              setFilter(item.key);
              setPage(1);
            }}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              filter === item.key ? 'bg-navy text-white' : 'border border-line bg-white text-ink hover:bg-skysoft'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="card h-24 animate-pulse bg-slate-50" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={Bell}
          title="Could not load notifications"
          description={error}
          action={
            <button type="button" className="btn-primary" onClick={() => setReloadKey((value) => value + 1)}>
              Try again
            </button>
          }
        />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          description={
            filter === 'unread'
              ? 'You have read all your notifications.'
              : 'Updates about your applications, jobs and account will appear here.'
          }
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const meta = TYPE_META[notification.type] || TYPE_META.system;
            const Icon = meta.icon;
            const body = (
              <>
                <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.className}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className={`text-sm ${notification.isRead ? 'font-semibold text-ink' : 'font-bold text-ink'}`}>
                      {notification.title}
                    </span>
                    {!notification.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">{notification.message}</span>
                  <span className="mt-1.5 block text-xs text-muted">{timeAgo(notification.createdAt)}</span>
                </span>
              </>
            );

            return (
              <div
                key={notification._id}
                className={`card flex items-start gap-3 p-4 transition ${notification.isRead ? '' : 'border-brand/30 bg-skysoft/40'}`}
              >
                {notification.link ? (
                  <Link
                    to={notification.link}
                    className="flex min-w-0 flex-1 items-start gap-3"
                    onClick={() => handleMarkRead(notification)}
                  >
                    {body}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    onClick={() => handleMarkRead(notification)}
                  >
                    {body}
                  </button>
                )}

                <div className="flex shrink-0 flex-col gap-1">
                  {!notification.isRead && (
                    <button
                      type="button"
                      className="btn-icon h-8 w-8"
                      title="Mark as read"
                      aria-label="Mark as read"
                      onClick={() => handleMarkRead(notification)}
                      disabled={busyId === notification._id}
                    >
                      {busyId === notification._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-icon h-8 w-8 text-red-500 hover:bg-red-50"
                    title="Delete notification"
                    aria-label="Delete notification"
                    onClick={() => handleDelete(notification)}
                    disabled={busyId === notification._id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
