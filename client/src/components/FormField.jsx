import { useId } from 'react';

export function Field({ label, htmlFor, error, help, required, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="label">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {error ? <p className="error-text">{error}</p> : help ? <p className="help-text">{help}</p> : null}
    </div>
  );
}

export function Input({ label, error, help, required, id, className = '', ...props }) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <Field label={label} htmlFor={inputId} error={error} help={help} required={required}>
      <input id={inputId} className={`input ${error ? 'input-error' : ''} ${className}`} aria-invalid={Boolean(error)} {...props} />
    </Field>
  );
}

export function Select({ label, error, help, required, id, children, className = '', ...props }) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <Field label={label} htmlFor={inputId} error={error} help={help} required={required}>
      <select id={inputId} className={`input ${error ? 'input-error' : ''} ${className}`} aria-invalid={Boolean(error)} {...props}>
        {children}
      </select>
    </Field>
  );
}

export function Textarea({ label, error, help, required, id, rows = 4, className = '', ...props }) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <Field label={label} htmlFor={inputId} error={error} help={help} required={required}>
      <textarea
        id={inputId}
        rows={rows}
        className={`input resize-y ${error ? 'input-error' : ''} ${className}`}
        aria-invalid={Boolean(error)}
        {...props}
      />
    </Field>
  );
}

export default Input;
