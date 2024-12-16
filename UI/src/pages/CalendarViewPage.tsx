import { useState, useEffect } from 'react';
import Navbar from '../components/NavBar';
import axios from '../lib/axios';
import { Robot, Booking, NextBooking, CurrentHolder } from '../interface/index';

export default function CalendarView() {
  // Core state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);      
  const [allBookings, setAllBookings] = useState<Booking[]>([]); 
  const [robots, setRobots] = useState<Robot[]>([]);
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);

  // Booking state
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentHolder, setCurrentHolder] = useState<CurrentHolder | null>(null);
  const [nextBooking, setNextBooking] = useState<NextBooking | null>(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<Booking | null>(null);
  const [dateToCancel, setDateToCancel] = useState<Date | null>(null);
  const [dateToBook, setDateToBook] = useState<Date | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []); 

  useEffect(() => {
    if (selectedRobot?.id) {
      fetchHolderInfo();
    }
  }, [selectedRobot?.id]); 

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [allBookingsRes, myBookingsRes, robotsRes] = await Promise.all([
        axios.get('/api/bookings/all-bookings'),
        axios.get('/api/bookings/my-bookings'),
        axios.get<Robot[]>('/api/robot')
      ]);
      
      setAllBookings(allBookingsRes.data);
      setBookings(myBookingsRes.data);
      setRobots(robotsRes.data);
      if (robotsRes.data.length > 0) {
        setSelectedRobot(robotsRes.data[0]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Kunde inte hämta data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelection = async (date: Date) => {
    if (!selectedRobot) return;

    const normalizedDate = new Date(date);
    normalizedDate.setHours(12, 0, 0, 0);

    if (normalizedDate.getDay() !== 3) return;

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
      alert('Bokning skapad!');
    } catch (err: any) {
      console.error('Booking error:', err);
      setError(err.message || 'Kunde inte skapa bokning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (date: Date) => {
    if (!window.confirm('Är du säker på att du vill avboka denna tid?')) return;

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
      alert('Bokningen har avbokats');
    } catch (err: any) {
      console.error('Cancel booking error:', err);
      setError(err.response?.data || 'Kunde inte avboka tiden');
    }
  };

  const isSameDay = (date1: Date, date2: Date) => 
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();

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

  const isWednesday = (date: Date) => {
    const normalized = new Date(date);
    normalized.setHours(12, 0, 0, 0);
    return normalized.getDay() === 3;
  };

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
    const baseClasses = "flex flex-col items-center justify-center h-full w-full p-1";
    
    // Basram för onsdagar
    const wednesdayBorder = (isWednesday(date) && !isPastDate) ? "border border-gray-700 rounded-lg" : "";
    
    // Tjockare ram för dagens datum
    const todayBorder = isToday ? "border-4 border-gray-700 rounded-lg" : "";
  
    // Hantera förflutna datum
    if (isPastDate) {
      return `${baseClasses} ${wednesdayBorder} ${todayBorder} bg-gray-200 text-gray-700 cursor-not-allowed`;
    }
  
    // Hantera hover effects
    if (isInHoverWeek) {
      if (isOwnBooking) {
        return `${baseClasses} ${wednesdayBorder} ${todayBorder} bg-indigo-300 text-indigo-800`;
      }
      if (isBooked){
        return `${baseClasses} ${wednesdayBorder} ${todayBorder} bg-rose-300 text-rose-800`;
      }
      return `${baseClasses} ${wednesdayBorder} ${todayBorder} bg-emerald-300 text-emerald-800`;
    }
  
    // Hantera normala tillstånd
    if (isOwnBooking) {
      return `${baseClasses} ${wednesdayBorder} ${todayBorder} bg-indigo-200 text-indigo-800`;
    }
    if (isBooked) {
      return `${baseClasses} ${wednesdayBorder} ${todayBorder} bg-rose-200 text-rose-800 ${isWednesday(date) ? 'cursor-pointer' : ''}`;
    }
    if (isInSelectedWeek) {
      return `${baseClasses} ${wednesdayBorder} ${todayBorder} bg-emerald-200 text-emerald-800`;
    }
    if (isWednesday(date)) {
      return `${baseClasses} ${wednesdayBorder} ${todayBorder} bg-emerald-200 text-emerald-800`;
    }
  
    return `${baseClasses} ${wednesdayBorder} ${todayBorder} bg-white/80 text-gray-700`;
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const fetchHolderInfo = async () => {
    if (!selectedRobot?.id) return;
    
    try {
      const currentDate = new Date();
      console.log('Fetching data for robot:', selectedRobot.id);
      
      const [currentHolderRes, nextBookingRes] = await Promise.all([
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

      setCurrentHolder(currentHolderRes.data);
      setNextBooking(nextBookingRes.data);
    } catch (err) {
      console.error('Error fetching holder info:', err);
    }
  };
  const handleBookingClick = (date: Date) => {
    setDateToBook(date);
    setShowBookingModal(true);
  };
  
  const handleCancelClick = (date: Date) => {
    setDateToCancel(date);
    setShowCancelModal(true);
  };
  
  const handleDetailsClick = (date: Date) => {
    const booking = allBookings.find(b => {
      const bookingStart = new Date(b.startTime);
      return isSameDay(bookingStart, date);
    });
    
    if (booking) {
      setSelectedBookingDetails(booking);
      setShowDetailsModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400">
      <Navbar />
      <div className="p-4">
        <div className="max-w-8xl mx-auto">
          <div className="flex justify-center gap-8">
            {/* Left sidebar */}
            <div className="w-1/5 bg-white/60 backdrop-blur-lg rounded-xl border border-gray-200/50 shadow-lg p-6 h-fit sticky top-4">
              <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-indigo-700 mb-4">
                Information om uthyrning
              </h2>
              
              <div className="space-y-4 text-gray-700">
                <div className="border-b border-gray-200/50 pb-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    Bokningsregler
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-800">
                    <li>Bokning sker veckovis, onsdag till onsdag</li>
                    <li>Avhämtning och återlämning sker på onsdagar</li>
                    <li>Avbokning måste ske senast en vecka innan</li>
                  </ul>
                </div>

                <div className="border-b border-gray-200/50 pb-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    Färgkodning
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-emerald-200 border border-emerald-500/50 rounded mr-2"></div>
                      <span className="text-gray-800">Tillgänglig Onsdag</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-indigo-200 border border-indigo-500/50 rounded mr-2"></div>
                      <span className="text-gray-800">Din bokning</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-rose-200 border border-rose-500/50 rounded mr-2"></div>
                      <span className="text-gray-800">Upptagen</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    Kontakt
                  </h3>
                  <p className="text-gray-800">Vid frågor kontakta support:</p>
                  <p className="font-medium text-indigo-600">support@example.com</p>
                </div>
              </div>
            </div>

            {/* Center section - Calendar */}
            <div className="w-1/2">
              <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-gray-200/50 shadow-lg p-4">
              {/* Month Navigation */}
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-center w-full">
                    <button
                      onClick={handlePreviousMonth}
                      className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-300 shadow-lg backdrop-blur-sm bg-white/80 text-gray-700 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span className="ml-1">Föregående</span>
                    </button>
                    
                    <h2 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-indigo-700 px-4">
                      {currentDate.toLocaleDateString('sv-SE', {
                        year: 'numeric',
                        month: 'long'
                      })}
                    </h2>
                    
                    <button
                      onClick={handleNextMonth}
                      className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-300 shadow-lg backdrop-blur-sm bg-white/80 text-gray-700 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      <span className="mr-1">Nästa</span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

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
                </div>

                <div className="grid grid-cols-7 gap-0">
                  {getDaysInMonth(currentDate).map((date, index) => {
                    // Räkna ut vilken vecka i månaden vi är på
                    const weekNumber = Math.floor(index / 7);
                    // Sista cellen i varje vecka kommer att ha border-bottom
                    const isInWeekWithBorder = weekNumber < Math.floor((getDaysInMonth(currentDate).length - 1) / 7);
                    
                    return (
                      <div
                        key={index}
                        className={`aspect-square ${isInWeekWithBorder ? 'border-b border-gray-500/50' : ''}`}
                      >
                      {date ? (
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
                            const today = new Date(new Date().setHours(0, 0, 0, 0));
                            const dateToCheck = new Date(date);
                            dateToCheck.setHours(0, 0, 0, 0);

                            if (isWednesday(date) && dateToCheck >= today) {
                              const hoverDateToSet = new Date(dateToCheck);
                              hoverDateToSet.setHours(12, 0, 0, 0);
                              setHoverDate(hoverDateToSet);
                            }
                          }}
                          onMouseLeave={() => setHoverDate(null)}
                          disabled={
                            new Date(date.setHours(0,0,0,0)) < new Date(new Date().setHours(0,0,0,0)) ||
                            (!isWednesday(date))
                          }
                          className={`${getButtonClassName(date)} flex flex-col items-center justify-center h-full w-full p-1`}
                        >
                          <span className="text-3xl font-medium">{date.getDate()}</span>
                          {isWednesday(date) && new Date(date) >= new Date(new Date().setHours(0,0,0,0)) && (
                            <span className="text-xs mt-1 font-medium whitespace-normal text-center">
                              {isDateBooked(date).isOwnBooking && "Klicka för att avboka"}
                              {isDateBooked(date).isBooked && (
                                <div className="text-xs mt-1 font-medium whitespace-normal text-center">
                                  <div>Upptagen</div>
                                  <div>Klicka för info</div>
                                </div>
                              )}
                              {!isDateBooked(date).isBooked && !isDateBooked(date).isOwnBooking && "Klicka för att boka!"}
                            </span>
                          )}
                        </button>
                      ) : (
                        <div className="w-full h-full"></div>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right section */}
            <div className="w-1/5 space-y-4">
              {/* Robot Selection */}
              <div className="bg-white/30 backdrop-blur-lg rounded-xl border border-gray-300/30 shadow-lg p-5 space-y-4">
                <div className="space-y-4">
                  <div className="relative">
                    <select
                      value={selectedRobot?.id || ''}
                      onChange={(e) => {
                        const robot = robots.find(r => r.id === Number(e.target.value));
                        setSelectedRobot(robot || null);
                        setSelectedDates([]);
                      }}
                      className="block w-full pl-3 pr-10 py-1.5 text-sm bg-white/80 text-gray-800 border border-gray-300 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400"
                    >
                      {robots.map((robot) => (
                        <option key={robot.id} value={robot.id}>
                          {robot.name} {!robot.isAvailable && '(Ej tillgänglig)'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Booking Modal */}
        {showBookingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Bekräfta bokning</h2>
              <div className="space-y-2 py-4">
                <p>Är du säker på att du vill boka denna period?</p>
                {dateToBook && (
                  <p className="font-medium">
                    {new Date(dateToBook).toLocaleDateString('sv-SE')} - {new Date(new Date(dateToBook).setDate(dateToBook.getDate() + 6)).toLocaleDateString('sv-SE')}
                  </p>
                )}
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button 
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  onClick={() => setShowBookingModal(false)}
                >
                  Avbryt
                </button>
                <button 
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  onClick={async () => {
                    if (!dateToBook || !selectedRobot) return;
                    
                    try {
                      setIsLoading(true);
                      const startDate = new Date(dateToBook);
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
                      setShowBookingModal(false);
                    } catch (err: any) {
                      console.error('Booking error:', err);
                      setError(err.message || 'Kunde inte skapa bokning');
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

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Bekräfta avbokning</h2>
              <div className="space-y-2 py-4">
                <p>Är du säker på att du vill avboka denna tid?</p>
                {dateToCancel && (
                  <p className="font-medium">
                    {new Date(dateToCancel).toLocaleDateString('sv-SE')} - {new Date(new Date(dateToCancel).setDate(dateToCancel.getDate() + 6)).toLocaleDateString('sv-SE')}
                  </p>
                )}
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button 
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  onClick={() => setShowCancelModal(false)}
                >
                  Avbryt
                </button>
                <button 
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                  onClick={async () => {
                    if (!dateToCancel) return;
                    
                    try {
                      const booking = bookings.find(booking => 
                        isSameDay(new Date(booking.startTime), dateToCancel)
                      );

                      if (!booking) {
                        setError('Kunde inte hitta bokningen');
                        return;
                      }

                      await axios.delete(`/api/bookings/${booking.id}`);
                      setBookings(prev => prev.filter(b => b.id !== booking.id));
                      setAllBookings(prev => prev.filter(b => b.id !== booking.id));
                      await fetchHolderInfo();
                      setShowCancelModal(false);
                    } catch (err: any) {
                      console.error('Cancel booking error:', err);
                      setError(err.response?.data || 'Kunde inte avboka tiden');
                    }
                  }}
                >
                  Bekräfta avbokning
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Bokningsinformation</h2>
              <div className="space-y-2 py-4">
                {selectedBookingDetails && (
                  <div className="space-y-2">
                    <p className="text-lg font-medium">
                      {selectedBookingDetails.user?.firstName} {selectedBookingDetails.user?.lastName}
                    </p>
                    <p><strong className="text-gray-900">Företag:</strong> {selectedBookingDetails.user?.company || 'Ej angivet'}</p>
                    <p><strong className="text-gray-900">Email:</strong> {selectedBookingDetails.user?.email || 'Ej angivet'}</p>
                    <p><strong className="text-gray-900">Telefon:</strong> {selectedBookingDetails.user?.phone || 'Ej angivet'}</p>
                    <p><strong className="text-gray-900">Bokad:</strong> {new Date(selectedBookingDetails.startTime).toLocaleDateString('sv-SE')} - {new Date(selectedBookingDetails.endTime).toLocaleDateString('sv-SE')}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-4">
                <button 
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Stäng
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}