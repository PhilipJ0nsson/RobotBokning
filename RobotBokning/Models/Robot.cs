using System.Reflection.Metadata;

namespace RobotBokning.Models
{
    public class Robot
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public bool IsAvailable { get; set; }
        public ICollection<Booking> Bookings { get; set; }
        public ICollection<Document> Documents { get; set; }
    }
}
