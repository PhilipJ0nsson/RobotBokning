using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RobotBokning.DTOs;
using RobotBokning.Models;
using RobotBokning.Repositories;

namespace RobotBokning.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentController : ControllerBase
    {
        private readonly IDocumentRepository _documentRepository;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly IMapper _mapper;
        private readonly ILogger<DocumentController> _logger;

        public DocumentController(
            IDocumentRepository documentRepository,
            IWebHostEnvironment webHostEnvironment,
            IMapper mapper,
            ILogger<DocumentController> logger)
        {
            _documentRepository = documentRepository;
            _webHostEnvironment = webHostEnvironment;
            _mapper = mapper;
            _logger = logger;
        }

        [HttpPost("robot/{robotId}")]
        public async Task<IActionResult> UploadDocument(int robotId, [FromForm] DocumentUploadDto dto)
        {
            try
            {
                if (!User.IsInRole("Admin"))
                    return Forbid();

                if (dto.File == null || dto.File.Length == 0)
                    return BadRequest("No file uploaded");

                // Säkerställ att WebRootPath finns
                if (string.IsNullOrEmpty(_webHostEnvironment.WebRootPath))
                {
                    _webHostEnvironment.WebRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                }

                // Validera och skapa filtyps-mapp
                string uploadsFolder;
                switch (dto.Type.ToLower())
                {
                    case "image":
                        uploadsFolder = "images";
                        break;
                    case "pdf":
                        uploadsFolder = "pdf";
                        break;
                    case "text":
                        uploadsFolder = "text";
                        break;
                    default:
                        return BadRequest("Invalid file type");
                }

                // Skapa mappar om de inte finns
                var fullUploadsPath = Path.Combine(_webHostEnvironment.WebRootPath, "uploads", uploadsFolder);
                Directory.CreateDirectory(fullUploadsPath);

                // Skapa unikt filnamn
                var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(dto.File.FileName)}";
                var filePath = Path.Combine(fullUploadsPath, fileName);

                // Spara filen
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await dto.File.CopyToAsync(stream);
                }

                // Skapa dokument i databasen
                var document = new Document
                {
                    Title = dto.Title,
                    Description = dto.Description,
                    FilePath = $"/uploads/{uploadsFolder}/{fileName}",
                    UploadDate = DateTime.UtcNow,
                    Type = dto.Type,
                    RobotId = robotId
                };

                await _documentRepository.AddAsync(document);
                return Ok(_mapper.Map<DocumentDto>(document));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading document");
                return StatusCode(500, "Internal server error while uploading document");
            }
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDocument(int id)
        {
            if (!User.IsInRole("Admin"))
                return Forbid();

            var document = await _documentRepository.GetByIdAsync(id);
            if (document == null)
                return NotFound();

            // Ta bort filen från filsystemet
            var filePath = Path.Combine(_webHostEnvironment.WebRootPath, document.FilePath.TrimStart('/'));
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }

            // Ta bort från databasen
            await _documentRepository.DeleteAsync(document);
            return NoContent();
        }
    }
}
