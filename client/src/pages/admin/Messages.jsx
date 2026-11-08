import { useEffect, useMemo, useState } from 'react';
import {
  Mail,
  MailOpen,
  MessageSquare,
  Phone,
  Reply,
  Search,
  Trash2,
  UserRound,
} from 'lucide-react';
import Avatar from '../../components/Avatar';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import { useToast } from '../../context/ToastContext';
import { adminApi } from '../../services';
import { getErrorMessage } from '../../services/api';
import { formatDateTime, timeAgo } from '../../utils/format';

const FILTERS = [
  { value: '', label: 'All messages' },
  { value: 'false', label: 'Unread' },
  { value: 'true', label: 'Read' },
];

export default function Messages() {
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filter, setFilter] = useState('');
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [busyId, setBusyId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    adminApi
      .messages({ page, limit: 12, isRead: filter || undefined })
      .then((response) => {
        if (!active) return;
        setMessages(response.data.messages || []);
        setPagination(response.data.pagination || null);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Unable to load messages.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, filter, reloadKey]);

  const filtered = useMemo(() => {
    const query = term.trim().toLowerCase();
    if (!query) return messages;
    return messages.filter((message) =>
      [message.name, message.email, message.subject, message.message]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [messages, term]);

  const markRead = async (message, isRead) => {
    setBusyId(message._id);
    try {
      const response = await adminApi.updateMessage(message._id, isRead);
      const updated = response.data.data || { ...message, isRead };
      setMessages((current) => current.map((item) => (item._id === message._id ? { ...item, ...updated } : item)));
      if (selected && selected._id === message._id) setSelected((current) => ({ ...current, ...updated }));
      toast.success(isRead ? 'Marked as read.' : 'Marked as unread.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update the message.'));
    } finally {
      setBusyId('');
    }
  };

  const openMessage = (message) => {
    setSelected(message);
    if (!message.isRead) markRead(message, true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteMessage(deleteTarget._id);
      setMessages((current) => current.filter((item) => item._id !== deleteTarget._id));
      if (selected && selected._id === deleteTarget._id) setSelected(null);
      setDeleteTarget(null);
      setReloadKey((value) => value + 1);
      toast.success('Message deleted.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete the message.'));
    } finally {
      setDeleting(false);
    }
  };

  const replyHref = selected
    ? `mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject || 'Your message to JobSeeker'}`)}`
    : '#';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Messages</h2>
          <p className="mt-1 text-sm text-muted">Enquiries submitted through the public contact form.</p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            className="input pl-10"
            placeholder="Search this page"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            aria-label="Search messages on this page"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.value || 'all'}
            type="button"
            className={`btn-sm ${filter === item.value ? 'btn-navy' : 'btn-outline'}`}
            onClick={() => {
              setFilter(item.value);
              setPage(1);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="card h-32 animate-pulse bg-slate-50" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={MessageSquare}
          title="Could not load messages"
          description={error}
          action={<button type="button" className="btn-primary" onClick={() => setReloadKey((value) => value + 1)}>Try again</button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Mail}
          title={messages.length === 0 ? 'No messages yet' : 'No matching messages'}
          description={
            messages.length === 0
              ? 'Messages sent through the contact form will appear here.'
              : 'Try a different search term or filter.'
          }
          action={term ? <button type="button" className="btn-primary" onClick={() => setTerm('')}>Clear search</button> : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((message) => (
            <div
              key={message._id}
              className={`card p-4 transition hover:shadow-cardHover sm:p-5 ${message.isRead ? '' : 'border-l-4 border-l-brand'}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <button type="button" className="flex min-w-0 flex-1 items-start gap-3 text-left" onClick={() => openMessage(message)}>
                  <Avatar name={message.name} size="md" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`text-sm ${message.isRead ? 'font-semibold text-ink' : 'font-bold text-ink'}`}>{message.name}</p>
                      {!message.isRead && <span className="badge-blue">New</span>}
                    </div>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-brand" />
                        {message.email}
                      </span>
                      {message.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-brand" />
                          {message.phone}
                        </span>
                      )}
                      <span>{timeAgo(message.createdAt)}</span>
                    </p>
                    <p className="mt-1.5 text-sm font-semibold text-ink">{message.subject || 'General enquiry'}</p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">{message.message}</p>
                  </div>
                </button>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button type="button" className="btn-outline btn-sm" onClick={() => openMessage(message)}>
                    <MailOpen className="h-4 w-4" />
                    Open
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => markRead(message, !message.isRead)}
                    disabled={busyId === message._id}
                  >
                    {message.isRead ? 'Mark unread' : 'Mark read'}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
                    onClick={() => setDeleteTarget(message)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!term && <Pagination pagination={pagination} onPageChange={setPage} />}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.subject || 'Message'}
        description={selected ? `Received ${formatDateTime(selected.createdAt)}` : ''}
        size="lg"
        footer={
          <>
            <button type="button" className="btn-outline" onClick={() => setSelected(null)}>Close</button>
            {selected && (
              <>
                <button type="button" className="btn-ghost text-red-600 hover:bg-red-50" onClick={() => setDeleteTarget(selected)}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                <a href={replyHref} className="btn-primary">
                  <Reply className="h-4 w-4" />
                  Reply by email
                </a>
              </>
            )}
          </>
        }
      >
        {selected ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-line bg-slate-50/60 p-3">
              <Avatar name={selected.name} size="md" />
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-bold text-ink">
                  <UserRound className="h-4 w-4 text-brand" />
                  {selected.name}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-brand" />
                    {selected.email}
                  </span>
                  {selected.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-brand" />
                      {selected.phone}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-ink">Message</h4>
              <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">{selected.message}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => markRead(selected, !selected.isRead)}
                disabled={busyId === selected._id}
              >
                {selected.isRead ? 'Mark as unread' : 'Mark as read'}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete message?"
        message={`The message from "${deleteTarget?.name || 'this sender'}" will be permanently deleted.`}
        confirmLabel="Delete message"
        danger
        loading={deleting}
      />
    </div>
  );
}
