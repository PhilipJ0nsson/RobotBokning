﻿using System.ComponentModel.DataAnnotations;

namespace RobotBokning.DTOs
{
    public class ResetPasswordDto
    {
        [Required(ErrorMessage = "Email är obligatoriskt")]
        [EmailAddress(ErrorMessage = "Ogiltig emailadress")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Token saknas")]
        public string Token { get; set; }

        [Required(ErrorMessage = "Lösenord krävs")]
        [StringLength(100, MinimumLength = 6,
            ErrorMessage = "Lösenordet måste vara minst 6 tecken långt och innehålla minst en stor bokstav (A-Z), en liten bokstav (a-z) och en siffra (0-9)")]
        public string NewPassword { get; set; }
    }
}
