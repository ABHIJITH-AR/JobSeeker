import { ShieldCheck } from 'lucide-react';
import JobsBrowser from '../components/JobsBrowser';

export default function GovernmentJobs() {
  return (
    <>
      <JobsBrowser
        sector="government"
        eyebrow="Government Jobs"
        title="Government recruitment across India"
        subtitle="Search central, state and public sector vacancies. Verified listings include an official application website and notification reference."
      />
      <div className="container-page pb-10">
        <div className="flex items-start gap-2 rounded-lg border border-line bg-skysoft/60 px-4 py-3 text-xs leading-5 text-muted">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          JobSeeker never charges for government job information. Always complete your application on the official
          government website and verify every detail against the official notification.
        </div>
      </div>
    </>
  );
}
