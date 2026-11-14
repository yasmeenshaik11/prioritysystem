import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Search, 
  Filter, 
  UserPlus, 
  Edit3, 
  Eye, 
  MapPin, 
  TrendingUp, 
  Layers, 
  RefreshCw,
  XCircle,
  FileCheck2
} from 'lucide-react';
import api from '../services/api';

const PRIORITY_COLORS = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#10b981'
};

const CATEGORIES_LIST = [
  'Potholes', 'Garbage', 'Water Leakage', 'Drainage', 
  'Streetlights', 'Accidents', 'Fallen Trees', 'Others'
];

const STATUSES_LIST = [
  'Submitted', 'Under Review', 'Assigned', 
  'In Progress', 'Resolved', 'Rejected'
];

export default function OfficerDashboard() {
  const [kpis, setKpis] = useState({});
  const [complaints, setComplaints] = useState([]);
  const [analytics, setAnalytics] = useState({ category: [], priority: [], status: [], avg_urgency: 0 });
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    priority: '',
    category: '',
    status: '',
    search: ''
  });

  // Modals state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modalType, setModalType] = useState(null); // 'status' or 'assign'
  const [newStatus, setNewStatus] = useState('In Progress');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadData = async () => {
    try {
      const [kRes, aRes, sRes, cRes] = await Promise.all([
        api.get('/officer/dashboard'),
        api.get('/officer/analytics'),
        api.get('/officer/staff'),
        api.get('/officer/complaints', { params: filters })
      ]);
      setKpis(kRes.data || {});
      setAnalytics(aRes.data || { category: [], priority: [], status: [] });
      setStaff(sRes.data || []);
      setComplaints(cRes.data || []);
      if (sRes.data?.length > 0 && !selectedStaffId) {
        setSelectedStaffId(sRes.data[0].id);
      }
    } catch (err) {
      console.error('Error loading officer dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters.priority, filters.category, filters.status]);

  // Debounced search trigger
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenStatusModal = (complaint) => {
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status);
    setStatusRemarks(complaint.remarks || '');
    setModalType('status');
  };

  const handleOpenAssignModal = (complaint) => {
    setSelectedComplaint(complaint);
    setSelectedStaffId(complaint.assigned_to || (staff[0]?.id || ''));
    setModalType('assign');
  };

  const handleSaveStatus = async () => {
    if (!selectedComplaint) return;
    setUpdating(true);
    try {
      await api.patch(`/officer/complaints/${selectedComplaint.id}/status`, {
        status: newStatus,
        remarks: statusRemarks
      });
      setModalType(null);
      loadData();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveAssign = async () => {
    if (!selectedComplaint || !selectedStaffId) return;
    setUpdating(true);
    try {
      await api.patch(`/officer/complaints/${selectedComplaint.id}/assign`, {
        officer_id: selectedStaffId
      });
      setModalType(null);
      loadData();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to assign officer');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      {/* Top Title Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 26 }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Officer Command Center
          </span>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px' }}>
            AI-Prioritized Complaint Queue
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.92rem' }}>
            Real-time multi-hazard triage sorted by AI urgency score. Filter, reassign, update status, and track field teams.
          </p>
        </div>

        <button className="btn btn-outline" onClick={loadData} title="Refresh data">
          <RefreshCw size={16} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid" id="kpis">
        <div className="kpi-card blue">
          <div className="kpi-info">
            <span>Total Logged</span>
            <h2>{kpis.total || 0}</h2>
          </div>
          <div className="kpi-icon-wrap">
            <Layers size={26} />
          </div>
        </div>

        <div className="kpi-card amber">
          <div className="kpi-info">
            <span>Active Queue</span>
            <h2>{kpis.pending || 0}</h2>
          </div>
          <div className="kpi-icon-wrap">
            <Clock size={26} />
          </div>
        </div>

        <div className="kpi-card red">
          <div className="kpi-info">
            <span>Critical Emergencies</span>
            <h2>{kpis.critical || 0}</h2>
          </div>
          <div className="kpi-icon-wrap">
            <AlertTriangle size={26} />
          </div>
        </div>

        <div className="kpi-card green">
          <div className="kpi-info">
            <span>Resolved ({kpis.resolution_rate || 0}%)</span>
            <h2>{kpis.resolved || 0}</h2>
          </div>
          <div className="kpi-icon-wrap">
            <CheckCircle2 size={26} />
          </div>
        </div>
      </div>

      {/* Main Card: Queue Table & Filter */}
      <div className="card" style={{ marginBottom: 32 }}>
        <div className="card-title">
          <span>Priority Triage Queue</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>
            Showing {complaints.length} issues
          </span>
        </div>

        {/* Filter Controls */}
        <div className="filter-bar">
          <form onSubmit={handleSearchSubmit} className="search-input-wrap">
            <Search size={18} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search code, title, citizen, area…"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </form>

          <div className="filter-controls">
            <select 
              className="filter-select"
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            >
              <option value="">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select 
              className="filter-select"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">All Categories</option>
              {CATEGORIES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select 
              className="filter-select"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              {STATUSES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Priority Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Complaint Code</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Assigned Officer</th>
                <th>Citizen & Area</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    Loading priority queue…
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No complaints match current filter selections.
                  </td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="complaint-code-cell">{c.complaint_code}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.ai_category || c.category}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.title}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${(c.priority || 'medium').toLowerCase()}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td>
                      <div className="urgency-badge">
                        <span>{c.urgency_score}</span>
                        <div className="urgency-meter">
                          <div 
                            className="urgency-meter-fill" 
                            style={{ 
                              width: `${c.urgency_score}%`,
                              background: c.urgency_score >= 80 ? '#ef4444' : c.urgency_score >= 60 ? '#f97316' : c.urgency_score >= 35 ? '#eab308' : '#10b981'
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${c.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: '#334155' }}>
                        {c.assigned_officer_name || <i style={{ color: '#94a3b8' }}>Unassigned</i>}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{c.citizen_name || 'Citizen'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.citizen_area || c.reported_location}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => handleOpenStatusModal(c)}
                          title="Update Status"
                        >
                          <Edit3 size={14} />
                          <span>Status</span>
                        </button>
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => handleOpenAssignModal(c)}
                          title="Assign Staff"
                        >
                          <UserPlus size={14} />
                          <span>Assign</span>
                        </button>
                        <Link 
                          to={`/complaints/${c.id}`}
                          className="btn btn-secondary btn-sm"
                          title="Full File"
                        >
                          <Eye size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24, marginBottom: 32 }}>
        <div className="card">
          <div className="card-title">
            <span>Complaints by Category</span>
          </div>
          <div style={{ height: 280, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.category} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} height={60} tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <span>Priority Distribution</span>
          </div>
          <div style={{ height: 280, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={analytics.priority} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={50}
                  outerRadius={85} 
                  paddingAngle={4}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {analytics.priority.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={PRIORITY_COLORS[entry.name] || '#64748b'} 
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Geospatial Map Section */}
      <div className="card" id="map-section" style={{ marginBottom: 32 }}>
        <div className="card-title">
          <span>Geospatial Incident Map</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#64748b' }}>
            Color-coded: Red (Critical), Orange (High), Yellow (Medium), Green (Low)
          </span>
        </div>

        <div style={{ height: 420, borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <MapContainer 
            center={[17.4065, 78.4772]} 
            zoom={12} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {complaints.filter(c => c.latitude && c.longitude).map((c) => {
              const color = PRIORITY_COLORS[c.priority] || '#0284c7';
              return (
                <CircleMarker
                  key={c.id}
                  center={[c.latitude, c.longitude]}
                  radius={c.priority === 'Critical' ? 11 : c.priority === 'High' ? 9 : 7}
                  fillColor={color}
                  color="#ffffff"
                  weight={2}
                  opacity={1}
                  fillOpacity={0.85}
                >
                  <Popup>
                    <div style={{ padding: 4, minWidth: 180 }}>
                      <span className={`badge ${(c.priority || 'medium').toLowerCase()}`} style={{ marginBottom: 6 }}>
                        {c.priority} Priority ({c.urgency_score}/100)
                      </span>
                      <h4 style={{ margin: '4px 0', fontSize: '0.95rem', color: '#0f172a' }}>{c.ai_category || c.category}</h4>
                      <p style={{ fontSize: '0.8rem', color: '#475569', margin: '4px 0 8px' }}>{c.reported_location}</p>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 8 }}>Status: <b>{c.status}</b></div>
                      <Link to={`/complaints/${c.id}`} style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0284c7' }}>
                        View Full Complaint File →
                      </Link>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* Modal: Update Status */}
      {modalType === 'status' && selectedComplaint && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
              Update Complaint Status
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 18 }}>
              Complaint Code: <b>{selectedComplaint.complaint_code}</b>
            </p>

            <div className="form-group">
              <label className="form-label">New Status</label>
              <select 
                className="form-select"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {STATUSES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Officer Remarks / Audit Note</label>
              <textarea 
                rows="4"
                className="form-textarea"
                placeholder="Enter actions taken, field team dispatched, or resolution details..."
                value={statusRemarks}
                onChange={(e) => setStatusRemarks(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={() => setModalType(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveStatus} disabled={updating}>
                {updating ? 'Saving…' : 'Save Status Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Assign Staff */}
      {modalType === 'assign' && selectedComplaint && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
              Assign Field Officer
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 18 }}>
              Assign <b>{selectedComplaint.complaint_code}</b> ({selectedComplaint.ai_category}) to municipal officer:
            </p>

            <div className="form-group">
              <label className="form-label">Select Officer</label>
              <select 
                className="form-select"
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
              >
                {staff.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.name} — {o.department} ({o.employee_code})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={() => setModalType(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveAssign} disabled={updating}>
                {updating ? 'Assigning…' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
