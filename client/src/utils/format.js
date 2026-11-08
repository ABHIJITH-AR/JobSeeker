export function formatDate(value, options = {}) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...options });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(value) {
  if (!value) return '';
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function formatNumber(value) {
  if (value === null || value === undefined || value === '') return '0';
  return new Intl.NumberFormat('en-IN').format(value);
}

export function formatSalary(job) {
  if (!job) return 'Not disclosed';
  if (job.salaryText) return job.salaryText;
  const period = job.salaryPeriod === 'year' ? 'year' : 'month';
  if (job.salaryMin && job.salaryMax) {
    return `₹${formatNumber(job.salaryMin)} - ₹${formatNumber(job.salaryMax)} / ${period}`;
  }
  if (job.salaryMin) return `From ₹${formatNumber(job.salaryMin)} / ${period}`;
  if (job.salaryMax) return `Up to ₹${formatNumber(job.salaryMax)} / ${period}`;
  if (job.government && job.government.payScale) return job.government.payScale;
  return 'Not disclosed';
}

export function formatLocation(location) {
  if (!location) return 'India';
  const parts = [location.city, location.district, location.state].filter(Boolean);
  return parts.length ? parts.join(', ') : 'India';
}

export function daysLeft(deadline) {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function deadlineLabel(deadline) {
  const days = daysLeft(deadline);
  if (days === null) return '';
  if (days < 0) return 'Expired';
  if (days === 0) return 'Closes today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

export function isExpired(deadline) {
  const days = daysLeft(deadline);
  return days !== null && days < 0;
}

export function statusBadgeClass(status) {
  switch (status) {
    case 'Submitted':
      return 'badge-blue';
    case 'Under Review':
      return 'badge-amber';
    case 'Shortlisted':
      return 'badge-green';
    case 'Rejected':
      return 'badge-red';
    case 'Hired':
      return 'badge-navy';
    case 'approved':
      return 'badge-green';
    case 'pending':
      return 'badge-amber';
    case 'rejected':
      return 'badge-red';
    case 'closed':
      return 'badge-slate';
    default:
      return 'badge-slate';
  }
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function fileSize(bytes) {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function roleLabel(role) {
  if (role === 'jobseeker') return 'Job Seeker';
  if (role === 'employer') return 'Employer';
  if (role === 'admin') return 'Administrator';
  return role;
}

export function dashboardPath(role) {
  if (role === 'employer') return '/employer';
  if (role === 'admin') return '/admin';
  return '/dashboard';
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}
