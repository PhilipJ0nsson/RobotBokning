import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Main navigation bar component
export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();

  // Remove token and redirect to login page
  const handleLogout = async () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Check if current page matches the given path
  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  // Show empty navbar while loading
  if (loading) {
    return (
      <nav className="bg-white/60 backdrop-blur-lg border-b border-violet-200/50 shadow-lg">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16" />
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white/60 backdrop-blur-lg border-b border-violet-200/50 shadow-lg">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Logo */}
          <div className="flex items-center">
          </div>

          {/* Middle - Navigation buttons */}
          <div className="flex items-center space-x-1">
            {/* Regular user buttons */}
            <button
              onClick={() => navigate('/calendar')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive('/calendar')
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-violet-50'
              }`}
            >
              Kalender
            </button>
            <button
              onClick={() => navigate('/my-bookings')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive('/my-bookings')
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-violet-50'
              }`}
            >
              Mina bokningar
            </button>
            <button
              onClick={() => navigate('/robots')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive('/robots')
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-violet-50'
              }`}
            >
              Robot
            </button>
            
            <button
              onClick={() => navigate('/account')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive('/account')
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-violet-50'
              }`}
            >
              Mitt konto
            </button>
            <a href="https://alohaforum.freeflarum.com" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-violet-50 transition-all duration-200">
              Forum
            </a>

            {/* Admin only buttons */}
            {user?.isAdmin && (
              <>
                <button
                  onClick={() => navigate('/register')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive('/register')
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-violet-50'
                  }`}
                >
                  Användare
                </button>
                <button
                  onClick={() => navigate('/bookings')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive('/bookings')
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-violet-50'
                  }`}
                >
                  Bokningar
                </button>
              </>
            )}
          </div>

          {/* Right side - Logout */}
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-rose-600 hover:to-pink-600 transition-colors duration-200 text-sm font-medium"
            >
              Logga ut
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}