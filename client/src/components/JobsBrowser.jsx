import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, SlidersHorizontal } from 'lucide-react';
import JobCard from './JobCard';
import FilterPanel from './FilterPanel';
import Pagination from './Pagination';
import EmptyState from './EmptyState';
import { JobCardSkeleton } from './LoadingSpinner';
import { getErrorMessage } from '../services/api';
import { jobApi } from '../services';

function parseFilters(searchParams, sector) {
  return {
    q: searchParams.get('q') || '',
    sector: sector !== 'all' ? sector : searchParams.get('sector') || '',
    category: searchParams.get('category') || '',
    state: searchParams.get('state') || '',
    district: searchParams.get('district') || '',
    city: searchParams.get('city') || '',
    qualification: searchParams.get('qualification') || '',
    experience: searchParams.get('experience') || '',
    jobType: searchParams.get('jobType') || '',
    workMode: searchParams.get('workMode') || '',
    remote: searchParams.get('remote') === 'true',
    minSalary: searchParams.get('minSalary') || '',
    deadlineWithinDays: searchParams.get('deadlineWithinDays') || '',
    sort: searchParams.get('sort') || 'latest',
    page: Math.max(1, Number(searchParams.get('page') || 1)),
  };
}

const FILTER_KEYS = [
  'q',
  'sector',
  'category',
  'state',
  'district',
  'city',
  'qualification',
  'experience',
  'jobType',
  'workMode',
  'remote',
  'minSalary',
  'deadlineWithinDays',
];

export default function JobsBrowser({ sector = 'all', title, subtitle, eyebrow = 'Find Jobs' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryString = searchParams.toString();
  const applied = useMemo(() => parseFilters(new URLSearchParams(queryString), sector), [queryString, sector]);

  const [draft, setDraft] = useState(applied);
  const [showFilters, setShowFilters] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const resultsRef = useRef(null);

  useEffect(() => {
    setDraft(applied);
  }, [queryString, sector]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const params = { ...applied, limit: 9 };
    if (!params.sector) delete params.sector;
    if (params.remote) params.remote = 'true';
    else delete params.remote;
    Object.keys(params).forEach((key) => {
      if (params[key] === '' || params[key] === undefined || params[key] === null) delete params[key];
    });

    jobApi
      .list(params)
      .then((response) => {
        if (!active) return;
        setJobs(response.data.jobs || []);
        setPagination(response.data.pagination || null);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Unable to load jobs right now.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [queryString, sector, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeCount = FILTER_KEYS.filter((key) => {
    if (key === 'sector' && sector !== 'all') return false;
    const value = applied[key];
    return value !== '' && value !== false && value !== undefined && value !== null;
  }).length;

  const scrollToResults = () => {
    window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const handleChange = (patch) => setDraft((current) => ({ ...current, ...patch }));

  const handleApply = () => {
    const next = new URLSearchParams();
    Object.entries({ ...draft, page: 1 }).forEach(([key, value]) => {
      if (key === 'page') return;
      if (key === 'sector' && sector !== 'all') return;
      if (key === 'sort' && value === 'latest') return;
      if (value === '' || value === false || value === undefined || value === null) return;
      next.set(key, String(value));
    });
    setSearchParams(next);
    setShowFilters(false);
    scrollToResults();
  };

  const handleClear = () => {
    const cleared = parseFilters(new URLSearchParams(), sector);
    setDraft(cleared);
    setSearchParams(new URLSearchParams());
    setShowFilters(false);
    scrollToResults();
  };

  const handleSort = (value) => {
    const next = new URLSearchParams(queryString);
    if (value === 'latest') next.delete('sort');
    else next.set('sort', value);
    next.delete('page');
    setSearchParams(next);
    scrollToResults();
  };

  const handlePage = (page) => {
    const next = new URLSearchParams(queryString);
    if (page <= 1) next.delete('page');
    else next.set('page', String(page));
    setSearchParams(next);
    scrollToResults();
  };

  return (
    <section className="bg-white">
      <div className="container-page py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">{title}</h1>
            {subtitle && <p className="section-subtitle">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <label className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-muted" htmlFor="jobs-sort">
              Sort by
            </label>
            <select
              id="jobs-sort"
              className="input h-10 w-auto py-1.5 text-sm"
              value={applied.sort}
              onChange={(event) => handleSort(event.target.value)}
            >
              <option value="latest">Latest jobs</option>
              <option value="oldest">Oldest jobs</option>
              <option value="salary">Highest salary</option>
              <option value="deadline">Closing soon</option>
              <option value="popular">Most viewed</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between lg:hidden">
          <button type="button" className="btn-outline btn-sm" onClick={() => setShowFilters((value) => !value)}>
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </button>
          <span className="text-sm text-muted">{pagination ? `${pagination.total} jobs` : 'Searching...'}</span>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
            <div className="lg:sticky lg:top-24">
              <FilterPanel
                filters={draft}
                onChange={handleChange}
                onApply={handleApply}
                onClear={handleClear}
                sector={sector}
              />
            </div>
          </aside>

          <div ref={resultsRef}>
            <div className="mb-4 hidden items-center justify-between lg:flex">
              <p className="text-sm text-muted">
                {loading ? 'Searching jobs...' : `${pagination?.total || 0} job${pagination?.total === 1 ? '' : 's'} found`}
              </p>
              {activeCount > 0 && (
                <button type="button" onClick={handleClear} className="text-xs font-semibold text-brand hover:text-brandDark">
                  Clear {activeCount} active filter{activeCount === 1 ? '' : 's'}
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <JobCardSkeleton key={index} />
                ))}
              </div>
            ) : error ? (
              <EmptyState
                icon={AlertTriangle}
                title="Could not load jobs"
                description={error}
                action={
                  <button type="button" className="btn-primary" onClick={() => setReloadKey((value) => value + 1)}>
                    Try again
                  </button>
                }
              />
            ) : jobs.length === 0 ? (
              <EmptyState
                title="No jobs found"
                description="We could not find any jobs matching your filters. Try a different keyword, location or clear the filters."
                action={
                  <button type="button" className="btn-primary" onClick={handleClear}>
                    Clear all filters
                  </button>
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {jobs.map((job) => (
                  <JobCard key={job._id} job={job} />
                ))}
              </div>
            )}

            <Pagination pagination={pagination} onPageChange={handlePage} className="mt-8" />
          </div>
        </div>
      </div>
    </section>
  );
}
