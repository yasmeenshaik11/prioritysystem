import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FilePlus, 
  Search, 
  Filter, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  ChevronRight,
  TrendingUp,
  MapPin,
  Eye
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints/my');
      setComplaints(res.data || []);
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const counts = {
    total: complaints.length,
    pending: complaints.filter(c => !['Resolved', 'Rejected'].includes(c.status)).length,
    criticalHigh: complaints.filter(c => ['Critical', 'High'].includes(c.priority) && !['Resolved', 'Rejected'].includes(c.status)).length,
    resolved: complaints.filter(c => c.status === 'Resolved').length
  };

  const filtered = complaints.filter(c => {
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const term = search.toLowerCase();
    const matchesSearch = !search || 
      c.complaint_code.toLowerCase().includes(term) ||
      (c.title && c.title.toLowerCase().includes(term)) ||
      (c.description && c.description.toLowerCase().includes(term)) ||
      (c.ai_category && c.ai_category.toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      {/* Header Banner */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: 16, 
        marginBottom: 28 
      }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Citizen Grievance Portal
          </span>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px' }}>
            Welcome back, {user?.name}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.92rem' }}>
            Location: <b>{user?.area || 'Municipal Ward'}</b> • Track your filed complaints and real-time AI triage status.
          </p>
        </div>

        <Link to="/citizen/new" className="btn btn-primary">
          <FilePlus size={18} />
          <span>Report New Public Issue</span>
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid" id="kpis">
        <div className="kpi-card blue">
          <div className="kpi-info">
            <span>Total Reported</span>
            <h2>{counts.total}</h2>
          </div>
          <div className="kpi-icon-wrap">
            <TrendingUp size={26} />
          </div>
        </div>

        <div className="kpi-card amber">
          <div className="kpi-info">
            <span>In Triage / Action</span>
            <h2>{counts.pending}</h2>
          </div>
          <div className="kpi-icon-wrap">
            <Clock size={26} />
          </div>
        </div>

        <div className="kpi-card red">
          <div className="kpi-info">
            <span>Critical / High Urgency</span>
            <h2>{counts.criticalHigh}</h2>
          </div>
          <div className="kpi-icon-wrap">
            <AlertCircle size={26} />
          </div>
        </div>

        <div className="kpi-card green">
          <div className="kpi-info">
            <span>Resolved</span>
            <h2>{counts.resolved}</h2>
          </div>
          <div className="kpi-icon-wrap">
            <CheckCircle2 size={26} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div className="filter-bar">
          <div className="search-input-wrap">
            <Search size={18} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search by ID, keyword, category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-controls">
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Status:</span>
            <select 
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Complaint Code</th>
                <th>Category</th>
                <th>AI Priority</th>
                <th>Urgency Score</th>
                <th>Department</th>
                <th>Status</th>
                <th>Date Filed</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    Loading complaints file…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '42px', color: '#64748b' }}>
                    {complaints.length === 0 ? (
                      <div>
                        <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>No complaints submitted yet</p>
                        <p style={{ fontSize: '0.88rem' }}>Report any civic issue in your ward to receive AI-assisted priority dispatch.</p>
                        <Link to="/citizen/new" className="btn btn-primary" style={{ marginTop: 14 }}>
                          <FilePlus size={16} />
                          <span>Submit First Complaint</span>
                        </Link>
                      </div>
                    ) : (
                      'No complaints match your filter criteria.'
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="complaint-code-cell">{c.complaint_code}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.ai_category || c.category}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                      <span style={{ fontSize: '0.85rem', color: '#334155' }}>{c.department}</span>
                    </td>
                    <td>
                      <span className={`status-pill ${c.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        {new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/complaints/${c.id}`} className="btn btn-outline btn-sm">
                        <Eye size={15} />
                        <span>View File</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
