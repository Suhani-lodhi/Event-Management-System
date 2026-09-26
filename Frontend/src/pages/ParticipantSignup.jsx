import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signupParticipant } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
};

export default function ParticipantSignup() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await signupParticipant(form);
      login(res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Create your account</h2>

        <input
          required
          name="firstName"
          placeholder="First name"
          value={form.firstName}
          onChange={handleChange}
        />
        <input
          required
          name="lastName"
          placeholder="Last name"
          value={form.lastName}
          onChange={handleChange}
        />
        <input
          required
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />
        <input
          required
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>

        <p>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
        <p>
          Want to host events? <Link to="/signup/organizer">Sign up as organizer</Link>
        </p>
      </form>
    </div>
  );
}