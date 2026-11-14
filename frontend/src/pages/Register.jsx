import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, User, Mail, Phone, MapPin, Lock } from 'lucide-react';
import api from '../services/api';

export default function Register() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    area: '',
    password: '',
    confirm_password: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register', {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        area: formData.area,
        password: formData.password
      });

      setSuccess('Citizen registration successful! Redirecting to login…');
      setTimeout(() => {
        navigate('/login/citizen');
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container" style={{ maxWidth: 520 }}>
        <div className="auth-header">
          <div className="auth-logo-badge">
            <ShieldCheck size={30} />
          </div>
          <h2>Create Citizen Profile</h2>
          <p>Register to submit grievances and track live AI triage</p>
        </div>

        {error && <div className="auth-alert error">{error}</div>}
        {success && <div className="auth-alert success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              name="full_name"
              type="text" 
              className="form-input" 
              value={formData.full_name} 
              onChange={handleChange} 
              required 
              placeholder="e.g. Shaik Citizen"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                name="email"
                type="email" 
                className="form-input" 
                value={formData.email} 
                onChange={handleChange} 
                required 
                placeholder="citizen@domain.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input 
                name="phone"
                type="tel" 
                className="form-input" 
                value={formData.phone} 
                onChange={handleChange} 
                placeholder="+91 9876543210"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Residential Ward / Area</label>
            <input 
              name="area"
              type="text" 
              className="form-input" 
              value={formData.area} 
              onChange={handleChange} 
              placeholder="e.g. Banjara Hills, Ward 98, Hyderabad"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                name="password"
                type="password" 
                className="form-input" 
                value={formData.password} 
                onChange={handleChange} 
                required 
                placeholder="Min 6 characters"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input 
                name="confirm_password"
                type="password" 
                className="form-input" 
                value={formData.confirm_password} 
                onChange={handleChange} 
                required 
                placeholder="Re-enter password"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? 'Creating Profile…' : 'Register Citizen Account'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.88rem', color: '#64748b' }}>
          Already registered?{' '}
          <Link to="/login/citizen" style={{ fontWeight: 700, color: '#0284c7' }}>
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
