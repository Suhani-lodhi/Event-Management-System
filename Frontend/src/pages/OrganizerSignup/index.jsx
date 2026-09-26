import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Step1AccountInfo from '../../Components/Step1AccountInfo';
import Step2ContactInfo from '../../Components/Step2ContactPage';
import Step3AddressInfo from '../../Components/Step3AddressInfo';
import Step4Review from '../../Components/Step4Review';
import StepIndicator from '../../Components/StepIndicator';
import { signupOrganizer } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

const STORAGE_KEY = 'organizerSignupDraft';

const initialData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phoneNumber: '',
  alternatePhoneNumber: '',
  displayName: '',
  companyName: '',
  addressLine1: '',
  city: '',
  state: '',
  country: '',
  pincode: '',
};

function loadDraft() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? { ...initialData, ...JSON.parse(saved) } : initialData;
  } catch {
    return initialData;
  }
}

export default function OrganizerSignup() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(loadDraft);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // persist progress so a refresh mid-wizard doesn't lose data
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const updateData = (fields) => setFormData((prev) => ({ ...prev, ...fields }));
  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const payload = { ...formData, pincode: parseInt(formData.pincode, 10) };
      const res = await signupOrganizer(payload);
      login(res.data.token);
      sessionStorage.removeItem(STORAGE_KEY);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="wizard-card">
        <StepIndicator current={step} total={4} />

        {step === 1 && (
          <Step1AccountInfo
            data={formData}
            onNext={(fields) => { updateData(fields); next(); }}
          />
        )}
        {step === 2 && (
          <Step2ContactInfo
            data={formData}
            onNext={(fields) => { updateData(fields); next(); }}
            onBack={back}
          />
        )}
        {step === 3 && (
          <Step3AddressInfo
            data={formData}
            onNext={(fields) => { updateData(fields); next(); }}
            onBack={back}
          />
        )}
        {step === 4 && (
          <Step4Review
            data={formData}
            onSubmit={handleSubmit}
            onBack={back}
            error={error}
            loading={loading}
          />
        )}

        <p>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}