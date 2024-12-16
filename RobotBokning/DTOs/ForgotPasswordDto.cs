using System.ComponentModel.DataAnnotations;

namespace RobotBokning.DTOs
{
    public class ForgotPasswordDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
    }
}
