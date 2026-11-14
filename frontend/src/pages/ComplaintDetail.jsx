import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  BrainCircuit, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Upload, 
  UserCheck, 
  ShieldAlert, 
  FileText,
  AlertCircle,
  Camera
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api, { API_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_CHOICES = [
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved',
  'Rejected'
];

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Officer action states
  const [newStatus, setNewStatus] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  // Resolution image state
  const [resFile, setResFile] = useState(null);
  const [resRemarks, setResRemarks] = useState('');
  const [resolving, setResolving] = useState(false);

  const isOfficer = user?.role === 'officer' || user?.role === 'admin';

  const loadComplaint = async () => {
    try {
      const res = await api.get(`/complaints/${id}`);
      setData(res.data);
      setNewStatus(res.data.complaint.status);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load complaint file.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaint();
  }, [id]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setSavingStatus(true);
    try {
      await api.patch(`/officer/complaints/${id}/status`, {
        status: newStatus,
        remarks: statusRemarks
      });
      setStatusRemarks('');
      loadComplaint();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleResolveWithImage = async (e) => {
    e.preventDefault();
    setResolving(true);
    const form = new FormData();
    if (resFile) form.append('image', resFile);
    form.append('remarks', resRemarks || 'Issue verified and resolved on site.');

    try {
      await api.post(`/officer/complaints/${id}/resolution-image`, form);
      setResFile(null);
      setResRemarks('');
      loadComplaint();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit resolution');
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
        Loading complaint record…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ color: '#0f172a' }}>Complaint Not Found</h3>
        <p style={{ color: '#64748b', marginBottom: 20 }}>{error}</p>
        <button className="btn btn-outline" onClick={() => navigate(isOfficer ? '/officer' : '/citizen')}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  const { complaint: c, history } = data;
  const baseUrl = API_URL.replace('/api', '');

  return (
    <div>
      {/* Breadcrumb Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={() => navigate(isOfficer ? '/officer' : '/citizen')}
          style={{ paddingLeft: 0 }}
        >
          <ArrowLeft size={16} />
          <span>Back to {isOfficer ? 'Command Center' : 'My Complaints'}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className={`badge ${(c.priority || 'medium').toLowerCase()}`} style={{ fontSize: '0.88rem', padding: '5px 12px' }}>
            {c.priority} Priority ({c.urgency_score}/100)
          </span>
          <span className={`status-pill ${c.status.toLowerCase().replace(/\s+/g, '-')}`} style={{ fontSize: '0.88rem' }}>
            {c.status}
          </span>
        </div>
      </div>

      <div className="detail-layout">
        {/* Left Column: Complaint & AI File */}
        <div>
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
              <div>
                <span className="complaint-code-cell" style={{ fontSize: '1.05rem', color: '#0284c7' }}>
                  {c.complaint_code}
                </span>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                  {c.title}
                </h2>
              </div>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Filed: {new Date(c.created_at).toLocaleString()}
              </span>
            </div>

            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
                Citizen Description
              </div>
              <p style={{ color: '#1e293b', fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {c.description}
              </p>
            </div>

            {/* AI Triage Card */}
            <div style={{ 
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
              border: '1px solid #bae6fd', 
              borderRadius: 14, 
              padding: 20, 
              marginBottom: 20 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <BrainCircuit size={20} color="#0284c7" />
                <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                  AI Triage & Classification Assessment
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 12 }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Category:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{c.ai_category || c.category}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Severity Level:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{c.ai_severity || c.priority}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Urgency Score:</span>
                  <div style={{ fontWeight: 800, color: '#0284c7', fontSize: '1.1rem' }}>{c.urgency_score} / 100</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Department:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{c.department}</div>
                </div>
              </div>

              {c.remarks && (
                <div style={{ fontSize: '0.85rem', color: '#334155', borderTop: '1px solid #bae6fd', paddingTop: 10 }}>
                  <b>Latest Action Note:</b> {c.remarks}
                </div>
              )}
            </div>

            {/* Site Photos Section */}
            <div style={{ display: 'grid', gridTemplateColumns: c.resolution_image_path ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 20 }}>
              {c.image_path && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                    <Camera size={16} color="#0284c7" />
                    <span>Citizen Incident Evidence</span>
                  </div>
                  <img 
                    src={`${baseUrl}/uploads/${c.image_path}`} 
                    alt="Citizen complaint"
                    style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 12, border: '1px solid #e2e8f0' }}
                  />
                </div>
              )}

              {c.resolution_image_path && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 700, color: '#16a34a', marginBottom: 8 }}>
                    <CheckCircle2 size={16} color="#16a34a" />
                    <span>Official Resolution Proof</span>
                  </div>
                  <img 
                    src={`${baseUrl}/uploads/${c.resolution_image_path}`} 
                    alt="Resolution evidence"
                    style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 12, border: '1px solid #86efac' }}
                  />
                </div>
              )}
            </div>

            {/* Location & Mini Map */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                <MapPin size={16} color="#0284c7" />
                <span>Reported Incident Location: {c.reported_location}</span>
              </div>

              {c.latitude && c.longitude && (
                <div style={{ height: 240, borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <MapContainer 
                    center={[c.latitude, c.longitude]} 
                    zoom={14} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; OpenStreetMap'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[c.latitude, c.longitude]}>
                      <Popup>
                        <b>{c.complaint_code}</b><br/>{c.reported_location}
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Officer Controls */}
        <div>
          {/* Status Timeline */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 className="card-title">
              <span>Status Audit Timeline</span>
            </h3>

            <div className="timeline-box">
              {history && history.length > 0 ? (
                history.map((h, i) => (
                  <div key={h.id || i} className={`timeline-node ${h.new_status === 'Resolved' ? 'resolved' : ''}`}>
                    <div className="timeline-status">
                      <span className={`status-pill ${h.new_status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {h.new_status}
                      </span>
                    </div>
                    <div className="timeline-meta">
                      {new Date(h.created_at).toLocaleString([], {
                        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })} • by <b>{h.changed_by_name}</b>
                    </div>
                    {h.remarks && (
                      <div className="timeline-remarks">
                        {h.remarks}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p style={{ color: '#64748b', fontSize: '0.88rem' }}>No status history recorded.</p>
              )}
            </div>
          </div>

          {/* Officer Action Controls (Visible for Officer / Admin) */}
          {isOfficer && (
            <div className="card" style={{ border: '2px solid #0284c7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <UserCheck size={20} color="#0284c7" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Authority Action Controls
                </h3>
              </div>

              {/* Update Status Form */}
              <form onSubmit={handleStatusUpdate} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #e2e8f0' }}>
                <div className="form-group">
                  <label className="form-label">Update Status</label>
                  <select 
                    className="form-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    {STATUS_CHOICES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Official Note / Action Remarks</label>
                  <textarea 
                    rows="3"
                    className="form-textarea"
                    placeholder="Provide site inspection findings or action updates..."
                    value={statusRemarks}
                    onChange={(e) => setStatusRemarks(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-secondary btn-sm" disabled={savingStatus} style={{ width: '100%' }}>
                  {savingStatus ? 'Saving…' : 'Record Status Transition'}
                </button>
              </form>

              {/* Submit Resolution with Image */}
              <form onSubmit={handleResolveWithImage}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                  Mark Resolved with Photo Proof
                </div>

                <div className="form-group">
                  <input 
                    type="file" 
                    accept="image/*"
                    className="form-input"
                    onChange={(e) => setResFile(e.target.files?.[0] || null)}
                  />
                  <div className="form-helper">Upload photo of repaired pothole, cleared garbage, etc.</div>
                </div>

                <div className="form-group">
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="Resolution closing summary"
                    value={resRemarks}
                    onChange={(e) => setResRemarks(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary btn-sm" 
                  style={{ width: '100%', background: '#16a34a' }}
                  disabled={resolving}
                >
                  <CheckCircle2 size={16} />
                  <span>{resolving ? 'Submitting…' : 'Confirm Resolution & Close'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
