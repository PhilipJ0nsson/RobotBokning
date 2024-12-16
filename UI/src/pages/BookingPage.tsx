import { useState, useEffect } from 'react';
import Navbar from '../components/NavBar';
import axios from '../lib/axios';
import { BookingDto, Robot, User, BookingWithDetails, BookingsByUser, BookingStatus } from '../interface/index'

export default function BookingsPage() {
  const [bookingsByUser, setBookingsByUser] = useState<BookingsByUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // Add details to bookings
        const bookingsWithDetails: BookingWithDetails[] = bookings.map((booking) => {
          const robot = robots.find((r) => r.id === booking.robotId);
          const user = users.find((u) => u.id === booking.userId);

          if (!robot || !user) {
            console.warn(
              `Missing data for booking ${booking.id}:`,
              !robot ? 'Robot not found' : 'User not found'
            );
          }

          return {
            ...booking,
            robotName: robot?.name ?? 'Okänd robot',
            user: user
          };
        });

        // Group bookings by user, only including valid bookings with user data
// Först logga rådata
console.log('Raw bookings:', bookingsResponse.data);

// Efter att vi lagt till detaljer
console.log('Bookings with details:', bookingsWithDetails);

// I filtreringen, lägg till explicit konvertering och loggning
const groupedBookings = bookingsWithDetails
  .filter(booking => {
    console.log('Checking booking:', {
      id: booking.id,
      hasUser: !!booking.user,
      status: booking.status,
      isScheduled: booking.status === BookingStatus.Scheduled
    });
    return booking.user && booking.status === BookingStatus.Scheduled;
  })
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

console.log('Final grouped bookings:', groupedBookings);

        // Sort bookings within each group by start time
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

  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm('Är du säker på att du vill avboka denna tid?')) return;
    
    try {
      await axios.delete(`/api/bookings/${bookingId}`);
      
      setBookingsByUser(prev => 
        prev.map(userGroup => ({
          ...userGroup,
          bookings: userGroup.bookings.filter(booking => booking.id !== bookingId)
        })).filter(userGroup => userGroup.bookings.length > 0)
      );
    } catch (error: any) {
      setError(`Kunde inte avboka tiden: ${error.response?.data || error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Laddar bokningar...</div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Alla Bokningar</h1>

        {error && (
          <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-8">
          {bookingsByUser.length > 0 ? (
            bookingsByUser.map((userGroup) => (
            <div key={userGroup.user.id} className="bg-white shadow rounded-lg overflow-hidden border-2 border-gray-300">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
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
                
                <div className="divide-y divide-gray-200">
                  {userGroup.bookings.map((booking) => (
                    <div key={booking.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-900">{booking.robotName}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(booking.startTime).toLocaleDateString('sv-SE')} - {new Date(booking.endTime).toLocaleDateString('sv-SE')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                      >
                        Avboka
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 bg-white shadow rounded-lg p-6">
              Inga bokningar hittades
            </div>
          )}
        </div>
      </div>
    </div>
  );
}