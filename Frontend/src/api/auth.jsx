
const BASE_URL = import.meta.env.VITE_API_URL ;

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export async function loginUser(credentials) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(credentials),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(data?.msg || 'Login failed');
    error.response = { data, status: res.status };
    throw error;
  }

  return { data, status: res.status };
}

export async function signupParticipant(formData) {
  const res = await fetch(`${BASE_URL}/auth/participant-signup`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(formData),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(data?.msg || 'Signup failed');
    error.response = { data, status: res.status };
    throw error;
  }

  return { data, status: res.status };
}

export async function signupOrganizer(formData) {
  const res = await fetch(`${BASE_URL}/auth/organizerSignup`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(formData),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(data?.msg || 'Signup failed');
    error.response = { data, status: res.status };
    throw error;
  }

  return { data, status: res.status };
}