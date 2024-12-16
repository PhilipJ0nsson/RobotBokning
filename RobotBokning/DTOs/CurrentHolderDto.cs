﻿namespace RobotBokning.DTOs
{
    public class CurrentHolderDto
    {
        public string Id { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Company { get; set; }
        public string Phone { get; set; }
        public string Token { get; set; }
        public bool IsAdmin { get; set; }
        public DateTime StartTime { get; set; }  // Från BookingDto
        public DateTime EndTime { get; set; }    // Från BookingDto
    }
}
