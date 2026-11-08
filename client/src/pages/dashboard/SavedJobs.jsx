import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookmarkX, Loader2, Search } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import JobCard from '../../components/JobCard';
import { JobCardSkeleton } from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { savedJobApi } from '../../services';
import { getErrorMessage } from '../../services/api';

export default function SavedJobs() {
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    savedJobApi
      .list()
      .then((response) => setJobs(response.data.jobs || []))
      .catch((err) => setError(getErrorMessage(err, 'Unable to load your saved jobs.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRemove = async (jobId) => {
    setRemovingId(jobId);
    try {
      await savedJobApi.remove(jobId);
      setJobs((current) => current.filter((job) => job._id !== jobId));
      toast.success('Job removed from saved list.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not remove this job.'));
    } finally {
      setRemovingId('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Saved jobs</h2>
          <p className="mt-1 text-sm text-muted">
            {loading ? 'Loading your saved jobs...' : `${jobs.length} job${jobs.length === 1 ? '' : 's'} saved for later.`}
          </p>
        </div>
        <Link to="/jobs" className="btn-primary btn-sm self-start">
          <Search className="h-4 w-4" />
          Browse jobs
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <JobCardSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={BookmarkX}
          title="Could not load saved jobs"
          description={error}
          action={
            <button type="button" className="btn-primary" onClick={load}>
              Try again
            </button>
          }
        />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={BookmarkX}
          title="No saved jobs yet"
          description="Tap the bookmark icon on any job to save it here and review it later."
          action={<Link to="/jobs" className="btn-primary">Find jobs</Link>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <div key={job._id} className="flex flex-col">
              <JobCard job={job} className="flex-1" />
              <button
                type="button"
                className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                onClick={() => handleRemove(job._id)}
                disabled={removingId === job._id}
              >
                {removingId === job._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookmarkX className="h-3.5 w-3.5" />}
                Remove from saved
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
