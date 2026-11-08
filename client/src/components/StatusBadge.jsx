import { statusBadgeClass } from '../utils/format';

export default function StatusBadge({ status, className = '' }) {
  return <span className={`${statusBadgeClass(status)} ${className}`}>{status}</span>;
}
