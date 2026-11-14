import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  FilePlus, 
  ListFilter, 
  MapPin, 
  BarChart3, 
  Bell, 
  LogOut, 
  Menu, 
  X, 
  CheckCheck,
  ChevronRight,
  ExternalLink,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const isOfficer = user?.role === 'officer' || user?.role === 'admin';

  // Fetch real-time notifications
  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      // Silently handle if unauthenticated or network drop
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id, complaintId) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      if (complaintId) {
        setBellOpen(false);
        navigate(`/complaints/${complaintId}`);
      }
    } catch (e) {}
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {}
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Close sidebar on navigation on mobile
  useEffect(() => {
    setSidebarOpen(false);
    setBellOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-layout">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 95
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`app-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand-icon">
            <ShieldCheck size={26} />
          </div>
          <div className="sidebar-brand-text">
            <h2>CIVIC PULSE</h2>
            <span>Smart Complaint AI</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Navigation</div>

          {isOfficer ? (
            <>
              <Link 
                to="/officer" 
                className={`sidebar-link ${location.pathname === '/officer' ? 'active' : ''}`}
              >
                <LayoutDashboard size={19} />
                <span>Command Overview</span>
              </Link>
            </>
          ) : (
            <>
              <Link 
                to="/citizen" 
                className={`sidebar-link ${location.pathname === '/citizen' ? 'active' : ''}`}
              >
                <LayoutDashboard size={19} />
                <span>My Dashboard</span>
              </Link>
              <Link 
                to="/citizen/new" 
                className={`sidebar-link ${location.pathname === '/citizen/new' ? 'active' : ''}`}
              >
                <FilePlus size={19} />
                <span>Report Public Issue</span>
              </Link>
            </>
          )}

          <div className="nav-section-title" style={{ marginTop: 18 }}>System Services</div>
          <a 
            href="#kpis" 
            onClick={(e) => {
              if (location.pathname !== (isOfficer ? '/officer' : '/citizen')) {
                navigate(isOfficer ? '/officer' : '/citizen');
              }
            }}
            className="sidebar-link"
          >
            <BarChart3 size={19} />
            <span>Triage Analytics</span>
          </a>

          {isOfficer && (
            <a 
              href="#map-section" 
              onClick={(e) => {
                if (location.pathname !== '/officer') {
                  navigate('/officer');
                }
              }}
              className="sidebar-link"
            >
              <MapPin size={19} />
              <span>Geospatial Map</span>
            </a>
          )}
        </nav>

        {/* Sidebar Footer with User Details */}
        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-info">
              <h4>{user?.name || 'Authorized User'}</h4>
              <span className={`role-pill ${user?.role || 'citizen'}`}>
                {user?.role || 'Citizen'}
              </span>
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="app-main">
        {/* Top Header Bar */}
        <header className="app-topbar">
          <div className="topbar-left">
            <button 
              className="mobile-toggle-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className="topbar-breadcrumbs">
              <Link to="/">Portal Home</Link>
              <ChevronRight size={14} />
              <span className="current">
                {isOfficer ? 'Authority Command Center' : 'Citizen Grievance Services'}
              </span>
            </div>
          </div>

          <div className="topbar-right">
            <div className="system-status-indicator">
              <span className="status-dot"></span>
              <span>AI Triage Active</span>
            </div>

            {/* Notification Bell */}
            <div className="notification-container">
              <button 
                className="bell-button" 
                onClick={() => setBellOpen(!bellOpen)}
                aria-label="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
              </button>

              {bellOpen && (
                <div className="notification-dropdown">
                  <div className="dropdown-header">
                    <h4>Notifications ({unreadCount})</h4>
                    {unreadCount > 0 && (
                      <button className="mark-all-read-btn" onClick={markAllRead}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="empty-notifications">
                        No notifications yet. You're all caught up!
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className={`notification-item ${!n.is_read ? 'unread' : ''}`}
                          onClick={() => markAsRead(n.id, n.complaint_id)}
                        >
                          <div className="notification-title">{n.title}</div>
                          <div className="notification-msg">{n.message}</div>
                          <div className="notification-time">
                            {new Date(n.created_at).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Container */}
        <main className="page-container">
          {children}
        </main>
      </div>
    </div>
  );
}
