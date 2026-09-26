import { useState } from 'react';

export default function Step1AccountInfo({ data, onNext }) {
  const [values, setValues] = useState({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    password: data.password,
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (values.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    onNext(values);
  };

  return (
    <form onSubmit={handleSubmit} className="wizard-step">
      <h2>Account Info</h2>

      <input
        required
        name="firstName"
        placeholder="First name"
        value={values.firstName}
        onChange={handleChange}
      />
      <input
        required
        name="lastName"
        placeholder="Last name"
        value={values.lastName}
        onChange={handleChange}
      />
      <input
        required
        type="email"
        name="email"
        placeholder="Email"
        value={values.email}
        onChange={handleChange}
      />
      <input
        required
        type="password"
        name="password"
        placeholder="Password"
        value={values.password}
        onChange={handleChange}
      />

      {error && <p className="error">{error}</p>}

      <div className="wizard-actions">
        <button type="submit">Next</button>
      </div>
    </form>
  );
}