import { useState } from 'react';
import { CheckCircle2, Clock, Mail, MapPin, Send, ShieldCheck } from 'lucide-react';
import { Input, Textarea } from '../components/FormField';
import { useToast } from '../context/ToastContext';
import { publicApi } from '../services';
import { getErrorMessage } from '../services/api';

const initialForm = { name: '', email: '', phone: '', subject: '', message: '' };

export default function Contact() {
  const toast = useToast();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim() || form.name.trim().length < 2) next.name = 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Please enter a valid email address.';
    if (form.phone.trim() && !/^[6-9]\d{9}$/.test(form.phone.trim())) next.phone = 'Enter a valid 10 digit mobile number or leave it blank.';
    if (!form.subject.trim()) next.subject = 'Please enter a subject.';
    if (!form.message.trim() || form.message.trim().length < 10) next.message = 'Please write at least 10 characters.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const response = await publicApi.contact({
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      toast.success(response.data.message || 'Your message has been sent.');
      setSent(true);
      setForm(initialForm);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not send your message. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="bg-skysoft/70">
        <div className="container-page py-12 sm:py-16">
          <div className="max-w-2xl">
            <p className="eyebrow">Contact us</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">How can we help?</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Questions about your account, a job listing or government job verification? Send us a message and our
              team will get back to you.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="card p-5 sm:p-7">
            <h2 className="text-lg font-bold text-ink">Send us a message</h2>
            <p className="mt-1 text-sm text-muted">Fields marked with an asterisk are required.</p>

            {sent && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                Your message has been received. We will respond as soon as possible.
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Full name"
                  required
                  value={form.name}
                  error={errors.name}
                  onChange={(event) => update('name', event.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
                <Input
                  label="Email address"
                  type="email"
                  required
                  value={form.email}
                  error={errors.email}
                  onChange={(event) => update('email', event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Mobile number"
                  value={form.phone}
                  error={errors.phone}
                  onChange={(event) => update('phone', event.target.value)}
                  placeholder="10 digit mobile number (optional)"
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="tel"
                />
                <Input
                  label="Subject"
                  required
                  value={form.subject}
                  error={errors.subject}
                  onChange={(event) => update('subject', event.target.value)}
                  placeholder="How can we help?"
                />
              </div>

              <Textarea
                label="Message"
                required
                rows={6}
                value={form.message}
                error={errors.message}
                onChange={(event) => update('message', event.target.value)}
                placeholder="Write your message here..."
                maxLength={2000}
              />
              <p className="help-text">{form.message.length}/2000 characters</p>

              <button type="submit" className="btn-primary" disabled={submitting}>
                <Send className="h-4 w-4" />
                {submitting ? 'Sending...' : 'Send message'}
              </button>
            </form>
          </div>

          <aside className="space-y-4">
            <div className="card p-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Contact details</h2>
              <ul className="mt-4 space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-skysoft text-brand">
                    <Mail className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">Email</p>
                    <a href="mailto:support@jobseeker.in" className="text-muted hover:text-brand">support@jobseeker.in</a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-skysoft text-brand">
                    <Clock className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">Support hours</p>
                    <p className="text-muted">Monday to Friday, 9 AM – 6 PM IST</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-skysoft text-brand">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">Coverage</p>
                    <p className="text-muted">All 28 states and 8 union territories of India</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="card border-brand/20 bg-skysoft/60 p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand" />
                <h2 className="text-sm font-bold text-ink">Reporting a suspicious job</h2>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">
                If a listing asks for money, promises a guaranteed government job or looks fraudulent, contact us with
                the job title and company name. Our admin team reviews every report.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
