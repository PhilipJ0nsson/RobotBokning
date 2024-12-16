import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Om ingen token finns, omdirigera till login
    return <Navigate to="/login" replace />;
  }
  
  // Om token finns, visa den skyddade komponenten
  return <>{children}</>;
};

export default ProtectedRoute;