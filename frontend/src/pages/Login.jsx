import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login({ role: initialRole }) {
  const [selectedRole, setSelectedRole] = useState(initialRole || 'citizen');
  const [email, setEmail] = useState('citizen@emergencyai.com');
  const [password, setPassword] = useState('Citizen@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (initialRole) {
      setSelectedRole(initialRole);
    }
  }, [initialRole]);

  // Adjust default credentials when tab switches
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError('');
    if (role === 'citizen') {
      setEmail('citizen@emergencyai.com');
      setPassword('Citizen@123');
    } else if (role === 'officer') {
      setEmail('officer@emergencyai.com');
      setPassword('Officer@123');
    } else if (role === 'admin') {
      setEmail('admin@emergencyai.com');
      setPassword('Admin@123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'officer' || user.role === 'admin') {
        navigate('/officer');
      } else {
        navigate('/citizen');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <ShieldCheck size={30} />
          </div>
          <h2>Civic Pulse Portal</h2>
          <p>AI Complaint Priority & Urgency Management</p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="role-tabs">
          <button 
            type="button" 
            className={`role-tab-btn ${selectedRole === 'citizen' ? 'active' : ''}`}
            onClick={() => handleRoleSelect('citizen')}
          >
            Citizen
          </button>
          <button 
            type="button" 
            className={`role-tab-btn ${selectedRole === 'officer' ? 'active' : ''}`}
            onClick={() => handleRoleSelect('officer')}
          >
            Officer
          </button>
          <button 
            type="button" 
            className={`role-tab-btn ${selectedRole === 'admin' ? 'active' : ''}`}
            onClick={() => handleRoleSelect('admin')}
          >
            Admin
          </button>
        </div>

        {error && <div className="auth-alert error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="email" 
                className="form-input" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="name@domain.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? 'Authenticating…' : `Sign In as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Demo Quick-Fill Pill */}
        <div className="demo-credentials-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
            <UserCheck size={16} color="#0284c7" />
            <span>Preset Demo Login:</span>
          </div>
          <div style={{ marginTop: 4 }}>
            <b>{email}</b> / <b>{password}</b>
          </div>
        </div>

        {selectedRole === 'citizen' && (
          <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.88rem', color: '#64748b' }}>
            New to Civic Pulse?{' '}
            <Link to="/register" style={{ fontWeight: 700, color: '#0284c7' }}>
              Create Citizen Account
            </Link>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <Link to="/" style={{ fontSize: '0.82rem', color: '#64748b' }}>
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
