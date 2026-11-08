import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  FileSearch,
  Handshake,
  Landmark,
  Lock,
  Search,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react';
import { publicApi } from '../services';
import { formatNumber } from '../utils/format';

const commitments = [
  {
    icon: ShieldCheck,
    title: 'Admin-reviewed listings',
    text: 'Every employer job is reviewed by our admin team before it is published, so job seekers see genuine openings.',
  },
  {
    icon: BadgeCheck,
    title: 'Verified government vacancies',
    text: 'Government listings require an official application website and are verified against a notification number or official PDF.',
  },
  {
    icon: Lock,
    title: 'No pay-to-apply',
    text: 'JobSeeker does not charge job seekers for applications. We never ask for payment on behalf of an employer or department.',
  },
];

export default function About() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let active = true;
    publicApi
      .stats()
      .then((response) => {
        if (active) setStats(response.data.stats);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const numbers = [
    { label: 'Open jobs', value: stats?.totalJobs || 0, icon: Search },
    { label: 'Private jobs', value: stats?.privateJobs || 0, icon: Building2 },
    { label: 'Government jobs', value: stats?.governmentJobs || 0, icon: Landmark },
    { label: 'Registered job seekers', value: stats?.jobSeekers || 0, icon: Users },
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-skysoft/70">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand/10 blur-3xl" aria-hidden="true" />
        <div className="container-page relative py-14 sm:py-20">
          <div className="max-w-3xl">
            <p className="eyebrow">About JobSeeker</p>
            <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
              Connecting India's talent with the right opportunities
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              JobSeeker is a job portal built for India. We bring private sector roles and government recruitment into
              one place, with clear information, honest listings and tools that help job seekers and employers move
              forward.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/jobs" className="btn-primary">
                <Search className="h-4 w-4" />
                Find Jobs
              </Link>
              <Link to="/register" className="btn-outline bg-white">
                <Building2 className="h-4 w-4" />
                Post a Job
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-white">
        <div className="container-page grid grid-cols-2 gap-4 py-8 sm:grid-cols-4">
          {numbers.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="text-center">
                <Icon className="mx-auto h-5 w-5 text-brand" />
                <p className="mt-2 text-2xl font-bold text-ink">{formatNumber(item.value)}</p>
                <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-muted">{item.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="container-page grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow">Our mission</p>
            <h2 className="section-title mt-1">Make job search simple, transparent and trustworthy</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Looking for a job should not mean scrolling through unclear listings or paying for information. Our goal
              is to give every job seeker in India a clean, reliable place to discover opportunities, and to give
              employers a simple way to reach the right candidates.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              We cover all 28 states and 8 union territories, so you can search near your home town or explore a new
              city. Whether you are a fresher, an experienced professional or looking for a government post, the
              platform is designed to help you take the next step.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-lg border border-line bg-white p-4">
                <Target className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <div>
                  <p className="text-sm font-semibold text-ink">Focused on India</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted">State, district and city level job discovery.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-line bg-white p-4">
                <Handshake className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <div>
                  <p className="text-sm font-semibold text-ink">Built for both sides</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted">Useful tools for job seekers and employers.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-skysoft text-brand">
                <Search className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-base font-bold text-ink">For job seekers</h3>
              <ul className="mt-2 space-y-1.5 text-xs leading-5 text-muted">
                {['Search and filter jobs', 'Create a complete profile', 'Upload your resume', 'Save jobs and track applications', 'Get status notifications'].map((item) => (
                  <li key={item} className="flex items-start gap-1.5">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-skysoft text-brand">
                <Building2 className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-base font-bold text-ink">For employers</h3>
              <ul className="mt-2 space-y-1.5 text-xs leading-5 text-muted">
                {['Create a company profile', 'Post jobs in minutes', 'Reach candidates across India', 'Review applicants and resumes', 'Update application status'].map((item) => (
                  <li key={item} className="flex items-start gap-1.5">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="eyebrow">Trust and safety</p>
            <h2 className="section-title mt-1">A job portal that puts honesty first</h2>
            <p className="section-subtitle">
              We would rather show fewer listings than mislead job seekers. These are the standards we apply across the
              platform.
            </p>
          </div>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {commitments.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="card p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-navy text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-ink">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-muted">{item.text}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-lg border border-line bg-white px-4 py-3 text-xs leading-5 text-muted">
            <FileSearch className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            Government vacancies marked with a verified badge have been checked by our admin team. A listing without
            the badge may still be under review, so always confirm details on the official recruitment website.
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-2xl bg-navy px-6 py-10 text-white sm:px-10">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/30 blur-3xl" aria-hidden="true" />
            <div className="relative flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to take the next step?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Create your free account, complete your profile and start exploring opportunities today.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/register" className="btn-white">Create free account</Link>
                <Link to="/contact" className="btn-outline border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  Contact us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
