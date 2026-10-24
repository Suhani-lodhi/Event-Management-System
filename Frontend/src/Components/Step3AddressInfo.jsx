import { useState } from 'react';

export default function Step3AddressInfo({ data, onNext, onBack }) {
  const [values, setValues] = useState({
    addressLine1: data.addressLine1,
    city: data.city,
    state: data.state,
    country: data.country,
    pincode: data.pincode,
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
      <h2>Address Info</h2>

      <input
        required
        name="addressLine1"
        placeholder="Address line 1"
        value={values.addressLine1}
        onChange={handleChange}
      />
      <input
        required
        name="city"
        placeholder="City"
        value={values.city}
        onChange={handleChange}
      />
      <input
        required
        name="state"
        placeholder="State"
        value={values.state}
        onChange={handleChange}
      />
      <input
        required
        name="country"
        placeholder="Country"
        value={values.country}
        onChange={handleChange}
      />
      <input
        required
        name="pincode"
        placeholder="Pincode"
        value={values.pincode}
        onChange={handleChange}
      />

      <div className="wizard-actions">
        <button type="button" onClick={onBack}>Back</button>
        <button type="submit">Next</button>
      </div>
    </form>
  );
}