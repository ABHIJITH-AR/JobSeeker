import { ChevronLeft, ChevronRight } from 'lucide-react';

function pageNumbers(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1);
  const set = new Set([1, pages, page, page - 1, page + 1]);
  const sorted = [...set].filter((value) => value >= 1 && value <= pages).sort((a, b) => a - b);
  const result = [];
  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) result.push('...');
    result.push(value);
  });
  return result;
}

export default function Pagination({ pagination, onPageChange, className = '' }) {
  if (!pagination || !pagination.pages || pagination.pages <= 1) return null;
  const { page, pages } = pagination;

  return (
    <nav className={`flex flex-wrap items-center justify-center gap-1.5 ${className}`} aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="btn-outline btn-sm"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {pageNumbers(page, pages).map((item, index) =>
        item === '...' ? (
          <span key={`ellipsis-${index}`} className="px-1.5 text-sm text-muted">
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-current={item === page ? 'page' : undefined}
            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold transition ${
              item === page ? 'bg-navy text-white' : 'border border-line bg-white text-ink hover:bg-skysoft'
            }`}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pages}
        className="btn-outline btn-sm"
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
