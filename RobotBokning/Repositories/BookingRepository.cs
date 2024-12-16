using Microsoft.EntityFrameworkCore;
using RobotBokning.Data;
using RobotBokning.Models;

namespace RobotBokning.Repositories
{
    public interface IBookingRepository
    {
        Task<Booking> GetByIdAsync(int id);
        Task<List<Booking>> GetUserBookingsAsync(string userId);
        Task<List<Booking>> GetAllBookingsAsync();
        Task<List<Booking>> GetBookingsForPeriodAsync(DateTime start, DateTime end);
        Task<Booking> GetLatestBookingForRobotAsync(int robotId, DateTime date);
        Task<Booking> GetNextBookingForRobotAsync(int robotId, DateTime currentDate);
        Task<bool> IsTimeSlotAvailableAsync(DateTime start, DateTime end);
        Task<Booking> CreateAsync(Booking booking);
        Task<Booking> UpdateAsync(Booking booking);
        Task DeleteAsync(Booking booking);
    }
    public class BookingRepository : IBookingRepository
    {
        private readonly ApplicationDbContext _context;

        public BookingRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Booking> GetByIdAsync(int id)
        {
            return await _context.Bookings
                .Include(b => b.User)
                .FirstOrDefaultAsync(b => b.Id == id);
        }

        public async Task<List<Booking>> GetUserBookingsAsync(string userId)
        {
            return await _context.Bookings
                .Where(b => b.UserId == userId)
                .OrderByDescending(b => b.StartTime)
                .ToListAsync();
        }

        public async Task<List<Booking>> GetBookingsForPeriodAsync(DateTime start, DateTime end)
        {
            return await _context.Bookings
                .Include(b => b.User)
                .Where(b => b.StartTime >= start &&
                           b.EndTime <= end &&
                           (b.Status == BookingStatus.Scheduled || b.Status == BookingStatus.InProgress))
                .ToListAsync();
        }
        public async Task<List<Booking>> GetAllBookingsAsync()
        {
            return await _context.Bookings
                .Include(b => b.User)
                .Where(b => b.Status == BookingStatus.Scheduled || b.Status == BookingStatus.InProgress)
                .OrderByDescending(b => b.StartTime)
                .ToListAsync();
        }
        public async Task<Booking> GetLatestBookingForRobotAsync(int robotId, DateTime date)
        {
            return await _context.Bookings
                .Include(b => b.User)
                .Where(b => b.RobotId == robotId &&
                           (b.StartTime <= date && b.EndTime >= date) || // Pågående bokning
                           b.EndTime < date)                             // Tidigare bokningar
                .OrderByDescending(b => b.EndTime)
                .FirstOrDefaultAsync();
        }
        public async Task<Booking> GetNextBookingForRobotAsync(int robotId, DateTime currentDate)
        {
            // Hämta alla bokningar för roboten som är framtida
            var bookings = await _context.Bookings
                .Include(b => b.User)
                .Where(b => b.RobotId == robotId && b.StartTime > currentDate)
                .OrderBy(b => b.StartTime)
                .ToListAsync();

            // Returnera den första bokningen som är planerad efter currentDate
            return bookings.FirstOrDefault();
        }
        public async Task<bool> IsTimeSlotAvailableAsync(DateTime startTime, DateTime endTime)
        {
            var existingBooking = await _context.Bookings
                .Where(b => b.Status != BookingStatus.Cancelled)
                .AnyAsync(b =>
                    (b.StartTime <= endTime && b.EndTime >= startTime) || // Överlappar med befintlig bokning
                    (b.StartTime.Date >= startTime.Date && b.StartTime.Date <= endTime.Date) // Inom datumintervallet
                );
            return !existingBooking;
        }

        public async Task<Booking> CreateAsync(Booking booking)
        {
            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();
            return booking;
        }

        public async Task<Booking> UpdateAsync(Booking booking)
        {
            _context.Entry(booking).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return booking;
        }
        public async Task DeleteAsync(Booking booking)
        {
            _context.Bookings.Remove(booking);
            await _context.SaveChangesAsync();
        }
    }
}
