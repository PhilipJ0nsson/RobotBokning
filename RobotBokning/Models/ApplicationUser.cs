using Microsoft.AspNetCore.Identity;

namespace RobotBokning.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Company {  get; set; }
        public string Phone {  get; set; }
        public DateTime Created { get; set; } = DateTime.Now;
        public bool IsActive { get; set; } = true;

        // Navigation property
        public ICollection<Booking> Bookings { get; set; }
    }
}
