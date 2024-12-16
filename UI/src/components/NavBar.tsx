import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from '../lib/axios';  // Ändra till din axios-instans

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await axios.get('/api/account/current');
        setIsAdmin(response.data.isAdmin);
      } catch (error) {
        console.error('Failed to check admin status:', error);
      }
    };

    checkAdminStatus();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white/30 backdrop-blur-lg rounded-xl border border-gray-300/30 shadow-lg">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Vänster sida - Logo/Titel */}
          <div className="flex items-center">
          </div>

          {/* Mitten - Navigation */}
          <div className="flex items-center space-x-8">
            <button
              onClick={() => navigate('/calendar')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/calendar')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Kalender
            </button>
            <button
              onClick={() => navigate('/robots')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/robots')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Robotar
            </button>
            <button
              onClick={() => navigate('/account')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/account')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Mitt Konto
            </button>
            {isAdmin && (
              <button
                onClick={() => navigate('/register')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/register')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Registrera
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => navigate('/bookings')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/bookings')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Bokningar
              </button>
            )}
          </div>

          {/* Höger sida - Logga ut */}
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="bg-rose-600 text-white px-4 py-2 rounded-md hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm font-medium"
            >
              Logga ut
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}