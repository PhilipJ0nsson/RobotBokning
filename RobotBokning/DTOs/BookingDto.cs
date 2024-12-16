using RobotBokning.Models;

namespace RobotBokning.DTOs
{
    public class BookingDto
    {
        public int Id { get; set; }
        public int RobotId { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public BookingStatus Status { get; set; }
        public string UserId { get; set; }
        public BookingUserDto User { get; set; }
    }
}
