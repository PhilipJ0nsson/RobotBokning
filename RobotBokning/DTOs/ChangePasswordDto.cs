using System.ComponentModel.DataAnnotations;

namespace RobotBokning.DTOs
{
    public class ChangePasswordDto
    {
        [Required(ErrorMessage = "Nuvarande lösenord krävs")]
        public string CurrentPassword { get; set; }

        [Required(ErrorMessage = "Nytt lösenord krävs")]
        [StringLength(100, MinimumLength = 6,
            ErrorMessage = "Lösenordet måste vara minst 6 tecken långt och innehålla minst en stor bokstav (A-Z), en liten bokstav (a-z) och en siffra (0-9)")]
        public string NewPassword { get; set; }
    }
}
