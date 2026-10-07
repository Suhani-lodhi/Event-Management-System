import { useState } from 'react';

export default function Step2ContactInfo({ data, onNext, onBack }) {
  const [values, setValues] = useState({
    phoneNumber: data.phoneNumber,
    displayName: data.displayName,
    companyName: data.companyName,
    alternatePhoneNumber: data.alternatePhoneNumber,
  });

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(values);
  };

  return (
    <form onSubmit={handleSubmit} className="wizard-step">
      <h2>Contact & Organization Info</h2>

      <input
        required
        name="phoneNumber"
        placeholder="Phone number"
        value={values.phoneNumber}
        onChange={handleChange}
      />
      <input
        name="alternatePhoneNumber"
        placeholder="Alternate phone number (optional)"
        value={values.alternatePhoneNumber}
        onChange={handleChange}
      />
      <input
        required
        name="displayName"
        placeholder="Display name"
        value={values.displayName}
        onChange={handleChange}
      />
      <input
        required
        name="companyName"
        placeholder="Company name"
        value={values.companyName}
        onChange={handleChange}
      />

      <div className="wizard-actions">
        <button type="button" onClick={onBack}>Back</button>
        <button type="submit">Next</button>
      </div>
    </form>
  );
}