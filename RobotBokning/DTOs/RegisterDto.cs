namespace RobotBokning.DTOs
{
    public class RegisterDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Password { get; set; }
        public string Company { get; set; }
        public bool IsAdmin { get; set; }
    }
}
