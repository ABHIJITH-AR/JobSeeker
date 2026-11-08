import { Link } from 'react-router-dom';
import { BriefcaseBusiness } from 'lucide-react';

export default function Logo({ variant = 'light', to = '/', compact = false, className = '' }) {
  const light = variant === 'light';
  return (
    <Link to={to} className={`inline-flex items-center gap-2.5 ${className}`} aria-label="JobSeeker home">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm ${
          light ? 'bg-white text-navy' : 'bg-navy text-white'
        }`}
      >
        <BriefcaseBusiness className="h-5 w-5" strokeWidth={2.2} />
      </span>
      {!compact && (
        <span className={`text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-navy'}`}>
          Job<span className={light ? 'text-sky-200' : 'text-brand'}>Seeker</span>
        </span>
      )}
    </Link>
  );
}
