// Admin user management and registration component
import { useState, useEffect, FormEvent } from 'react';
import axios from '../lib/axios';
import Navbar from '../components/NavBar';
import { UserPlus, Trash2, AlertTriangle } from 'lucide-react';
import { User } from '../interface/index';

export default function RegisterPage() {
  // Navigation and user state management
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Modal states for user deletion
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Registration form state management
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    company: '',
    phone: '',
    role: 'User'
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password validation tracking
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  });

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch users and current user data
  const fetchUsers = async () => {
    try {
      // Parallel API calls for efficiency
      const [usersResponse, currentUserResponse] = await Promise.all([
        axios.get('/api/admin/users'),
        axios.get('/api/account/current')
      ]);
      setUsers(usersResponse.data);
      setCurrentUserId(currentUserResponse.data.id);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  // User deletion handlers
  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsDeletingUser(true);
    try {
      await axios.delete(`/api/admin/users/${selectedUser.id}`);
      setSuccessMessage('Användaren har tagits bort');
      fetchUsers();
    } catch (error: any) {
      setError(error.response?.data || 'Ett fel uppstod när användaren skulle tas bort');
    } finally {
      setIsDeletingUser(false);
      setShowDeleteModal(false);
      setSelectedUser(null);
    }
  };

  // Real-time password validation
  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    setPasswordValidation({
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password)
    });
  };

  // Form submission handler
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validate password match
    if (formData.password !== confirmPassword) {
      setError('Lösenorden matchar inte');
      return;
    }

    // Validate password requirements
    if (!Object.values(passwordValidation).every(Boolean)) {
      setError('Lösenordet uppfyller inte alla krav');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare user data with admin role
      const userData = {
        ...formData,
        isAdmin: formData.role === 'Admin'
      };
      
      await axios.post('/api/account/register', userData);
      setSuccessMessage('Användaren har registrerats!');
      
      // Reset form after successful registration
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        company: '',
        phone: '',
        role: 'User'
      });
      setConfirmPassword('');
      fetchUsers(); // Refresh user list
    } catch (error: any) {
      setError(error.response?.data || 'Ett fel uppstod vid registrering');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

 // Main component render
 return (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
    <Navbar />
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Error and success message display */}
      {(error || successMessage) && (
        <div className="mb-6">
          {error && (
            <div className="mb-4 bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 p-4 rounded-xl">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 bg-green-50/80 backdrop-blur-sm border border-green-100 text-green-600 p-4 rounded-xl">
              {successMessage}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Registration form section */}
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 mb-8">
            Registrera användare
          </h2>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-violet-200/50 shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    Förnamn
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    id="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-violet-200 bg-white/70 backdrop-blur-sm px-3 py-2 text-gray-900 focus:border-violet-500 focus:ring-violet-500 focus:ring-1 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Efternamn
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    id="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-violet-200 bg-white/70 backdrop-blur-sm px-3 py-2 text-gray-900 focus:border-violet-500 focus:ring-violet-500 focus:ring-1 focus:outline-none"
                  />
                </div>
              </div>

              {/* Contact information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Telefonnummer
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-violet-200 bg-white/70 backdrop-blur-sm px-3 py-2 text-gray-900 focus:border-violet-500 focus:ring-violet-500 focus:ring-1 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                    Företag
                  </label>
                  <input
                    type="text"
                    name="company"
                    id="company"
                    required
                    value={formData.company}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-violet-200 bg-white/70 backdrop-blur-sm px-3 py-2 text-gray-900 focus:border-violet-500 focus:ring-violet-500 focus:ring-1 focus:outline-none"
                  />
                </div>
              </div>

              {/* Email field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-violet-200 bg-white/70 backdrop-blur-sm px-3 py-2 text-gray-900 focus:border-violet-500 focus:ring-violet-500 focus:ring-1 focus:outline-none"
                />
              </div>

              {/* Password section with validation */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Lösenord
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  required
                  value={formData.password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-violet-200 bg-white/70 backdrop-blur-sm px-3 py-2 text-gray-900 focus:border-violet-500 focus:ring-violet-500 focus:ring-1 focus:outline-none"
                />
                {/* Password requirements checklist */}
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-gray-600">Lösenordet måste innehålla:</p>
                  <ul className="text-sm space-y-1">
                    {[
                      { key: 'length', text: 'Minst 6 tecken' },
                      { key: 'uppercase', text: 'Minst en stor bokstav (A-Z)' },
                      { key: 'lowercase', text: 'Minst en liten bokstav (a-z)' },
                      { key: 'number', text: 'Minst en siffra (0-9)' }
                    ].map(({ key, text }) => (
                      <li key={key} className={`flex items-center ${passwordValidation[key as keyof typeof passwordValidation] ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordValidation[key as keyof typeof passwordValidation] ? '✓' : '○'} {text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Confirm password field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Bekräfta lösenord
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-violet-200 bg-white/70 backdrop-blur-sm px-3 py-2 text-gray-900 focus:border-violet-500 focus:ring-violet-500 focus:ring-1 focus:outline-none"
                />
              </div>

              {/* Role selection */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Roll
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-violet-200 bg-white/70 backdrop-blur-sm px-3 py-2 text-gray-900 focus:border-violet-500 focus:ring-violet-500 focus:ring-1 focus:outline-none"
                >
                  <option value="User">Användare</option>
                  <option value="Admin">Administratör</option>
                </select>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {isLoading ? 'Registrerar...' : 'Registrera användare'}
              </button>
            </form>
          </div>
        </div>

        {/* Users list section */}
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 mb-8">
            Användare
          </h2>
          {/* User list with glassmorphism effect */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-violet-200/50 shadow-lg p-6">
            <div className="space-y-4">
              {users
                .sort((a, b) => (b.isAdmin === a.isAdmin ? 0 : b.isAdmin ? 1 : -1))
                .map(user => (
                  <div key={user.id} 
                    className="flex items-center justify-between p-4 rounded-lg border border-violet-100 bg-white/80"
                  >
                    {/* User information display */}
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-sm text-gray-500">{user.company}</p>
                      <p className="text-sm text-gray-500">{user.phone}</p>
                      <p className={`text-xs ${user.isAdmin ? 'text-red-600' : 'text-violet-600'}`}>
                        {user.isAdmin ? 'Administratör' : 'Användare'}
                      </p>
                    </div>
                    {/* Delete button - only shown for non-admin users and not for current user */}
                    {user.id !== currentUserId && !user.isAdmin && (
                      <button
                        onClick={() => handleDeleteClick(user)}
                        className="p-2 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal with backdrop blur */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-red-200/50 shadow-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              Ta bort användare
            </h2>
            {/* Modal content with warning */}
            <div className="space-y-4 py-4">
              <p className="text-gray-700">
                Är du säker på att du vill ta bort {selectedUser.firstName} {selectedUser.lastName}?
              </p>
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-lg p-4">
                <ul className="list-disc list-inside text-sm space-y-1 text-red-700">
                  <li>Användarens information kommer att raderas</li>
                  <li>Alla bokningar kopplade till användaren tas bort</li>
                  <li>Denna åtgärd kan inte ångras</li>
                </ul>
              </div>
            </div>
            {/* Modal action buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
              >
                Avbryt
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isDeletingUser}
                className="px-4 py-2 flex items-center text-white bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeletingUser ? 'Tar bort...' : 'Ja, ta bort användare'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
}