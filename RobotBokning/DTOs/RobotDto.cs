namespace RobotBokning.DTOs
{
    public class RobotDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public bool IsAvailable { get; set; }
        public DateTime? NextAvailableTime { get; set; }
        public List<DocumentDto> Documents { get; set; }
    }
}
