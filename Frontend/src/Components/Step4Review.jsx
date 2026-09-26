export default function Step4Review({ data, onSubmit, onBack, error, loading }) {
  const fields = [
    ['First name', data.firstName],
    ['Last name', data.lastName],
    ['Email', data.email],
    ['Phone number', data.phoneNumber],
    ['Alternate phone', data.alternatePhoneNumber || '—'],
    ['Display name', data.displayName],
    ['Company name', data.companyName],
    ['Address', data.addressLine1],
    ['City', data.city],
    ['State', data.state],
    ['Country', data.country],
    ['Pincode', data.pincode],
  ];

  return (
    <div className="wizard-step">
      <h2>Review your details</h2>

      <dl className="review-list">
        {fields.map(([label, value]) => (
          <div key={label} className="review-row">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      {error && <p className="error">{error}</p>}

      <div className="wizard-actions">
        <button type="button" onClick={onBack} disabled={loading}>Back</button>
        <button type="button" onClick={onSubmit} disabled={loading}>
          {loading ? 'Submitting...' : 'Confirm & Sign Up'}
        </button>
      </div>
    </div>
  );
}