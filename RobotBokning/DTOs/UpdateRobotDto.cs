using System.ComponentModel.DataAnnotations;

namespace RobotBokning.DTOs
{
    public class UpdateRobotDto
    {
        [Required]
        public string Name { get; set; }
        [Required]
        public string Description { get; set; }
        public bool IsAvailable { get; set; }
    }
}
