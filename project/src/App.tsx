import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/authStore';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import StockManagement from './pages/StockManagement';
import IssueItems from './pages/IssueItems';
import LoadingScreen from './components/LoadingScreen';
import RoleBasedRoute from './components/RoleBasedRoute';
import Reports from './pages/Reports';
import Requests from './pages/Requests';
import Profile from './pages/Profile';
import ModalTest from './pages/ModalTest';
import AddStockPage from './pages/AddStockPage';
import NewRequest from './pages/NewRequest';
import MyRequests from './pages/MyRequests';
import ItemsInUse from './pages/ItemsInUse';
import Users from './pages/Users';
import Settings from './pages/Settings';
import AddUser from './pages/AddUser';
import AdminStock from './pages/AdminStock';
import AdminReports from './pages/AdminReports';
import AdminRequests from './pages/AdminRequests';
import EditUser from './pages/EditUser';
import ApprovedRequests from './pages/ApprovedRequests';
import Logs from './pages/Logs';
import { AppRoutes } from "./routes";
import useNotificationWebSocket from './hooks/useNotificationWebSocket';
import LoginPage from './pages/LoginPage';
import DeletedItems from './pages/DeletedItems';
import FeaturesPage from './pages/FeaturesPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';

// Route guard component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  const { isAuthenticated, fetchUser } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(true);

  // Call the WebSocket hook here, it will manage connection based on user state
  useNotificationWebSocket();

  useEffect(() => {
    // Try to restore user session from token on first load
    const tryRestoreSession = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await fetchUser();
        } catch {
          // If token is invalid, user will remain logged out
        }
      }
      setIsLoading(false);
    };
    tryRestoreSession();
  }, [fetchUser]);
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        {isAuthenticated && <Navbar />}
        <Routes>
          <Route 
            path="/register" 
            element={<RegisterForm />} 
          />
          <Route 
            path="/login" 
            element={
              isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <LoginPage />
              )
            } 
          />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/stock-management"
            element={
              <RoleBasedRoute allowedRoles={['logistics-officer', 'system-admin']}>
                <StockManagement />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/issue-items"
            element={
              <RoleBasedRoute allowedRoles={['logistics-officer']}>
                <IssueItems />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <RoleBasedRoute allowedRoles={["system-admin"]}>
                <Reports />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/requests"
            element={
              <RoleBasedRoute allowedRoles={["system-admin", "admin"]}>
                <Requests />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/modal-test"
            element={<ModalTest />}
          />
          <Route
            path="/add-stock"
            element={<AddStockPage />}
          />
          <Route
            path="/new-request"
            element={
              <RoleBasedRoute allowedRoles={['unit-leader']}>
                <NewRequest />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/my-requests"
            element={
              <RoleBasedRoute allowedRoles={['unit-leader']}>
                <MyRequests />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/items-in-use"
            element={
              <RoleBasedRoute allowedRoles={['unit-leader']}>
                <ItemsInUse />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <RoleBasedRoute allowedRoles={["system-admin"]}>
                <Users />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/users/add"
            element={
              <RoleBasedRoute allowedRoles={['system-admin']}>
                <AddUser />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/users/:id/edit"
            element={
              <RoleBasedRoute allowedRoles={['system-admin']}>
                <EditUser />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <RoleBasedRoute allowedRoles={["system-admin"]}>
                <Settings />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/stock"
            element={
              <RoleBasedRoute allowedRoles={['admin']}>
                <AdminStock />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/requests"
            element={
              <RoleBasedRoute allowedRoles={['admin']}>
                <Requests />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/approve-requests"
            element={
              <RoleBasedRoute allowedRoles={['admin']}>
                <AdminRequests />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <RoleBasedRoute allowedRoles={['admin']}>
                <AdminReports />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/stock-availability"
            element={
              <RoleBasedRoute allowedRoles={["system-admin", "admin"]}>
                <AdminStock />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/approved-requests"
            element={
              <RoleBasedRoute allowedRoles={['logistics-officer']}>
                <ApprovedRequests />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/logs"
            element={
              <RoleBasedRoute allowedRoles={["system-admin"]}>
                <Logs />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/deleted-items"
            element={
              <RoleBasedRoute allowedRoles={['system-admin']}>
                <DeletedItems />
              </RoleBasedRoute>
            }
          />
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <AppRoutes />
              </ProtectedRoute>
            } 
          />
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
        
        {/* Toast notifications */}
        <Toaster position="top-right" closeButton richColors />
      </div>
    </Router>
  );
};

export default App;