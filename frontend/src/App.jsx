import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import NewComplaint from './pages/NewComplaint';
import OfficerDashboard from './pages/OfficerDashboard';
import ComplaintDetail from './pages/ComplaintDetail';

function Guard({ allowedRoles, children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login/citizen" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'citizen') {
      return <Navigate to="/citizen" replace />;
    }
    return <Navigate to="/officer" replace />;
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Auth routes */}
        <Route path="/login" element={<Login role="citizen" />} />
        <Route path="/login/citizen" element={<Login role="citizen" />} />
        <Route path="/login/officer" element={<Login role="officer" />} />
        <Route path="/login/admin" element={<Login role="admin" />} />
        <Route path="/register" element={<Register />} />

        {/* Citizen routes */}
        <Route 
          path="/citizen" 
          element={
            <Guard allowedRoles={['citizen']}>
              <Layout>
                <CitizenDashboard />
              </Layout>
            </Guard>
          } 
        />
        <Route 
          path="/citizen/new" 
          element={
            <Guard allowedRoles={['citizen']}>
              <Layout>
                <NewComplaint />
              </Layout>
            </Guard>
          } 
        />

        {/* Officer / Admin routes */}
        <Route 
          path="/officer" 
          element={
            <Guard allowedRoles={['officer', 'admin']}>
              <Layout>
                <OfficerDashboard />
              </Layout>
            </Guard>
          } 
        />

        {/* Shared file detail route accessible to citizen owner, officer and admin */}
        <Route 
          path="/complaints/:id" 
          element={
            <Guard allowedRoles={['citizen', 'officer', 'admin']}>
              <Layout>
                <ComplaintDetail />
              </Layout>
            </Guard>
          } 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
