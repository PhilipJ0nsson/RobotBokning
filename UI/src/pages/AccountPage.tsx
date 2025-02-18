import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';
import axios from '../lib/axios';
import { User } from '../interface/index';
import { Lock, Edit2, Trash2, AlertTriangle } from 'lucide-react';

// Main component for the account settings page
export default function AccountPage() {
  const navigate = useNavigate();
  
  // User data and editing states
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    phone: ''
  });

  // Password management states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  });

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch user data when component mounts
  useEffect(() => {
    fetchUserData();
  }, []);

  // Get user data from API
  const fetchUserData = async () => {
    try {
      const userResponse = await axios.get('/api/account/current');
      const userData = userResponse.data;
      
      setUser(userData);
      setFormData({
        firstName: userData.firstName,
        lastName: userData.lastName,
        company: userData.company,
        phone: userData.phone || ''
      });
    } catch (error: any) {
      console.error('Failed to fetch user data:', error);
      setError(error.response?.data || 'Could not fetch user data');
      // Redirect to login if session is invalid
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  // Save updated user information
  const handleUpdate = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await axios.put('/api/account/update', formData);
      setUser(response.data);
      setIsEditing(false);
      setSuccessMessage('Information updated successfully!');
    } catch (error: any) {
      console.error('Update error:', error);
      setError(error.response?.data || 'An error occurred during update');
    } finally {
      setIsLoading(false);
    }
  };

  // Validate password as user types
  const handleNewPasswordChange = (password: string) => {
    setPasswordData({ ...passwordData, newPassword: password });
    setPasswordValidation({
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password)
    });
  };

  // Handle password change submission
  const handlePasswordChange = async () => {
    // Check if passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await axios.post('/api/account/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setSuccessMessage('Password changed successfully!');
      
      // Reset form after successful change
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordValidation({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false
      });
      setIsChangingPassword(false);

    } catch (error: any) {
      // Handle different types of error messages from API
      let errorMessage = 'An error occurred while changing password';
     
      if (typeof error.response?.data === 'string') {
        errorMessage = error.response.data;
      } else if (error.response?.data?.errors) {
        const firstError = Object.values(error.response.data.errors)[0];
        if (Array.isArray(firstError)) {
          errorMessage = firstError[0];
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
     
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    setError('');
    setSuccessMessage('');
  
    try {
      await axios.delete('/api/account');
      localStorage.removeItem('token');
      navigate('/login');
    } catch (error: any) {
      console.error('Delete account error:', error);
      setError(error.response?.data || 'An error occurred while deleting account');
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

// Account management page component with user profile editing and password change functionality
return (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
    <Navbar />
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header section with page title and delete account button */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
          Mitt konto
        </h1>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Ta bort konto
        </button>
      </div>

      {/* Error and success message display */}
      {(error || successMessage) && (
        <div className="mb-6">
          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 p-4 rounded-xl">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="bg-green-50/80 backdrop-blur-sm border border-green-100 text-green-600 p-4 rounded-xl">
              {successMessage}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column - Personal information section */}
        <div className="h-fit bg-white/60 backdrop-blur-sm rounded-xl border border-violet-200/50 shadow-lg p-6">
          <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 mb-6">
            Personuppgifter
          </h2>
          
          {/* Toggle between view and edit mode for user details */}
          {!isEditing ? (
            // Display mode - shows user information
            <div className="space-y-4">
              {/* User information display fields */}
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Förnamn</label>
                <p className="text-gray-900">{user?.firstName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Efternamn</label>
                <p className="text-gray-900">{user?.lastName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Företag</label>
                <p className="text-gray-900">{user?.company}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Telefon</label>
                <p className="text-gray-900">{user?.phone}</p>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 flex items-center bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all duration-200"
                >
                <Edit2 className="w-4 h-4 mr-2" />
                  Redigera uppgifter
                </button>
              </div>
            </div>
          ) : (
            // Edit mode - form for updating user information
            <div className="space-y-4">
              {/* User information edit form fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="mt-1 block w-full rounded-lg border border-violet-200 bg-gray-50/50 px-3 py-2 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Förnamn</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-violet-200 bg-white/70 backdrop-blur-sm px-3 py-2 text-gray-900 focus:border-violet-500 focus:ring-violet-500 focus:ring-1 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Efternamn</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-violet-200 bg-white/70 backdrop-blur-sm px-3 py-2 text-gray-900 focus:border-violet-500 focus:ring-violet-500 focus:ring-1 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Företag</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-violet-200 bg-white/70 backdrop-blur-sm px-3 py-2 text-gray-900 focus:border-violet-500 focus:ring-violet-500 focus:ring-1 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefon</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-violet-200 bg-white/70 backdrop-blur-sm px-3 py-2 text-gray-900 focus:border-violet-500 focus:ring-violet-500 focus:ring-1 focus:outline-none"
                />
              </div>
              {/* Save and cancel buttons for edit mode */}
              <div className="pt-4 space-x-3">
                <button
                  onClick={handleUpdate}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 disabled:opacity-50"
                >
                  {isLoading ? 'Sparar...' : 'Spara ändringar'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      firstName: user?.firstName || '',
                      lastName: user?.lastName || '',
                      company: user?.company || '',
                      phone: user?.phone || ''
                    });
                  }}
                  className="px-4 py-2 border border-violet-200 text-gray-700 rounded-lg hover:bg-violet-50 transition-all duration-200"
                >
                  Avbryt
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right column - Password change section */}
        <div className="h-fit bg-white/60 backdrop-blur-sm rounded-xl border border-violet-200/50 shadow-lg p-6">
          <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 mb-6">
            Ändra lösenord
          </h2>
          <div className="space-y-4">
            {/* Password change form fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Nuvarande lösenord</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                disabled={!isChangingPassword}
                className={`mt-1 block w-full rounded-lg border border-violet-200 px-3 py-2 ${
                  isChangingPassword 
                    ? "bg-white/70 backdrop-blur-sm" 
                    : "bg-gray-50/50 text-gray-500"
                } focus:border-violet-500 focus:ring-violet-500 focus:ring-1 focus:outline-none`}
              />
            </div>

            {/* New password input with validation requirements */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Nytt lösenord</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => handleNewPasswordChange(e.target.value)}
                disabled={!isChangingPassword}
                className={`mt-1 block w-full rounded-md border px-3 py-2 ${
                  isChangingPassword 
                    ? "border-gray-300 bg-white" 
                    : "border-gray-200 bg-gray-50 text-gray-500"
                }`}
              />
              {/* Password validation checklist */}
              <div className="mt-2 space-y-2">
                <p className="text-sm text-gray-600">Lösenordet måste innehålla:</p>
                <ul className="text-sm space-y-1">
                  <li className={`flex items-center ${passwordValidation.length ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordValidation.length ? '✓' : '○'} Minst 6 tecken
                  </li>
                  <li className={`flex items-center ${passwordValidation.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordValidation.uppercase ? '✓' : '○'} Minst en stor bokstav (A-Z)
                  </li>
                  <li className={`flex items-center ${passwordValidation.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordValidation.lowercase ? '✓' : '○'} Minst en liten bokstav (a-z)
                  </li>
                  <li className={`flex items-center ${passwordValidation.number ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordValidation.number ? '✓' : '○'} Minst en siffra (0-9)
                  </li>
                </ul>
              </div>
            </div>

            {/* Confirm password field */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Bekräfta nytt lösenord</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                disabled={!isChangingPassword}
                className={`mt-1 block w-full rounded-md border px-3 py-2 ${
                  isChangingPassword 
                    ? "border-gray-300 bg-white" 
                    : "border-gray-200 bg-gray-50 text-gray-500"
                }`}
              />
            </div>

            {/* Password change action buttons */}
            <div className="pt-4">
              {!isChangingPassword ? (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="px-4 py-2 flex items-center bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all duration-200"
                >
                <Lock className="w-4 h-4 mr-2" />
                  Ändra lösenord
                </button>
              ) : (
                <div className="space-x-3">
                  <button
                    onClick={handlePasswordChange}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 disabled:opacity-50"
                  >
                    {isLoading ? 'Sparar...' : 'Spara lösenord'}
                  </button>
                  <button
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                      setPasswordValidation({
                        length: false,
                        uppercase: false,
                        lowercase: false,
                        number: false
                      });
                    }}
                    className="px-4 py-2 border border-violet-200 text-gray-700 rounded-lg hover:bg-violet-50 transition-all duration-200"
                  >
                    Avbryt
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal - Confirmation dialog */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-red-200/50 shadow-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              Ta bort konto
            </h2>
            {/* Modal content explaining account deletion consequences */}
            <div className="space-y-4 py-4">
              <p className="text-gray-700">
                Är du säker på att du vill ta bort ditt konto? Detta kommer att:
              </p>
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-lg p-4">
                <ul className="list-disc list-inside text-sm space-y-1 text-red-700">
                  <li>Radera all din personliga information</li>
                  <li>Ta bort alla dina bokningar</li>
                  <li>Permanent avsluta ditt konto</li>
                </ul>
              </div>
              <p className="font-medium text-gray-900">
                Denna åtgärd kan inte ångras.
              </p>
            </div>
            {/* Modal action buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                onClick={() => setShowDeleteModal(false)}
              >
                Avbryt
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="px-4 py-2 flex items-center text-white bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeletingAccount ? 'Tar bort konto...' : 'Ja, ta bort mitt konto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating notification messages */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50/90 backdrop-blur-sm border border-red-100 text-red-600 p-4 rounded-xl shadow-lg">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-50/90 backdrop-blur-sm border border-green-100 text-green-600 p-4 rounded-xl shadow-lg">
          {successMessage}
        </div>
      )}
    </div>
  </div>
);
}