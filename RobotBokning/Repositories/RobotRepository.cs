using Microsoft.EntityFrameworkCore;
using RobotBokning.Data;
using RobotBokning.Models;

namespace RobotBokning.Repositories
{
    public interface IRobotRepository
    {
        Task<Robot> GetRobotByIdAsync(int id); // Make sure this is only for fetching by ID
        Task<List<Robot>> GetRobotsAsync();
        Task<Robot> CreateRobotAsync(Robot robot);
        Task<Robot> UpdateRobotAsync(Robot robot);
        Task DeleteRobotAsync(int id);
        Task<bool> HasActiveBookings(int robotId);
        Task<DateTime?> GetNextAvailableTimeAsync();
    }

    public class RobotRepository : IRobotRepository
    {
        private readonly ApplicationDbContext _context;

        public RobotRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Robot> GetRobotByIdAsync(int id)
        {
            return await _context.Robots
                .Include(r => r.Documents)
                .Include(r => r.Bookings)
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<List<Robot>> GetRobotsAsync()
        {
            return await _context.Robots
                .Include(r => r.Bookings)
                .ToListAsync();
        }

        public async Task<Robot> CreateRobotAsync(Robot robot)
        {
            _context.Robots.Add(robot);
            await _context.SaveChangesAsync();
            return robot;
        }

        public async Task<Robot> UpdateRobotAsync(Robot robot)
        {
            _context.Entry(robot).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return robot;
        }

        public async Task DeleteRobotAsync(int id)
        {
            var robot = await _context.Robots.FindAsync(id);
            if (robot != null)
            {
                _context.Robots.Remove(robot);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> HasActiveBookings(int robotId)
        {
            return await _context.Bookings
                .AnyAsync(b => b.Robot.Id == robotId &&
                              (b.Status == BookingStatus.Scheduled ||
                               b.Status == BookingStatus.InProgress));
        }

        public async Task<DateTime?> GetNextAvailableTimeAsync()
        {
            var currentBooking = await _context.Bookings
                .Where(b => (b.Status == BookingStatus.Scheduled ||
                            b.Status == BookingStatus.InProgress) &&
                           b.EndTime > DateTime.Now)
                .OrderBy(b => b.EndTime)
                .FirstOrDefaultAsync();

            return currentBooking?.EndTime;
        }
    }
}

