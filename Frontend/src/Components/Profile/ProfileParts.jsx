export const getInitials = (first = "", last = "") =>
  `${first.trim().charAt(0)}${last.trim().charAt(0)}`.toUpperCase() || "?";

export function ProfileStatus({ loading, error, onRetry }) {
  if (loading) return <div className="pf-state">Loading your profile…</div>;
  if (error)
    return (
      <div className="pf-state">
        <p>{error}</p>
        <button type="button" className="btn-secondary" onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  return null;
}

export function ProfileHeader({ initials, title, subtitle, badges = [], editing, onEdit }) {
  return (
    <header className="pf-header">
      <div className="pf-avatar" aria-hidden="true">
        {initials}
      </div>
      <div className="pf-identity">
        <h1>{title}</h1>
        {subtitle && <p className="pf-sub">{subtitle}</p>}
        <div className="pf-badges">
          {badges.map((b) => (
            <span key={b.label} className={`pf-badge${b.ok ? " pf-badge--ok" : ""}`}>
              {b.label}
            </span>
          ))}
        </div>
      </div>
      {!editing && (
        <button type="button" onClick={onEdit}>
          Edit profile
        </button>
      )}
    </header>
  );
}

export function Section({ title, description, children }) {
  return (
    <section className="pf-section">
      <div>
        <h2>{title}</h2>
        {description && <p className="pf-section-desc">{description}</p>}
      </div>
      <div className="pf-grid">{children}</div>
    </section>
  );
}

export function Field({
  label,
  name,
  value,
  onChange,
  editing,
  error,
  hint,
  readOnly = false,
  full = false,
  type = "text",
  inputMode,
  autoComplete,
}) {
  const id = `pf-${name}`;
  const isInput = editing && !readOnly;

  return (
    <div className={`pf-field${full ? " pf-field--full" : ""}`}>
      {isInput ? (
        <label htmlFor={id} className="pf-label">
          {label}
        </label>
      ) : (
        <span className="pf-label">{label}</span>
      )}

      {isInput ? (
        <>
          <input
            id={id}
            name={name}
            type={type}
            inputMode={inputMode}
            autoComplete={autoComplete}
            value={value ?? ""}
            onChange={onChange}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${id}-error` : undefined}
          />
          {error && (
            <span id={`${id}-error`} className="pf-error" role="alert">
              {error}
            </span>
          )}
        </>
      ) : (
        <p className="pf-value">{value || <span className="pf-empty">Not added</span>}</p>
      )}

      {editing && readOnly && hint && <span className="pf-hint">{hint}</span>}
    </div>
  );
}

export function SaveBar({ saving, onCancel }) {
  return (
    <div className="pf-savebar">
      <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
        Cancel
      </button>
      <button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}