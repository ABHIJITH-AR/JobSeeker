import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Users,
} from 'lucide-react';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import JobCard from '../components/JobCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { publicApi } from '../services';
import { getErrorMessage } from '../services/api';
import { formatDate } from '../utils/format';

export default function CompanyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    publicApi
      .company(id)
      .then((response) => {
        if (!active) return;
        setCompany(response.data.company);
        setJobs(response.data.jobs || []);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'This company could not be found.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <section className="container-page py-16">
        <LoadingSpinner label="Loading company profile..." />
      </section>
    );
  }

  if (error || !company) {
    return (
      <section className="container-page py-16">
        <EmptyState
          icon={Building2}
          title="Company not found"
          description={error || 'This company profile is not available.'}
          action={
            <Link to="/companies" className="btn-primary">
              Browse companies
            </Link>
          }
        />
      </section>
    );
  }

  const location = [company.city, company.district, company.state].filter(Boolean).join(', ') || 'India';

  return (
    <>
      <div className="border-b border-line bg-skysoft/50">
        <div className="container-page flex flex-wrap items-center gap-2 py-3 text-xs text-muted">
          <Link to="/" className="hover:text-brand">Home</Link>
          <span>/</span>
          <Link to="/companies" className="hover:text-brand">Companies</Link>
          <span>/</span>
          <span className="truncate text-ink">{company.companyName}</span>
        </div>
      </div>

      <section className="container-page py-8">
        <button type="button" onClick={() => navigate(-1)} className="btn-ghost btn-sm mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="card p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <Avatar name={company.companyName} src={company.logo} size="xl" rounded="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {company.isVerified ? (
                  <span className="badge-green">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified employer
                  </span>
                ) : (
                  <span className="badge-slate">Not verified yet</span>
                )}
                {company.industry && <span className="badge-blue">{company.industry}</span>}
              </div>
              <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">{company.companyName}</h1>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-brand" />
                  {location}
                </span>
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-brand"
                  >
                    <Globe className="h-4 w-4 text-brand" />
                    Website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {company.companyEmail && (
                  <a href={`mailto:${company.companyEmail}`} className="inline-flex items-center gap-1.5 hover:text-brand">
                    <Mail className="h-4 w-4 text-brand" />
                    {company.companyEmail}
                  </a>
                )}
              </div>

              {company.description && (
                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">{company.description}</p>
              )}
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5 sm:grid-cols-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Open jobs</dt>
              <dd className="mt-1 inline-flex items-center gap-1.5 text-base font-bold text-ink">
                <BriefcaseBusiness className="h-4 w-4 text-brand" />
                {jobs.length}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Company size</dt>
              <dd className="mt-1 inline-flex items-center gap-1.5 text-base font-bold text-ink">
                <Users className="h-4 w-4 text-brand" />
                {company.companySize || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Founded</dt>
              <dd className="mt-1 inline-flex items-center gap-1.5 text-base font-bold text-ink">
                <CalendarDays className="h-4 w-4 text-brand" />
                {company.foundedYear || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Member since</dt>
              <dd className="mt-1 text-base font-bold text-ink">{formatDate(company.createdAt)}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-8">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="eyebrow">Open positions</p>
              <h2 className="section-title mt-1">Jobs at {company.companyName}</h2>
            </div>
            <Link to="/jobs" className="text-sm font-semibold text-brand">Browse all jobs</Link>
          </div>

          {jobs.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                icon={BriefcaseBusiness}
                title="No open positions right now"
                description="This company does not have any active job listings at the moment. Check back later or explore other companies."
                action={
                  <Link to="/companies" className="btn-primary">
                    Browse companies
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
