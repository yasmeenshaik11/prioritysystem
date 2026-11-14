import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FilePlus, 
  MapPin, 
  Upload, 
  BrainCircuit, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Image as ImageIcon,
  Sparkles,
  Info
} from 'lucide-react';
import api from '../services/api';

const CATEGORY_CHOICES = [
  'Auto-Detect with AI (Recommended)',
  'Potholes',
  'Garbage',
  'Water Leakage',
  'Drainage',
  'Streetlights',
  'Accidents',
  'Fallen Trees',
  'Others'
];

export default function NewComplaint() {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Auto-Detect with AI (Recommended)',
    description: '',
    reported_location: '',
    latitude: '',
    longitude: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [aiResult, setAiResult] = useState(null);

  const navigate = useNavigate();

  const handleField = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        alert('Image must be under 15MB.');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const fetchGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6)
        }));
        setLocating(false);
      },
      (err) => {
        console.warn('GPS Error:', err);
        alert('Could not determine your GPS location. Please enter area name manually.');
        setLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.description.trim()) {
      setError('Please provide a detailed description of the complaint.');
      return;
    }

    setSubmitting(true);
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    
    if (formData.category !== 'Auto-Detect with AI (Recommended)') {
      data.append('category', formData.category);
    }
    data.append('reported_location', formData.reported_location);
    if (formData.latitude) data.append('latitude', formData.latitude);
    if (formData.longitude) data.append('longitude', formData.longitude);
    if (imageFile) data.append('image', imageFile);

    try {
      const res = await api.post('/complaints', data);
      setAiResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit complaint. Please check connection.');
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Grievance Submission
        </span>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px' }}>
          Report a Public Issue
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.92rem' }}>
          Provide incident details. Our NLP engine will categorize the issue, evaluate public hazard urgency, and dispatch to authorities.
        </p>
      </div>

      <div className="submission-layout">
        {/* Left Column: Form */}
        <div>
          {error && <div className="auth-alert error" style={{ marginBottom: 20 }}>{error}</div>}

          {aiResult ? (
            <div className="card" style={{ border: '2px solid #38bdf8', padding: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Complaint Successfully Triaged!
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Complaint Code: <b>{aiResult.complaint.complaint_code}</b>
                  </span>
                </div>
              </div>

              <div className="ai-result-display">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>
                      AI Priority Rating
                    </span>
                    <div className="ai-score-large">{aiResult.ai.urgency_score} / 100</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${aiResult.ai.priority.toLowerCase()}`} style={{ fontSize: '0.95rem', padding: '6px 14px' }}>
                      {aiResult.ai.priority} Severity
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '14px 0', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', marginBottom: 14 }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Predicted Category:</span>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{aiResult.ai.category}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Assigned Department:</span>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{aiResult.ai.department}</div>
                  </div>
                </div>

                <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.5 }}>
                  <b>AI Assessment:</b> {aiResult.ai.explanation}
                </p>

                {aiResult.ai.duplicate_id && (
                  <div style={{ marginTop: 14, padding: 12, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: '0.85rem', color: '#92400e' }}>
                    <b>Notice:</b> A similar issue (#{aiResult.ai.duplicate_id}) was previously reported in this area (Similarity: {Math.round(aiResult.ai.duplicate_score * 100)}%). Both reports are linked for coordinated municipal action.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate(`/complaints/${aiResult.complaint.id}`)}
                >
                  <span>View Complaint File</span>
                  <ArrowRight size={16} />
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={() => {
                    setAiResult(null);
                    setFormData({
                      title: '',
                      category: 'Auto-Detect with AI (Recommended)',
                      description: '',
                      reported_location: '',
                      latitude: '',
                      longitude: ''
                    });
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                >
                  Submit Another Grievance
                </button>
              </div>
            </div>
          ) : (
            <form className="card" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Complaint Title / Summary</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Broken water pipeline flooding road near hospital"
                  value={formData.title}
                  onChange={(e) => handleField('title', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select 
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => handleField('category', e.target.value)}
                >
                  {CATEGORY_CHOICES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="form-helper">
                  Leave on "Auto-Detect with AI" to let our NLP engine classify based on description.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Description *</label>
                <textarea 
                  rows="6"
                  className="form-textarea"
                  placeholder="Describe the issue in detail: what happened, exact location, public hazard or safety risks, nearby schools, hospitals or high traffic conditions..."
                  value={formData.description}
                  onChange={(e) => handleField('description', e.target.value)}
                  required
                />
              </div>

              {/* Photo Upload */}
              <div className="form-group">
                <label className="form-label">Attach Site Photo Evidence</label>
                <div 
                  className="image-upload-dropzone"
                  onClick={() => document.getElementById('complaint-photo-input').click()}
                >
                  <input 
                    id="complaint-photo-input"
                    type="file" 
                    accept="image/jpeg,image/png,image/webp" 
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <Upload size={28} color="#0284c7" />
                    <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>
                      {imageFile ? imageFile.name : 'Click or drop site image here'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Supports JPG, PNG, WEBP (Max 15MB)
                    </span>
                  </div>

                  {imagePreview && (
                    <img 
                      src={imagePreview} 
                      alt="Upload preview" 
                      className="uploaded-preview-img" 
                    />
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="form-group">
                <label className="form-label">Area / Landmark</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Ward 12, Road No 36 near Metro Station"
                  value={formData.reported_location}
                  onChange={(e) => handleField('reported_location', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">GPS Coordinates</label>
                <div className="location-input-group">
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Latitude (e.g. 17.4375)"
                    value={formData.latitude}
                    onChange={(e) => handleField('latitude', e.target.value)}
                  />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Longitude (e.g. 78.4483)"
                    value={formData.longitude}
                    onChange={(e) => handleField('longitude', e.target.value)}
                  />
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={fetchGPS}
                    disabled={locating}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    <MapPin size={16} />
                    <span>{locating ? 'Locating…' : 'Use My GPS'}</span>
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '12px', fontSize: '1rem', marginTop: 10 }}
                disabled={submitting}
              >
                <Sparkles size={18} />
                <span>{submitting ? 'Analyzing & Filing Issue…' : 'Submit Grievance with AI Triage'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Right Column: AI Triage Assistant Overview */}
        <div>
          <div className="card ai-engine-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <BrainCircuit size={26} color="#0284c7" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Explainable AI Engine
              </h3>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.5, marginBottom: 18 }}>
              Upon submission, our Scikit-Learn NLP pipeline processes your text against verified civic hazard models:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: '#ffffff', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <b style={{ fontSize: '0.85rem', color: '#0284c7' }}>Category Classification:</b>
                <p style={{ fontSize: '0.8rem', color: '#475569', margin: '4px 0 0' }}>
                  Potholes, Garbage, Water Leakage, Drainage, Streetlights, Accidents, Fallen Trees, Others.
                </p>
              </div>

              <div style={{ background: '#ffffff', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <b style={{ fontSize: '0.85rem', color: '#0284c7' }}>Urgency & Severity Scoring (1–100):</b>
                <p style={{ fontSize: '0.8rem', color: '#475569', margin: '4px 0 0' }}>
                  Calculated using danger keywords (e.g., school, hospital, electrocution, flood, blocked road).
                </p>
              </div>

              <div style={{ background: '#ffffff', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <b style={{ fontSize: '0.85rem', color: '#0284c7' }}>Smart Routing:</b>
                <p style={{ fontSize: '0.8rem', color: '#475569', margin: '4px 0 0' }}>
                  Routes directly to Roads & Infrastructure, Sanitation, Water Board, Electrical, or Emergency Response.
                </p>
              </div>
            </div>

            <div style={{ marginTop: 22, padding: 12, background: 'rgba(2, 132, 199, 0.08)', borderRadius: 8, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Info size={18} color="#0284c7" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: '0.78rem', color: '#0f172a' }}>
                Providing accurate landmark details and clear photo evidence boosts the AI confidence score and speeds up dispatch.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
