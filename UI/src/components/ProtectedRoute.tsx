import { Navigate } from 'react-router-dom';

// Component to protect routes that require authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Check for authentication token
  const token = localStorage.getItem('token');
 
  // If no token found, redirect to login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }
 
  // If token exists, show the protected content
  return <>{children}</>;
};

export default ProtectedRoute;