using RobotBokning.Models;

namespace RobotBokning.DTOs
{
    public class CalendarEventDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public DateTime Start { get; set; }
        public DateTime End { get; set; }
        public bool IsCurrentUserBooking { get; set; }
        public BookingStatus Status { get; set; }
    }
}
