import { useState, useEffect } from 'react';
import Navbar from '../components/NavBar';
import axios from '../lib/axios';
import { BookingDto, Robot, User, BookingWithDetails, BookingsByUser } from '../interface/index'
import { XCircle, Calendar, History } from 'lucide-react';

export default function BookingsPage() {
  // State management
  const [bookingsByUser, setBookingsByUser] = useState<BookingsByUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        const [bookingsResponse, robotsResponse, usersResponse] = await Promise.all([
          axios.get<BookingDto[]>('/api/bookings/all-bookings'),
          axios.get<Robot[]>('/api/robot'),
          axios.get<User[]>('/api/admin/users')
        ]);

        const bookings = bookingsResponse.data;
        const robots = robotsResponse.data;
        const users = usersResponse.data;

        const bookingsWithDetails: BookingWithDetails[] = bookings.map((booking) => {
          const robot = robots.find((r) => r.id === booking.robotId);
          const user = users.find((u) => u.id === booking.userId);

          return {
            ...booking,
            robotName: robot?.name ?? 'Okänd robot',
            user: user
          };
        });

        // Group bookings by user
        const groupedBookings = bookingsWithDetails
          .filter(booking => booking.user)
          .reduce((acc: BookingsByUser[], booking) => {
            if (!booking.user) return acc;
            
            const existingGroup = acc.find(group => group.user.id === booking.user!.id);
            
            if (existingGroup) {
              existingGroup.bookings.push(booking);
            } else {
              acc.push({
                user: booking.user,
                bookings: [booking]
              });
            }
            return acc;
          }, []);

        // Sort bookings by start time within each user group
        groupedBookings.forEach(group => {
          group.bookings.sort((a, b) => 
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          );
        });

        setBookingsByUser(groupedBookings);
      } catch (error: any) {
        console.error('Failed to fetch bookings:', error);
        setError(`Kunde inte hämta bokningar: ${error.response?.data || error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Handle booking cancellation
  const handleCancelBooking = async (bookingId: number) => {
    try {
      await axios.delete(`/api/bookings/${bookingId}`);
      setBookingsByUser(prev => 
        prev.map(userGroup => ({
          ...userGroup,
          bookings: userGroup.bookings.filter(booking => booking.id !== bookingId)
        })).filter(userGroup => userGroup.bookings.length > 0)
      );
      setShowCancelModal(false);
      setSelectedBooking(null);
    } catch (error: any) {
      setError(`Kunde inte avboka tiden: ${error.response?.data || error.message}`);
    }
  };

  // Check if a booking is in the past
  const isBookingPast = (booking: BookingWithDetails) => {
    return new Date(booking.endTime) < new Date();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-violet-200/50 shadow-lg p-6 text-center">
            Laddar bokningar...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 mb-8">
          Alla Bokningar
        </h1>

        {error && (
          <div className="mb-4 bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 p-4 rounded-xl">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {bookingsByUser.length > 0 ? (
            bookingsByUser.map((userGroup) => (
              <div key={userGroup.user.id} className="bg-white/60 backdrop-blur-sm rounded-xl border border-violet-200/50 shadow-lg overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border-b border-violet-200/50">
                  <h2 className="text-lg font-medium text-gray-900">
                    {userGroup.user.firstName} {userGroup.user.lastName}
                  </h2>
                  <div className="text-sm text-gray-600">
                    <p>{userGroup.user.email}</p>
                    {userGroup.user.company && (
                      <p className="mt-1">{userGroup.user.company}</p>
                    )}
                  </div>
                </div>
                
                <div className="divide-y divide-violet-200/50">
                  {userGroup.bookings.map((booking) => {
                    const isPast = isBookingPast(booking);
                    return (
                      <div 
                        key={booking.id} 
                        className={`px-6 py-4 flex items-center justify-between transition-colors ${
                          isPast ? 'bg-gray-50/80' : 'hover:bg-violet-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isPast ? (
                            <History className="w-5 h-5 text-gray-400" />
                          ) : (
                            <Calendar className="w-5 h-5 text-violet-500" />
                          )}
                          <div>
                            <p className={`font-medium ${isPast ? 'text-gray-600' : 'text-gray-900'}`}>
                              {booking.robotName}
                            </p>
                            <p className={`text-sm ${isPast ? 'text-gray-500' : 'text-gray-600'}`}>
                              {new Date(booking.startTime).toLocaleDateString('sv-SE')} - {new Date(booking.endTime).toLocaleDateString('sv-SE')}
                            </p>
                          </div>
                        </div>
                        {!isPast && (
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowCancelModal(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            Avboka
                          </button>
                        )}
                        {isPast && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Avslutad</span>
                            <button
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowCancelModal(true);
                              }}
                            >
                              <XCircle className="w-5 h-5 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-violet-200/50 shadow-lg p-8 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500">Inga bokningar hittades</p>
            </div>
          )}
        </div>

        {/* Cancellation Modal */}
        {showCancelModal && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/90 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Bekräfta avbokning</h2>
              <div className="space-y-2 py-4">
                <p>Är du säker på att du vill avboka denna tid?</p>
                <p className="font-medium">
                  Robot: {selectedBooking.robotName}
                </p>
                <p className="font-medium">
                  Tid: {new Date(selectedBooking.startTime).toLocaleDateString('sv-SE')} - {new Date(selectedBooking.endTime).toLocaleDateString('sv-SE')}
                </p>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  className="px-4 py-2 border border-violet-200 text-gray-700 rounded-lg hover:bg-violet-50"
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedBooking(null);
                  }}
                >
                  Avbryt
                </button>
                <button
                  className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600"
                  onClick={() => handleCancelBooking(selectedBooking.id)}
                >
                  Bekräfta avbokning
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}