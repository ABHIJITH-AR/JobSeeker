import { Link } from 'react-router-dom';
import { BriefcaseBusiness, Building2, ShieldCheck } from 'lucide-react';

const PORTALS = {
  jobseeker: { Icon: BriefcaseBusiness, tag: null },
  employer: { Icon: Building2, tag: 'Employer' },
  admin: { Icon: ShieldCheck, tag: 'Admin' },
};

const SIZES = {
  sm: { box: 'h-8 w-8 rounded-lg', icon: 'h-4 w-4', text: 'text-lg', tag: 'text-[8px]' },
  md: { box: 'h-9 w-9 rounded-lg', icon: 'h-5 w-5', text: 'text-xl', tag: 'text-[9px]' },
  lg: { box: 'h-14 w-14 rounded-2xl', icon: 'h-7 w-7', text: 'text-3xl', tag: 'text-[11px]' },
};

export default function Logo({
  variant = 'light',
  portal = 'jobseeker',
  to = '/',
  compact = false,
  size = 'md',
  className = '',
}) {
  const light = variant === 'light';
  const { Icon, tag } = PORTALS[portal] || PORTALS.jobseeker;
  const sizing = SIZES[size] || SIZES.md;

  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2.5 ${className}`}
      aria-label={`JobSeeker ${tag ? `${tag} ` : ''}home`}
    >
      <span
        className={`flex shrink-0 items-center justify-center shadow-sm ${sizing.box} ${
          light ? 'bg-white text-navy' : 'bg-navy text-white'
        }`}
      >
        <Icon className={sizing.icon} strokeWidth={2.2} />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className={`font-extrabold tracking-tight ${sizing.text} ${light ? 'text-white' : 'text-navy'}`}>
            Job<span className={light ? 'text-sky-200' : 'text-brand'}>Seeker</span>
          </span>
          {tag && (
            <span
              className={`mt-1 font-bold uppercase tracking-[0.22em] ${sizing.tag} ${
                light ? 'text-sky-200' : 'text-brand'
              }`}
            >
              {tag} Portal
            </span>
          )}
        </span>
      )}
    </Link>
  );
}
