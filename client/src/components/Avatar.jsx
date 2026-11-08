import { assetUrl } from '../services/api';
import { initials } from '../utils/format';

const sizes = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-2xl',
};

export default function Avatar({ name = '', src = '', size = 'md', rounded = 'full', className = '' }) {
  const sizeClass = sizes[size] || sizes.md;
  const roundedClass = rounded === 'full' ? 'rounded-full' : 'rounded-lg';
  if (src) {
    return (
      <img
        src={assetUrl(src)}
        alt={name ? `${name} logo` : 'Company logo'}
        className={`${sizeClass} ${roundedClass} border border-line object-cover ${className}`}
        loading="lazy"
      />
    );
  }
  return (
    <span
      className={`${sizeClass} ${roundedClass} inline-flex items-center justify-center bg-navy font-bold text-white ${className}`}
      aria-hidden="true"
    >
      {initials(name) || 'JS'}
    </span>
  );
}
