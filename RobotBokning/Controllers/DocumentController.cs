using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RobotBokning.DTOs;
using RobotBokning.Models;
using RobotBokning.Repositories;

namespace RobotBokning.Controllers
{
    // Controller for managing robot-related documents, requires authentication
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentController : ControllerBase
    {
        // Dependencies for document management
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

        // Upload document for a specific robot (admin only)
        [HttpPost("robot/{robotId}")]
        public async Task<IActionResult> UploadDocument(int robotId, [FromForm] DocumentUploadDto dto)
        {
            try
            {
                // Check admin permission
                if (!User.IsInRole("Admin"))
                    return Forbid();

                // Validate file
                if (dto.File == null || dto.File.Length == 0)
                    return BadRequest("Ingen fil har laddats upp");

                // Ensure wwwroot path exists
                if (string.IsNullOrEmpty(_webHostEnvironment.WebRootPath))
                {
                    _webHostEnvironment.WebRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                }

                // Determine folder based on file type
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
                        return BadRequest("Ogiltig filtyp");
                }

                // Create upload directory
                var fullUploadsPath = Path.Combine(_webHostEnvironment.WebRootPath, "uploads", uploadsFolder);
                Directory.CreateDirectory(fullUploadsPath);

                // Generate unique filename
                var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(dto.File.FileName)}";
                var filePath = Path.Combine(fullUploadsPath, fileName);

                // Save file to disk
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await dto.File.CopyToAsync(stream);
                }

                // Create database record
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
                return StatusCode(500, "Ett internt fel uppstod vid uppladdning av dokumentet");
            }
        }

        // Delete document (admin only)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDocument(int id)
        {
            if (!User.IsInRole("Admin"))
                return Forbid();

            var document = await _documentRepository.GetByIdAsync(id);
            if (document == null)
                return NotFound("Dokumentet hittades inte");

            // Remove physical file
            var filePath = Path.Combine(_webHostEnvironment.WebRootPath, document.FilePath.TrimStart('/'));
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }

            // Remove database record
            await _documentRepository.DeleteAsync(document);
            return NoContent();
        }
    }
}