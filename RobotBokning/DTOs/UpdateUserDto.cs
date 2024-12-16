using System.ComponentModel.DataAnnotations;

namespace RobotBokning.DTOs
{
    public class UpdateUserDto
    {
        [Required]
        public string FirstName { get; set; }
        [Required]
        public string LastName { get; set; }
        public string Company { get; set; }
        public string Phone { get; set; }
    }
}
