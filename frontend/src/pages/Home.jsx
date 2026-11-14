import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  BrainCircuit, 
  MapPin, 
  Activity, 
  ArrowRight, 
  Layers, 
  AlertTriangle, 
  Trash2, 
  Droplet, 
  Waves, 
  Lightbulb, 
  Car, 
  Trees, 
  HelpCircle,
  Clock,
  CheckCircle2,
  Lock
} from 'lucide-react';

const CATEGORY_ITEMS = [
  { name: 'Potholes', desc: 'Road damage, craters, asphalt cracks', icon: <Layers size={22} />, color: '#0284c7' },
  { name: 'Garbage', desc: 'Solid waste, dump accumulation, litter', icon: <Trash2 size={22} />, color: '#16a34a' },
  { name: 'Water Leakage', desc: 'Pipe bursts, drinking water loss, pressure', icon: <Droplet size={22} />, color: '#0ea5e9' },
  { name: 'Drainage', desc: 'Sewage overflow, manholes, waterlogging', icon: <Waves size={22} />, color: '#d97706' },
  { name: 'Streetlights', desc: 'Outages, damaged poles, dark roads', icon: <Lightbulb size={22} />, color: '#eab308' },
  { name: 'Accidents', desc: 'Road collisions, injuries, emergencies', icon: <Car size={22} />, color: '#dc2626' },
  { name: 'Fallen Trees', desc: 'Uprooted trees, blocked routes, debris', icon: <Trees size={22} />, color: '#059669' },
  { name: 'Others', desc: 'Encroachments, public nuisances, civic', icon: <HelpCircle size={22} />, color: '#64748b' },
];

export default function Home() {
  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: '24px 20px 60px' }}>
      {/* Top Navbar */}
      <header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '16px 0 28px',
        borderBottom: '1px solid #e2e8f0',
        marginBottom: 32
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ 
            width: 44, 
            height: 44, 
            background: 'linear-gradient(135deg, #0284c7, #0369a1)', 
            borderRadius: 12, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#fff',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
          }}>
            <ShieldCheck size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>CIVIC PULSE</h2>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              AI-Powered Complaint Priority System
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/login/citizen" className="btn btn-outline btn-sm">
            Citizen Login
          </Link>
          <Link to="/login/officer" className="btn btn-secondary btn-sm">
            Officer / Admin Portal
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="landing-hero">
        <div>
          <div className="hero-pill">
            <BrainCircuit size={16} />
            <span>AI Triage & Urgency Scoring Platform</span>
          </div>
          <h1>Civic Grievances Triaged at the Speed of AI.</h1>
          <p>
            An intelligent municipal response system that analyzes complaint text and photo evidence in real time, 
            predicting urgency (1–100), severity, category, and dispatching to responsible zonal departments automatically.
          </p>

          <div className="hero-cta-buttons">
            <Link to="/login/citizen" className="btn btn-primary" style={{ padding: '14px 24px', fontSize: '1.02rem' }}>
              <span>Submit Grievance</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/login/officer" className="btn btn-secondary" style={{ padding: '14px 24px', fontSize: '1.02rem' }}>
              <Lock size={18} />
              <span>Authority Dashboard</span>
            </Link>
          </div>
        </div>

        <div className="hero-feature-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Activity size={24} color="#38bdf8" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
              Live AI Assessment Core
            </span>
          </div>
          <h3>Multi-Signal Complaint Triage</h3>
          <p>
            Our NLP model parses citizen descriptions for safety hazards, life threats, and impact scope to prioritize emergency issues first.
          </p>

          <div className="hero-stats-row">
            <div className="hero-stat-item">
              <h4>8</h4>
              <span>Categories</span>
            </div>
            <div className="hero-stat-item">
              <h4>1–100</h4>
              <span>Urgency Score</span>
            </div>
            <div className="hero-stat-item">
              <h4>100%</h4>
              <span>Auditable</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Flowchart */}
      <section style={{ marginBottom: 54 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Workflow Pipeline
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
            How AI Powers Fast Public Resolution
          </h2>
        </div>

        <div className="features-grid">
          <div className="feature-box">
            <div className="feature-icon-box">
              <MapPin size={26} />
            </div>
            <h3>1. Citizen Submission</h3>
            <p>
              Citizens submit issue details with photos and exact GPS coordinates directly from their browser or smartphone.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon-box">
              <BrainCircuit size={26} />
            </div>
            <h3>2. NLP & AI Urgency Scoring</h3>
            <p>
              Scikit-Learn NLP evaluates descriptions for life danger, public scale, and keywords, assigning a priority score from 1 to 100.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon-box">
              <Clock size={26} />
            </div>
            <h3>3. Automated Triage & Dispatch</h3>
            <p>
              Critical complaints are escalated immediately to top of officer queue with recommended department assignments.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon-box">
              <CheckCircle2 size={26} />
            </div>
            <h3>4. Resolution Verification</h3>
            <p>
              Field officers update statuses with site remarks and resolution photos, delivering real-time citizen notifications.
            </p>
          </div>
        </div>
      </section>

      {/* 8 Categories Showcase */}
      <section className="categories-showcase">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Covered Grievances
            </span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
              8 Automatic AI Categories
            </h2>
          </div>
        </div>

        <div className="categories-grid">
          {CATEGORY_ITEMS.map((cat) => (
            <div key={cat.name} className="category-card">
              <div className="cat-icon" style={{ color: cat.color }}>
                {cat.icon}
              </div>
              <div className="cat-info">
                <h4>{cat.name}</h4>
                <span>{cat.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section style={{ 
        background: '#ffffff', 
        border: '1px solid #e2e8f0', 
        borderRadius: 20, 
        padding: '36px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20,
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)'
      }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
            Ready to file or track a public issue?
          </h3>
          <p style={{ color: '#475569', fontSize: '0.95rem' }}>
            Register your account today or sign in to follow your complaint status in real time.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/register" className="btn btn-outline">
            Create Citizen Account
          </Link>
          <Link to="/login/citizen" className="btn btn-primary">
            Citizen Login
          </Link>
        </div>
      </section>
    </div>
  );
}
