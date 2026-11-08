import { Link } from 'react-router-dom';
import { Clock, Mail, MapPin } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy text-slate-300">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo variant="light" />
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-300">
            India's all-in-one job portal for private sector and government opportunities. Search, save and apply
            from anywhere in India.
          </p>
          <div className="mt-5 space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-sky-300" />
              support@jobseeker.in
            </p>
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-sky-300" />
              Mon–Fri, 9 AM – 6 PM IST
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-300" />
              India
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">For Job Seekers</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link to="/jobs" className="transition hover:text-white">Find Jobs</Link></li>
            <li><Link to="/private-jobs" className="transition hover:text-white">Private Jobs</Link></li>
            <li><Link to="/government-jobs" className="transition hover:text-white">Government Jobs</Link></li>
            <li><Link to="/companies" className="transition hover:text-white">Companies</Link></li>
            <li><Link to="/register" className="transition hover:text-white">Create Job Seeker Account</Link></li>
            <li><Link to="/login" className="transition hover:text-white">Job Seeker Login</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">For Employers</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link to="/register" className="transition hover:text-white">Post a Job</Link></li>
            <li><Link to="/employer" className="transition hover:text-white">Employer Dashboard</Link></li>
            <li><Link to="/employer/jobs" className="transition hover:text-white">Manage Jobs</Link></li>
            <li><Link to="/employer/applicants" className="transition hover:text-white">View Applicants</Link></li>
            <li><Link to="/companies" className="transition hover:text-white">Browse Companies</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">JobSeeker</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link to="/about" className="transition hover:text-white">About Us</Link></li>
            <li><Link to="/contact" className="transition hover:text-white">Contact Us</Link></li>
            <li><Link to="/jobs" className="transition hover:text-white">All India Jobs</Link></li>
            <li><Link to="/government-jobs" className="transition hover:text-white">Verified Government Jobs</Link></li>
          </ul>
          <div className="mt-5 rounded-lg border border-white/15 bg-white/5 p-3 text-xs leading-5 text-slate-300">
            Government vacancies marked with a verified badge have been checked by our admin team against the
            official notification and recruitment website.
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-slate-400 sm:flex-row">
          <p>© {year} JobSeeker. All rights reserved.</p>
          <p>Built for job seekers and employers across India.</p>
        </div>
      </div>
    </footer>
  );
}
