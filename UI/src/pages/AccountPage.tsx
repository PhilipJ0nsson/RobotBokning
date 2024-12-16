import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';
import axios from '../lib/axios';
import { Robot, Booking, User } from '../interface/index';


export default function AccountPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    phone: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // Hämta användardata
      const userResponse = await axios.get('/api/account/current');
      const userData = userResponse.data;
      
      // Hämta användarens bokningar
      const bookingsResponse = await axios.get('/api/bookings/my-bookings');
      const bookingsData = bookingsResponse.data;

      // Hämta robotinformation
      const robotsResponse = await axios.get('/api/robot');
      const robotsData = robotsResponse.data;

      // Kombinera bokningar med robotnamn
      const bookingsWithRobotNames = bookingsData.map((booking: Booking) => {
        const robot = robotsData.find((r: Robot) => r.id === booking.robotId);
        return {
          ...booking,
          robotName: robot?.name || 'Okänd robot',
          date: new Date(booking.startTime).toISOString().split('T')[0] // Extrahera bara datumet
        };
      });

      // Kombinera data
      setUser({
        ...userData,
        bookings: bookingsWithRobotNames
      });

      setFormData({
        firstName: userData.firstName,
        lastName: userData.lastName,
        company: userData.company,
        phone: userData.phone || ''
      });
    } catch (error: any) {
      console.error('Failed to fetch user data:', error);
      setError(error.response?.data || 'Kunde inte hämta användardata');
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const handleUpdate = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await axios.put('/api/account/update', formData);
      setUser(response.data);
      setIsEditing(false);
      setSuccessMessage('Uppgifterna har uppdaterats!');
    } catch (error: any) {
      console.error('Update error:', error);
      setError(error.response?.data || 'Ett fel uppstod vid uppdateringen');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Lösenorden matchar inte');
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

      setIsChangingPassword(false);
      setSuccessMessage('Lösenordet har ändrats!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Password change error:', error);
      setError(error.response?.data || 'Ett fel uppstod vid ändring av lösenord');
    } finally {
      setIsLoading(false);
    }
  };
  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm('Är du säker på att du vill avboka denna tid?')) return;
    
    try {
      await axios.delete(`/api/bookings/${bookingId}`);
      // Uppdatera user state för att ta bort den avbokade bokningen
      setUser(prev => prev ? {
        ...prev,
        bookings: prev.bookings?.filter(b => b.id !== bookingId)
      } : null);
      setSuccessMessage('Bokningen har avbokats');
    } catch (error: any) {
      setError('Kunde inte avboka tiden');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Min Profil</h1>

        {(error || successMessage) && (
          <div className="mb-6">
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="bg-green-50 text-green-500 p-3 rounded-md text-sm">
                {successMessage}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personuppgifter - Vänster kolumn */}
          <div className="h-fit bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Personuppgifter</h2>
            
            {!isEditing ? (
              <div className="space-y-4">
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
                <div className="pt-4 space-x-3">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Redigera uppgifter
                  </button>
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Ändra lösenord
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Förnamn</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Efternamn</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Företag</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefon</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="pt-4 space-x-3">
                  <button
                    onClick={handleUpdate}
                    disabled={isLoading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            )}

            {/* Ändra lösenord formulär */}
            {isChangingPassword && (
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Ändra lösenord</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nuvarande lösenord</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nytt lösenord</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bekräfta nytt lösenord</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div className="pt-4 space-x-3">
                  <button
                    onClick={handlePasswordChange}
                    disabled={isLoading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Ändra lösenord
                  </button>
                  <button
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                    }}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* Bokningar - Höger kolumn */}
          <div className="bg-white shadow rounded-lg p-6 h-fit">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Mina bokningar</h2>
            <div className="max-h-[600px] overflow-y-auto">
            {user && user.bookings && user.bookings.length > 0 ? (
              <div className="space-y-4">
                {user.bookings.map((booking) => (
                  <div 
                    key={booking.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <h3 className="font-medium text-gray-900">Robot: {booking.robotName}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(booking.startTime).toLocaleDateString('sv-SE')} - {new Date(booking.endTime).toLocaleDateString('sv-SE')}
                    </p>
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="mt-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded"
                    >
                      Avboka
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Du har inga bokade tider</p>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}