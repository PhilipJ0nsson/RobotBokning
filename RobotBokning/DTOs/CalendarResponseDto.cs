namespace RobotBokning.DTOs
{
    public class CalendarResponseDto
    {
        public List<CalendarEventDto> Events { get; set; }
        public bool RobotAvailable { get; set; }
        public BusinessHoursDto BusinessHours { get; set; }
    }
}
