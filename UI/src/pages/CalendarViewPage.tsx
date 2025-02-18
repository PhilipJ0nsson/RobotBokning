// Calendar view component for managing robot bookings with admin functionality
import { useState, useEffect } from 'react';
import Navbar from '../components/NavBar';
import axios from '../lib/axios';
import { Robot, Booking, NextBooking, CurrentHolder } from '../interface/index';

export default function CalendarView() {
  // Core state management for calendar functionality
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);      // User's bookings
  const [allBookings, setAllBookings] = useState<Booking[]>([]); // All system bookings
  const [robots, setRobots] = useState<Robot[]>([]);
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);

  // State for handling date selection and hover interactions
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  
  // UI state management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Robot holder and booking information state
  const [currentHolder, setCurrentHolder] = useState<CurrentHolder | null>(null);

  // Modal control states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<Booking | null>(null);
  const [dateToCancel, setDateToCancel] = useState<Date | null>(null);
  const [dateToBook, setDateToBook] = useState<Date | null>(null);

  // Initial data fetch on component mount
  useEffect(() => {
    fetchInitialData();
  }, []); 

  // Fetch holder information when selected robot changes
  useEffect(() => {
    if (selectedRobot?.id) {
      fetchHolderInfo();
    }
  }, [selectedRobot?.id]); 

  // Fetch initial bookings, robots, and user data
  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      // Parallel API calls for efficiency
      const [allBookingsRes, myBookingsRes, robotsRes] = await Promise.all([
        axios.get('/api/bookings/all-bookings'),
        axios.get('/api/bookings/my-bookings'),
        axios.get<Robot[]>('/api/robot')
      ]);
      
      setAllBookings(allBookingsRes.data);
      setBookings(myBookingsRes.data);
      setRobots(robotsRes.data);
  
      // Set initial robot selection
      if (!selectedRobot && robotsRes.data.length > 0) {
        setSelectedRobot(robotsRes.data[0]);
      } else if (selectedRobot) {
        const updatedRobot = robotsRes.data.find(r => r.id === selectedRobot.id);
        if (updatedRobot) {
          setSelectedRobot(updatedRobot);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Kunde inte hämta data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch current holder and next booking information
  const fetchHolderInfo = async () => {
    if (!selectedRobot?.id) return;
    
    try {
        const currentDate = new Date();
        console.log('Fetching data for robot:', selectedRobot.id);
        
        // Parallel API calls for holder info
        const [currentHolderRes] = await Promise.all([
            axios.get<CurrentHolder>(`/api/Bookings/current-holder/${selectedRobot.id}`, {
                params: { date: currentDate.toISOString() }
            }).catch(error => {
                console.log('Current holder error:', error.response?.data);
                return { data: null };
            }),
            axios.get<NextBooking>(`/api/Bookings/next-booking/${selectedRobot.id}`, {
                params: { date: currentDate.toISOString() }
            }).catch(error => {
                console.log('Next booking error:', error.response?.data);
                return { data: null };
            })
        ]);

        console.log('Current holder response:', currentHolderRes.data);
        setCurrentHolder(currentHolderRes.data);
    } catch (err) {
        console.error('Error fetching holder info:', err);
    }
};

  // Handle date selection for booking
  const handleDateSelection = async (date: Date) => {
    if (!selectedRobot) return;

    // Normalize date to noon to avoid timezone issues
    const normalizedDate = new Date(date);
    normalizedDate.setHours(12, 0, 0, 0);

    if (normalizedDate.getDay() !== 3) return; // Only allow Wednesday bookings

    try {
      setIsLoading(true);
      const startDate = new Date(normalizedDate);
      startDate.setHours(12, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);

      await axios.post('/api/bookings', {
        robotId: selectedRobot.id,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString()
      });

      await fetchInitialData();
      await fetchHolderInfo();
      setSelectedDates([]);
      setError(null);
    } catch (err: any) {
      console.error('Booking error:', err);
      setError(err.message || 'Kunde inte skapa bokning');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle booking cancellation
  const handleCancelBooking = async (date: Date) => {
    try {
      const booking = bookings.find(booking => 
        isSameDay(new Date(booking.startTime), date)
      );

      if (!booking) {
        setError('Kunde inte hitta bokningen');
        return;
      }

      await axios.delete(`/api/bookings/${booking.id}`);
      setBookings(prev => prev.filter(b => b.id !== booking.id));
      setAllBookings(prev => prev.filter(b => b.id !== booking.id));
      await fetchHolderInfo();
    } catch (err: any) {
      console.error('Cancel booking error:', err);
      setError(err.response?.data || 'Kunde inte avboka tiden');
    }
  };

  // Utility function to check if two dates are the same day
  const isSameDay = (date1: Date, date2: Date) => 
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();

  // Check booking status for a given date
  const isDateBooked = (date: Date) => {
    if (!selectedRobot) return { isBooked: false, isOwnBooking: false };

    const robotBookings = bookings.filter(b => b.robotId === selectedRobot.id);
    const allRobotBookings = allBookings.filter(b => b.robotId === selectedRobot.id);

    const isInBookingPeriod = (booking: Booking) => {
      const start = new Date(booking.startTime);
      const end = new Date(booking.endTime);
      return date >= start && date <= end;
    };

    const ownBooking = robotBookings.some(isInBookingPeriod);
    const otherBooking = allRobotBookings.some(booking => 
      isInBookingPeriod(booking) && !robotBookings.some(myBooking => myBooking.id === booking.id)
    );

    return { isBooked: otherBooking, isOwnBooking: ownBooking };
  };

  // Utility functions for date handling
  const isWednesday = (date: Date) => {
    const normalized = new Date(date);
    normalized.setHours(12, 0, 0, 0);
    return normalized.getDay() === 3;
  };

  // Check if a date falls within the week range starting from a Wednesday
  const isDateInWeekRange = (date: Date, startDate: Date) => {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    if (start.getDay() === 3) {
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return normalizedDate >= start && normalizedDate <= end;
    }
    
    return false;
  };

  // Get all days in a month for calendar display
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    return [
      ...Array(adjustedFirstDay).fill(null),
      ...Array(new Date(year, month + 1, 0).getDate())
        .fill(null)
        .map((_, i) => new Date(year, month, i + 1))
    ];
  };

  // Get className for calendar date buttons based on their state
  const getButtonClassName = (date: Date) => {
    const { isBooked, isOwnBooking } = isDateBooked(date);
    const today = new Date(new Date().setHours(12, 0, 0, 0));
    const dateToCheck = new Date(date);
    dateToCheck.setHours(12, 0, 0, 0);
    const isPastDate = dateToCheck < today;
    const isToday = isSameDay(dateToCheck, today);
  
    const isInSelectedWeek = selectedDates.some(selectedDate =>
      isSameDay(date, selectedDate) || isDateInWeekRange(date, selectedDate)
    );
  
    const isInHoverWeek = hoverDate && isDateInWeekRange(date, hoverDate);
    
    // Base classes with glassmorphism effect
    const baseClasses = "flex flex-col items-center justify-center h-full w-full p-1 backdrop-blur-sm transition-all duration-200 hover:bg-opacity-100";
    
    // Wednesday border with glassmorphism
    const wednesdayBorder = (isWednesday(date) && !isPastDate) 
      ? "border border-violet-200/50 rounded-lg" 
      : "";
    
    // Today border with gradient
    const todayBorder = isToday 
      ? "border-4 border-gray-800 rounded-lg" 
      : "";
  
    // Handle past dates
    if (isPastDate) {
      return `${baseClasses} ${wednesdayBorder} ${todayBorder} bg-gray-200/60 hover:bg-gray-200/80 text-gray-500 cursor-not-allowed`;
    }
  
    // Handle hover effects with glassmorphism
    if (isInHoverWeek) {
      if (isOwnBooking) {
        return `${baseClasses} ${wednesdayBorder} ${todayBorder} bg-indigo-300/80 hover:bg-indigo-300 text-indigo-800`;
      }
      if (isBooked) {
        return `${baseClasses} ${wednesdayBorder} ${todayBorder} bg-rose-300/80 hover:bg-rose-300 text-rose-800`;
      }
      return `${baseClasses} ${wednesdayBorder} ${todayBorder} bg-emerald-300/80 hover:bg-emerald-300 text-emerald-800`;
    }
  
    // Handle normal states with glassmorphism
    if (isOwnBooking) {
      return `${baseClasses} ${wednesdayBorder} ${todayBorder} bg-indigo-200/80 hover:bg-indigo-300/80 text-indigo-800`;
    }
    if (isBooked) {
      return `${baseClasses} ${wednesdayBorder} ${todayBorder} bg-rose-200/80 hover:bg-rose-300/80 text-rose-800 cursor-not-allowed`;
    }
    if (isInSelectedWeek) {
      return `${baseClasses} ${wednesdayBorder} ${todayBorder} bg-emerald-200/80 hover:bg-emerald-300/80 text-emerald-800`;
    }
    if (isWednesday(date)) {
      return `${baseClasses} ${wednesdayBorder} ${todayBorder} bg-emerald-200/80 hover:bg-emerald-300/80 text-emerald-800 cursor-pointer`;
    }
  
    return `${baseClasses} ${wednesdayBorder} ${todayBorder} bg-white/80 hover:bg-gray-100/80 text-gray-700`;
  };

  // Navigation handlers
  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  // Handle next month navigation
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  // Handle booking initiation
  const handleBookingClick = (date: Date) => {
    setDateToBook(date);
    setShowBookingModal(true);
  };
  
  // Handle booking cancellation initiation
  const handleCancelClick = (date: Date) => {
    setDateToCancel(date);
    setShowCancelModal(true);
  };
  
  // Handle booking details display
  const handleDetailsClick = (date: Date) => {
    const booking = allBookings.find(b => {
      const bookingStart = new Date(b.startTime);
      return isSameDay(bookingStart, date) && b.robotId === selectedRobot?.id;
    });
    
    if (booking) {
      setSelectedBookingDetails(booking);
      setShowDetailsModal(true);
    }
  };
// Main calendar component UI rendering
return (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
    <Navbar />
    <div className="p-4">
      <div className="max-w-8xl mx-auto">
        <div className="flex justify-center gap-8">
          {/* Left sidebar - Booking information and rules */}
          <div className="w-1/5 bg-white/60 backdrop-blur-lg rounded-xl border border-violet-200/50 shadow-lg p-6 h-fit sticky top-4">
            <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 mb-4">
              Information om uthyrning
            </h2>
            
            {/* Booking rules section */}
            <div className="space-y-4 text-gray-700">
              <div className="border-b border-violet-200/50 pb-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Bokningsregler
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-800">
                  <li>Bokning sker veckovis, onsdag till onsdag</li>
                  <li>Avhämtning och återlämning sker på onsdagar</li>
                  <li>Avbokning måste ske senast en vecka innan</li>
                </ul>
              </div>

              {/* Color coding legend */}
              <div className="border-b border-violet-200/50 pb-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Färgkodning
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-emerald-200 border border-emerald-300 rounded mr-2"></div>
                    <span className="text-gray-800">Tillgänglig Onsdag</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-indigo-200 border border-indigo-300 rounded mr-2"></div>
                    <span className="text-gray-800">Din bokning</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-rose-200 border border-rose-300 rounded mr-2"></div>
                    <span className="text-gray-800">Upptagen</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-gray-700 rounded mr-2"></div>
                    <span className="text-gray-800">Dagens datum</span>
                  </div>
                </div>
              </div>

              {/* Contact section */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Kontakt
                </h3>
                <p className="text-gray-800">Vid frågor kontakta support:</p>
                <p className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                  mobilealohafalkenberg@gmail.com
                </p>
              </div>
            </div>
          </div>

          {/* Center section - Main Calendar */}
          <div className="w-1/2">
            <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-violet-200/50 shadow-lg p-6">
              {/* Month navigation */}
              <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={handlePreviousMonth}
                    className="inline-flex items-center justify-center p-2 rounded-lg border border-violet-200/50 bg-white/80 text-gray-700 hover:bg-violet-50 transition-all duration-200"
                  >
                    ← Föregående
                  </button>

                  <h2 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                    {currentDate.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' })}
                  </h2>

                  <button
                    onClick={handleNextMonth}
                    disabled={isLoading}
                    className={`inline-flex items-center justify-center p-2 rounded-lg border border-violet-200/50 bg-white/80 text-gray-700 hover:bg-violet-50 transition-all duration-200 ${
                      isLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Nästa →
                  </button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 mb-2">
                  {['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'].map((day) => (
                    <div
                      key={day}
                      className="text-center font-semibold text-gray-700 py-1 text-lg"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-px bg-violet-200/20 rounded-lg overflow-hidden">
                  {getDaysInMonth(currentDate).map((date, index) => (
                    <div key={index} className="aspect-square">
                      {date && (
                        <button
                          onClick={() => {
                            if (!isWednesday(date)) return;
                            const dateToCheck = new Date(date);
                            dateToCheck.setHours(12, 0, 0, 0);
                            const today = new Date(new Date().setHours(12, 0, 0, 0));
                            
                            if (dateToCheck < today) return;
                            
                            const { isBooked, isOwnBooking } = isDateBooked(date);
                            
                            if (isOwnBooking) {
                              handleCancelClick(date);
                            } else if (isBooked) {
                              handleDetailsClick(date);
                            } else {
                              handleBookingClick(date);
                            }
                          }}
                          onMouseEnter={() => {
                            if (isWednesday(date) && date >= new Date()) {
                              setHoverDate(date);
                            }
                          }}
                          onMouseLeave={() => setHoverDate(null)}
                          disabled={date < new Date() || !isWednesday(date)}
                          className={getButtonClassName(date)}
                        >
                          <span className="text-2xl font-medium">{date.getDate()}</span>
                          {isWednesday(date) && date >= new Date() && (
                            <span className="text-xs mt-1 font-medium">
                              {isDateBooked(date).isOwnBooking && "Klicka för att avboka"}
                              {isDateBooked(date).isBooked && (
                                <>
                                  <div>Upptagen</div>
                                  <div>Klicka för info</div>
                                </>
                              )}
                              {!isDateBooked(date).isBooked && !isDateBooked(date).isOwnBooking && 
                                "Klicka för att boka!"}
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right section - Robot Selection and Holder Info */}
          <div className="w-1/5 space-y-4">
            {/* Robot selector */}
            <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-violet-200/50 shadow-lg p-6">
              <select
                value={selectedRobot?.id || ''}
                onChange={(e) => {
                  const robot = robots.find(r => r.id === Number(e.target.value));
                  setSelectedRobot(robot || null);
                  setSelectedDates([]);
                }}
                className="w-full px-3 py-2 rounded-lg border border-violet-200 bg-white/80 text-gray-800 hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all duration-200"
              >
                {robots.map((robot) => (
                  <option key={robot.id} value={robot.id}>
                    {robot.name} {!robot.isAvailable && '(Ej tillgänglig)'}
                  </option>
                ))}
              </select>
            </div>

              {/* Current holder information */}
              <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-violet-200/50 shadow-lg p-6">
                <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 mb-4">
                  Nuvarande innehavare
                </h3>

                <div className="space-y-4">
                  {currentHolder ? (
                    <>
                      <div>
                        <p className="text-lg font-medium text-gray-900">
                          {currentHolder.firstName} {currentHolder.lastName}
                        </p>
                        <p className="text-gray-700">{currentHolder.company || 'Inget företag angivet'}</p>
                        <p className="text-gray-700">{currentHolder.email}</p>
                        <p className="text-gray-700">{currentHolder.phone || 'Inget telefonnummer'}</p>
                        
                        <div className="mt-4 p-2 bg-violet-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700">Bokningsperiod:</p>
                          <p className="text-sm text-gray-600">
                            {new Date(currentHolder.startTime).toLocaleDateString('sv-SE')} - {' '}
                            {new Date(currentHolder.endTime).toLocaleDateString('sv-SE')}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500 mb-4">Ingen nuvarande innehavare</p>
                  )}
                </div>
              </div>

        {/* Modal components */}
        {/* Booking confirmation modal */}
        {showBookingModal && dateToBook && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-violet-200/50 shadow-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 mb-4">
                Bekräfta bokning
              </h2>
              <div className="space-y-2 py-4">
                <p className="text-gray-700">Är du säker på att du vill boka denna period?</p>
                <p className="font-medium text-gray-900">
                  {new Date(dateToBook).toLocaleDateString('sv-SE')} - 
                  {new Date(new Date(dateToBook).setDate(dateToBook.getDate() + 6)).toLocaleDateString('sv-SE')}
                </p>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  className="px-4 py-2 border border-violet-200 text-gray-700 rounded-lg hover:bg-violet-50 transition-colors"
                  onClick={() => setShowBookingModal(false)}
                >
                  Avbryt
                </button>
                <button
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700"
                  onClick={async () => {
                    if (!dateToBook || !selectedRobot) return;
                    try {
                      setIsLoading(true);
                      await handleDateSelection(dateToBook);
                      setShowBookingModal(false);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                >
                  Bekräfta bokning
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation confirmation modal */}
        {showCancelModal && dateToCancel && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-violet-200/50 shadow-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 mb-4">
                Bekräfta avbokning
              </h2>
              <div className="space-y-2 py-4">
                <p className="text-gray-700">Är du säker på att du vill avboka denna tid?</p>
                <p className="font-medium text-gray-900">
                  {new Date(dateToCancel).toLocaleDateString('sv-SE')} - 
                  {new Date(new Date(dateToCancel).setDate(dateToCancel.getDate() + 6)).toLocaleDateString('sv-SE')}
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
                  className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600"
                  onClick={async () => {
                    if (!dateToCancel) return;
                    try {
                      await handleCancelBooking(dateToCancel);
                      setShowCancelModal(false);
                    } catch (err) {
                      // Error handling is already in handleCancelBooking
                    }
                  }}
                >
                  Bekräfta avbokning
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Booking details modal */}
        {showDetailsModal && selectedBookingDetails && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-violet-200/50 shadow-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 mb-4">
                Bokningsinformation
              </h2>
              <div className="space-y-4 py-4">
                <p className="text-lg font-medium text-gray-900">
                  {selectedBookingDetails.user?.firstName} {selectedBookingDetails.user?.lastName}
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><span className="font-medium">Företag:</span> {selectedBookingDetails.user?.company || 'Ej angivet'}</p>
                  <p><span className="font-medium">Email:</span> {selectedBookingDetails.user?.email}</p>
                  <p><span className="font-medium">Telefon:</span> {selectedBookingDetails.user?.phone || 'Ej angivet'}</p>
                  <p><span className="font-medium">Period:</span> {' '}
                    {new Date(selectedBookingDetails.startTime).toLocaleDateString('sv-SE')} - 
                    {new Date(selectedBookingDetails.endTime).toLocaleDateString('sv-SE')}
                  </p>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  className="px-4 py-2 border border-violet-200 text-gray-700 rounded-lg hover:bg-violet-50 transition-colors"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Stäng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error message toast notification */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-50/90 backdrop-blur-sm border border-red-100 text-red-600 p-4 rounded-xl shadow-lg z-50">
            {error}
          </div>
        )}
      </div>
    </div>
  </div>
  </div>
  </div>
);
}