using System.ComponentModel.DataAnnotations;

namespace RobotBokning.DTOs
{
    public class CreateBookingDto
    {
        [Required]
        public int RobotId { get; set; }
        [Required]
        public DateTime StartTime { get; set; }
        [Required]
        public DateTime EndTime { get; set; }
    }
}
