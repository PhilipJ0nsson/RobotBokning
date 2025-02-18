import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';
import axios from '../lib/axios';
import { Robot, Booking } from '../interface/index';
import { XCircle, History, Calendar } from 'lucide-react';

export default function MyBookingPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const [bookingsResponse, robotsResponse] = await Promise.all([
        axios.get('/api/bookings/my-bookings'),
        axios.get('/api/robot')
      ]);
      const bookingsWithRobotNames = bookingsResponse.data.map((booking: Booking) => {
        const robot = robotsResponse.data.find((r: Robot) => r.id === booking.robotId);
        return {
          ...booking,
          robotName: robot?.name || 'Okänd robot'
        };
      });
      setBookings(bookingsWithRobotNames);
    } catch (error: any) {
      console.error('Failed to fetch bookings:', error);
      setError(error.response?.data || 'Kunde inte hämta bokningar');
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    try {
      await axios.delete(`/api/bookings/${bookingId}`);
      setBookings(prev => prev.filter(b => b.id !== bookingId));
      setSuccessMessage('Bokningen har avbokats');
      setShowCancelModal(false);
    } catch (error: any) {
      setError('Kunde inte avboka tiden');
    }
  };

  // Separate current and past bookings
  const currentDate = new Date();
  const currentBookings = bookings.filter(booking => new Date(booking.endTime) >= currentDate);
  const pastBookings = bookings.filter(booking => new Date(booking.endTime) < currentDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 mb-8">
          Mina bokningar
        </h1>

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

        {/* Current Bookings Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Aktuella bokningar
          </h2>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-violet-200/50 shadow-lg p-6">
            <div className="max-h-[400px] overflow-y-auto">
              {currentBookings.length > 0 ? (
                <div className="space-y-4">
                  {currentBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-white/80 backdrop-blur-sm rounded-lg border border-violet-200 hover:border-violet-300 p-4 transition-all duration-200"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-gray-900">Robot: {booking.robotName}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(booking.startTime).toLocaleDateString('sv-SE')} - {new Date(booking.endTime).toLocaleDateString('sv-SE')}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowCancelModal(true);
                          }}
                          className="bg-gradient-to-r flex items-center from-rose-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-rose-600 hover:to-pink-600 transition-colors"
                        >
                          <XCircle className="w-4 h-4 mr-2"/>
                          Avboka
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">Du har inga aktuella bokningar</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Past Bookings Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <History className="w-5 h-5 mr-2" />
            Bokningshistorik
          </h2>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-violet-200/50 shadow-lg p-6">
            <div className="max-h-[400px] overflow-y-auto">
              {pastBookings.length > 0 ? (
                <div className="space-y-4">
                  {pastBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-gray-50/80 backdrop-blur-sm rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-gray-700">Robot: {booking.robotName}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(booking.startTime).toLocaleDateString('sv-SE')} - {new Date(booking.endTime).toLocaleDateString('sv-SE')}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500">Avslutad</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">Ingen bokningshistorik tillgänglig</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal - remains unchanged */}
      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-violet-200/50 shadow-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 mb-4">
              Bekräfta avbokning
            </h2>
            <div className="space-y-2 py-4">
              <p className="text-gray-600">Är du säker på att du vill avboka denna tid?</p>
              <p className="font-medium text-gray-900">
                Robot: {selectedBooking.robotName}
              </p>
              <p className="font-medium text-gray-900">
                {new Date(selectedBooking.startTime).toLocaleDateString('sv-SE')} - {new Date(selectedBooking.endTime).toLocaleDateString('sv-SE')}
              </p>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                className="px-4 py-2 border border-violet-200 text-gray-700 rounded-lg hover:bg-violet-50 transition-colors"
                onClick={() => setShowCancelModal(false)}
              >
                Avbryt
              </button>
              <button
                className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 transition-colors"
                onClick={() => handleCancelBooking(selectedBooking.id)}
              >
                Bekräfta avbokning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}