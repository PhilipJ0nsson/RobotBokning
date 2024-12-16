import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';  // Lägg till denna import
import LoginPage from './pages/LoginPage';
import CalendarView from './pages/CalendarViewPage';
import RobotView from './pages/RobotViewPage';
import RobotDetail from './pages/RobotDetailPage';
import AddDocument from './pages/AddDocumentPage'; 
import AccountPage from './pages/AccountPage';
import RegisterPage from './pages/RegisterPage'
import BookingsPage from './pages/BookingPage'
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Publik route */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Skyddade routes för vanliga användare */}
          <Route 
            path="/calendar" 
            element={
              <ProtectedRoute>
                <CalendarView />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/robots" 
            element={
              <ProtectedRoute>
                <RobotView />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/robots/:id" 
            element={
              <ProtectedRoute>
                <RobotDetail />
              </ProtectedRoute>
            } 
          />
                  <Route 
          path="/robots/:id/add-document" 
          element={
            <ProtectedRoute>
              <AddDocument />
            </ProtectedRoute>
          } 
        />
              <Route 
          path="/account" 
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          } 
        />
                  <Route 
            path="/register" 
            element={
              <ProtectedRoute>
                <RegisterPage />
              </ProtectedRoute>
            } 
          />
                    <Route 
            path="/bookings" 
            element={
              <ProtectedRoute>
                <BookingsPage />
              </ProtectedRoute>
            } 
          />
          {/* Omdirigera root till calendar */}
          <Route path="/" element={<Navigate to="/calendar" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;