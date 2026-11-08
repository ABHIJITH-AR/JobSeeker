import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Download, FileText, Loader2, Trash2, Upload } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { userApi } from '../../services';
import { downloadBlob, getErrorMessage } from '../../services/api';
import { fileSize, formatDateTime } from '../../utils/format';

const ACCEPTED = '.pdf,.doc,.docx';
const MAX_MB = 5;

export default function Resume() {
  const { refreshUser } = useAuth();
  const toast = useToast();
  const inputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let active = true;
    userApi
      .getProfile()
      .then((response) => {
        if (active) setProfile(response.data.profile);
      })
      .catch((err) => toast.error(getErrorMessage(err, 'Unable to load your resume.')))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const validateFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(ext)) {
      toast.error('Please choose a PDF, DOC or DOCX file.');
      return false;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Resume must be smaller than ${MAX_MB}MB.`);
      return false;
    }
    return true;
  };

  const pickFile = (file) => {
    if (!file || !validateFile(file)) return;
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('resume', selectedFile);
    setUploading(true);
    try {
      const response = await userApi.uploadResume(formData);
      setProfile((current) => ({ ...current, resume: response.data.resume }));
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = '';
      await refreshUser().catch(() => {});
      toast.success('Resume uploaded successfully.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not upload your resume.'));
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await userApi.downloadResume();
      downloadBlob(response, profile?.resume?.originalName || 'resume.pdf');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not download your resume.'));
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await userApi.deleteResume();
      setProfile((current) => ({ ...current, resume: null }));
      await refreshUser().catch(() => {});
      setConfirmOpen(false);
      toast.success('Resume deleted.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete your resume.'));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading your resume..." />;

  const resume = profile?.resume;

  return (
    <div className="space-y-6">
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">Your resume</h2>
            <p className="mt-1 text-sm text-muted">
              A resume is required to apply for private sector jobs. Government applications are completed on the
              official website.
            </p>
          </div>
          {resume && (
            <span className="badge-green self-start">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Resume on file
            </span>
          )}
        </div>

        {resume ? (
          <div className="mt-5 flex flex-col gap-4 rounded-xl border border-line bg-slate-50/60 p-4 sm:flex-row sm:items-center">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-brand shadow-sm">
              <FileText className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{resume.originalName || 'Resume'}</p>
              <p className="mt-0.5 text-xs text-muted">
                {fileSize(resume.size)} • Uploaded {formatDateTime(resume.uploadedAt)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-outline btn-sm" onClick={handleDownload} disabled={downloading}>
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download
              </button>
              <button type="button" className="btn-outline btn-sm" onClick={() => inputRef.current?.click()}>
                <Upload className="h-4 w-4" />
                Replace
              </button>
              <button type="button" className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => setConfirmOpen(true)}>
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-line bg-slate-50/60 p-6 text-center">
            <FileText className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-ink">No resume uploaded yet</p>
            <p className="mt-1 text-xs text-muted">Upload a PDF, DOC or DOCX file up to {MAX_MB}MB.</p>
          </div>
        )}
      </div>

      <div className="card p-5 sm:p-6">
        <h2 className="text-lg font-bold text-ink">{resume ? 'Upload a new resume' : 'Upload your resume'}</h2>
        <p className="mt-1 text-sm text-muted">
          Choose a clear, updated resume. Your resume is shared only with employers you apply to.
        </p>

        <div
          className={`mt-5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
            dragging ? 'border-brand bg-skysoft' : 'border-line bg-slate-50/60'
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            pickFile(event.dataTransfer.files?.[0]);
          }}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-skysoft text-brand">
            <Upload className="h-6 w-6" />
          </span>
          <p className="mt-3 text-sm font-semibold text-ink">Drag and drop your resume here</p>
          <p className="mt-1 text-xs text-muted">or</p>
          <button type="button" className="btn-outline btn-sm mt-3" onClick={() => inputRef.current?.click()}>
            Browse files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            className="sr-only"
            onChange={(event) => pickFile(event.target.files?.[0])}
          />
          <p className="mt-3 text-[11px] text-muted">PDF, DOC or DOCX • maximum {MAX_MB}MB</p>
        </div>

        {selectedFile && (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-line bg-white p-3 sm:flex-row sm:items-center">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-skysoft text-brand">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{selectedFile.name}</p>
              <p className="text-xs text-muted">{fileSize(selectedFile.size)}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => {
                  setSelectedFile(null);
                  if (inputRef.current) inputRef.current.value = '';
                }}
                disabled={uploading}
              >
                Remove
              </button>
              <button type="button" className="btn-primary btn-sm" onClick={handleUpload} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? 'Uploading...' : 'Upload resume'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card p-5 sm:p-6">
        <h2 className="text-base font-bold text-ink">Resume tips</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
          {[
            'Keep your resume to one or two pages and use a clear font.',
            'Include your contact details, education, skills and work experience.',
            'Use a PDF if possible so your formatting stays the same.',
            'Update your resume whenever you gain new skills or experience.',
          ].map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete resume?"
        message="Your resume will be removed from your profile. You will need to upload a new resume before applying for private jobs."
        confirmLabel="Delete resume"
        danger
        loading={deleting}
      />
    </div>
  );
}
