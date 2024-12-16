using System.ComponentModel.DataAnnotations;

namespace RobotBokning.DTOs
{
    public class DocumentUploadDto
    {
        [Required]
        public string Title { get; set; }
        public string Description { get; set; }
        [Required]
        public string Type { get; set; }
        [Required]
        public IFormFile File { get; set; }
    }
}
