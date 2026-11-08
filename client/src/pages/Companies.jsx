import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BadgeCheck, BriefcaseBusiness, Building2, MapPin, Search } from 'lucide-react';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { useToast } from '../context/ToastContext';
import { publicApi } from '../services';
import { getErrorMessage } from '../services/api';

export default function Companies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const [term, setTerm] = useState(searchParams.get('q') || '');
  const [query, setQuery] = useState({
    q: searchParams.get('q') || '',
    verified: searchParams.get('verified') === 'true',
    page: Math.max(1, Number(searchParams.get('page') || 1)),
  });
  const [companies, setCompanies] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const next = new URLSearchParams();
    if (query.q) next.set('q', query.q);
    if (query.verified) next.set('verified', 'true');
    if (query.page > 1) next.set('page', String(query.page));
    setSearchParams(next, { replace: true });
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    publicApi
      .companies({
        page: query.page,
        limit: 12,
        q: query.q || undefined,
        verified: query.verified ? 'true' : undefined,
      })
      .then((response) => {
        if (!active) return;
        setCompanies(response.data.companies || []);
        setPagination(response.data.pagination || null);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Unable to load companies right now.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query]);

  const handleSearch = (event) => {
    event.preventDefault();
    setQuery((current) => ({ ...current, q: term.trim(), page: 1 }));
  };

  const handleReset = () => {
    setTerm('');
    setQuery({ q: '', verified: false, page: 1 });
  };

  const hasFilters = Boolean(query.q || query.verified);

  return (
    <>
      <section className="bg-skysoft/70">
        <div className="container-page py-12 sm:py-16">
          <div className="max-w-2xl">
            <p className="eyebrow">Companies</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Discover companies hiring in India</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Browse employers with active job openings. Verified companies have been reviewed by our admin team.
            </p>
          </div>

          <form onSubmit={handleSearch} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                className="input h-11 pl-10"
                placeholder="Search by company name"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                aria-label="Search companies"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm font-medium text-ink">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
                checked={query.verified}
                onChange={(event) => setQuery((current) => ({ ...current, verified: event.target.checked, page: 1 }))}
              />
              Verified only
            </label>
            <button type="submit" className="btn-primary h-11">Search</button>
            {hasFilters && (
              <button type="button" onClick={handleReset} className="btn-ghost h-11">
                Reset
              </button>
            )}
          </form>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted">
            {loading ? 'Loading companies...' : `${pagination?.total || 0} compan${pagination?.total === 1 ? 'y' : 'ies'} found`}
          </p>
        </div>

        {error ? (
          <div className="mt-6">
            <EmptyState
              icon={Building2}
              title="Could not load companies"
              description={error}
              action={
                <button type="button" className="btn-primary" onClick={() => setQuery((current) => ({ ...current }))}>
                  Try again
                </button>
              }
            />
          </div>
        ) : loading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="card animate-pulse p-5">
                <div className="h-14 w-14 rounded-lg bg-slate-100" />
                <div className="mt-4 h-4 w-2/3 rounded bg-slate-100" />
                <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
                <div className="mt-4 h-3 w-full rounded bg-slate-100" />
                <div className="mt-2 h-3 w-5/6 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : companies.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={Building2}
              title="No companies found"
              description={
                hasFilters
                  ? 'No companies match your search. Try a different name or remove the verified filter.'
                  : 'Companies will appear here once employers post their first job.'
              }
              action={
                hasFilters ? (
                  <button type="button" className="btn-primary" onClick={handleReset}>
                    Clear filters
                  </button>
                ) : (
                  <Link to="/register" className="btn-primary">
                    Post a job
                  </Link>
                )
              }
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <Link key={company._id} to={`/companies/${company._id}`} className="card card-hover flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <Avatar name={company.companyName} src={company.logo} size="lg" rounded="lg" />
                  {company.isVerified ? (
                    <span className="badge-green">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Verified
                    </span>
                  ) : (
                    <span className="badge-slate">Not verified</span>
                  )}
                </div>
                <h2 className="mt-3 line-clamp-1 text-base font-bold text-ink">{company.companyName}</h2>
                <p className="mt-1 text-xs text-muted">
                  {[company.industry || 'Company', company.companySize].filter(Boolean).join(' • ')}
                </p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted">
                  <MapPin className="h-3.5 w-3.5 text-brand" />
                  {[company.city, company.state].filter(Boolean).join(', ') || 'India'}
                </p>
                {company.description && (
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{company.description}</p>
                )}
                <div className="mt-auto flex items-center justify-between pt-4">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand">
                    <BriefcaseBusiness className="h-3.5 w-3.5" />
                    {company.jobCount} open job{company.jobCount === 1 ? '' : 's'}
                  </span>
                  <span className="text-xs font-semibold text-muted">View profile →</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <Pagination
          pagination={pagination}
          onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
          className="mt-8"
        />
      </section>
    </>
  );
}
