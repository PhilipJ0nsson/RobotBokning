using System.ComponentModel.DataAnnotations;

namespace RobotBokning.DTOs
{
    public class CreateRobotDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [StringLength(500)]
        public string Description { get; set; }
    }
}
