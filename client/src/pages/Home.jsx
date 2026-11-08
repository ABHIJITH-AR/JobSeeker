import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Calculator,
  FileText,
  GraduationCap,
  HeartPulse,
  Landmark,
  Laptop,
  MapPin,
  Megaphone,
  Search,
  ShieldCheck,
  TrendingUp,
  UserRound,
  Users,
  Wrench,
} from 'lucide-react';
import SearchBar from '../components/SearchBar';
import JobCard from '../components/JobCard';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import { JobCardSkeleton } from '../components/LoadingSpinner';
import { publicApi } from '../services';
import { getErrorMessage } from '../services/api';
import { HOME_CATEGORIES, POPULAR_LOCATIONS } from '../utils/constants';
import { formatNumber } from '../utils/format';

const categoryIcons = {
  Laptop,
  Wrench,
  Landmark,
  HeartPulse,
  GraduationCap,
  Megaphone,
  Calculator,
  BriefcaseBusiness,
  Building2,
};

const popularSearches = ['Software Developer', 'Data Analyst', 'Bank PO', 'Teacher', 'Nurse', 'SSC'];

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    publicApi
      .home()
      .then((response) => {
        if (active) setData(response.data);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Unable to load the latest jobs right now.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = data?.stats || {};
  const categoryCounts = new Map((data?.popularCategories || []).map((item) => [item.name, item.count]));
  const governmentCount = data?.popularCategories?.find((item) => item.sector === 'government')?.count || 0;
  const locationChips = data?.popularLocations?.length
    ? data.popularLocations
    : POPULAR_LOCATIONS.map((name) => ({ name, count: null }));

  return (
    <>
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand/30 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl" aria-hidden="true" />
        <div className="container-page relative py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-sky-100">
              <BadgeCheck className="h-4 w-4" />
              Private and verified government jobs across India
            </span>
            <h1 className="mt-5 text-balance text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
              Find the right job. Build your career in India.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
              Search private sector roles and official government vacancies in every state and union territory.
              Create a profile, upload your resume and apply with confidence.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-4xl">
            <SearchBar />
          </div>

          <div className="mx-auto mt-5 flex max-w-4xl flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">Popular:</span>
            {popularSearches.map((term) => (
              <Link
                key={term}
                to={`/jobs?q=${encodeURIComponent(term)}`}
                className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-slate-100 transition hover:border-white/40 hover:bg-white/10"
              >
                {term}
              </Link>
            ))}
          </div>

          <dl className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Open jobs', value: stats.totalJobs || 0, icon: BriefcaseBusiness },
              { label: 'Private jobs', value: stats.privateJobs || 0, icon: Building2 },
              { label: 'Government jobs', value: stats.governmentJobs || 0, icon: Landmark },
              { label: 'Registered job seekers', value: stats.jobSeekers || 0, icon: Users },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-xl border border-white/15 bg-white/5 p-4 text-center backdrop-blur-sm">
                  <Icon className="mx-auto h-5 w-5 text-sky-300" />
                  <dd className="mt-2 text-2xl font-bold text-white">{formatNumber(item.value)}</dd>
                  <dt className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-300">{item.label}</dt>
                </div>
              );
            })}
          </dl>
        </div>
      </section>

      {error && (
        <div className="container-page mt-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>
        </div>
      )}

      <section className="section">
        <div className="container-page">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Browse by category</p>
              <h2 className="section-title mt-1">Explore jobs that fit your skills</h2>
              <p className="section-subtitle">From software and engineering to banking, healthcare and government recruitment.</p>
            </div>
            <Link to="/jobs" className="btn-outline btn-sm self-start sm:self-auto">
              View all jobs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {HOME_CATEGORIES.map((category) => {
              const Icon = categoryIcons[category.icon] || BriefcaseBusiness;
              const count = category.government ? governmentCount : categoryCounts.get(category.category) || 0;
              const to = category.government
                ? '/government-jobs'
                : `/jobs?category=${encodeURIComponent(category.category)}`;
              return (
                <Link
                  key={category.name}
                  to={to}
                  className="card card-hover flex flex-col items-start gap-3 p-4"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-skysoft text-brand">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold leading-snug text-ink">{category.name}</span>
                  <span className="text-xs text-muted">{count ? `${formatNumber(count)} openings` : 'Explore jobs'}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="container-page">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Latest private jobs</p>
              <h2 className="section-title mt-1">New opportunities from top employers</h2>
              <p className="section-subtitle">Fresh roles posted by verified and growing companies across India.</p>
            </div>
            <Link to="/private-jobs" className="btn-outline btn-sm self-start bg-white sm:self-auto">
              Browse private jobs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loading
              ? Array.from({ length: 6 }).map((_, index) => <JobCardSkeleton key={index} />)
              : data?.latestPrivate?.length
                ? data.latestPrivate.map((job) => <JobCard key={job._id} job={job} />)
                : null}
          </div>
          {!loading && !data?.latestPrivate?.length && (
            <div className="mt-7">
              <EmptyState
                title="No private jobs posted yet"
                description="New private sector jobs will appear here as soon as employers publish them."
                action={
                  <Link to="/register" className="btn-primary">
                    Post the first job
                  </Link>
                }
              />
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Government jobs</p>
              <h2 className="section-title mt-1">Official vacancies, verified by our team</h2>
              <p className="section-subtitle">
                We list government recruitment only with an official application website. Verified listings also carry a
                notification number or the official notification PDF.
              </p>
            </div>
            <Link to="/government-jobs" className="btn-outline btn-sm self-start sm:self-auto">
              Browse government jobs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <JobCardSkeleton key={index} />
              ))}
            </div>
          ) : data?.latestGovernment?.length ? (
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.latestGovernment.map((job) => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
          ) : (
            <div className="mt-7">
              <EmptyState
                icon={ShieldCheck}
                title="No verified government vacancies right now"
                description="To protect job seekers, we only publish government jobs after checking the official notification and recruitment website. Verified vacancies will appear here."
                action={
                  <Link to="/government-jobs" className="btn-outline">
                    Browse government jobs
                  </Link>
                }
              />
            </div>
          )}

          <div className="mt-5 flex items-start gap-2 rounded-lg border border-line bg-skysoft/60 px-4 py-3 text-xs leading-5 text-muted">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            Always apply through the official government website. JobSeeker never charges money for a government job
            application and never asks for payment on behalf of a department.
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="container-page">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Featured companies</p>
              <h2 className="section-title mt-1">Employers hiring on JobSeeker</h2>
              <p className="section-subtitle">Discover companies by industry, location and open roles.</p>
            </div>
            <Link to="/companies" className="btn-outline btn-sm self-start bg-white sm:self-auto">
              View all companies
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="card animate-pulse p-5">
                  <div className="h-12 w-12 rounded-lg bg-slate-100" />
                  <div className="mt-4 h-4 w-2/3 rounded bg-slate-100" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : data?.featuredCompanies?.length ? (
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.featuredCompanies.map((company) => (
                <Link key={company._id} to={`/companies/${company._id}`} className="card card-hover p-5">
                  <div className="flex items-start justify-between gap-2">
                    <Avatar name={company.companyName} src={company.logo} size="lg" rounded="lg" />
                    {company.isVerified && (
                      <span className="badge-green">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 line-clamp-1 text-sm font-bold text-ink">{company.companyName}</h3>
                  <p className="mt-1 line-clamp-1 text-xs text-muted">
                    {company.industry || 'Company'}
                    {company.city ? ` • ${company.city}` : ''}
                  </p>
                  <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand">
                    <BriefcaseBusiness className="h-3.5 w-3.5" />
                    {company.jobCount} open job{company.jobCount === 1 ? '' : 's'}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-7">
              <EmptyState
                icon={Building2}
                title="Companies will appear here"
                description="When employers post their first job, their company profile will be listed here."
              />
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="eyebrow">Jobs by location</p>
              <h2 className="section-title mt-1">Find work near you, anywhere in India</h2>
              <p className="section-subtitle">
                Search opportunities in all 28 states and 8 union territories, from metro cities to growing regional
                hubs.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {locationChips.map((location) => (
                  <Link
                    key={location.name}
                    to={`/jobs?state=${encodeURIComponent(location.name)}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
                  >
                    <MapPin className="h-3.5 w-3.5 text-brand" />
                    {location.name}
                    {location.count ? <span className="text-muted">({location.count})</span> : null}
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: UserRound,
                  title: 'Create your profile',
                  text: 'Add your education, skills and location in minutes.',
                },
                {
                  icon: Search,
                  title: 'Search and apply',
                  text: 'Filter by role, salary, location and job type.',
                },
                {
                  icon: FileText,
                  title: 'Track applications',
                  text: 'Follow every application status in your dashboard.',
                },
              ].map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="card p-5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-skysoft text-brand">
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-xs font-bold uppercase tracking-wide text-muted">Step {index + 1}</p>
                    <h3 className="mt-1 text-sm font-bold text-ink">{step.title}</h3>
                    <p className="mt-1.5 text-xs leading-5 text-muted">{step.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-2xl bg-navy px-6 py-10 text-white sm:px-10">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/30 blur-3xl" aria-hidden="true" />
            <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-200">
                  <TrendingUp className="h-4 w-4" />
                  For employers
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Hiring in India? Reach the right candidates.</h2>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Create a company profile, post jobs and manage applicants from one dashboard. Every job is reviewed
                  before it goes live to keep listings trustworthy.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/register" className="btn-white">
                  Post a Job
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/contact" className="btn-outline border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  Talk to us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
