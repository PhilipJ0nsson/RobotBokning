using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using RobotBokning.Data;
using RobotBokning.DTOs;
using RobotBokning.Models;
using RobotBokning.Repositories;
using System.Security.Claims;

namespace RobotBokning.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class BookingsController : ControllerBase
    {
        private readonly IBookingRepository _bookingRepository;
        private readonly IRobotRepository _robotRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<BookingsController> _logger;

        public BookingsController(
            IBookingRepository bookingRepository,
            IRobotRepository robotRepository,
            IMapper mapper,
            ILogger<BookingsController> logger)
        {
            _bookingRepository = bookingRepository;
            _robotRepository = robotRepository;
            _mapper = mapper;
            _logger = logger;
        }
        [HttpPost]
        public async Task<ActionResult<BookingDto>> CreateBooking(CreateBookingDto dto)
        {
            try
            {
                var startDate = dto.StartTime.Date;

                // Kontrollera att det är en onsdag
                if (startDate.DayOfWeek != DayOfWeek.Wednesday)
                {
                    return BadRequest("Bokningar kan endast starta på onsdagar");
                }

                // Sätt sluttiden till nästa tisdag (6 dagar framåt) istället för onsdag
                var endDate = startDate.AddDays(6);  // Ändrat från 7 till 6 dagar

                var isAvailable = await _bookingRepository.IsTimeSlotAvailableAsync(startDate, endDate);

                if (!isAvailable)
                {
                    return BadRequest("Vald vecka är inte tillgänglig");
                }

                var booking = _mapper.Map<Booking>(dto);
                booking.UserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                booking.Status = BookingStatus.Scheduled;
                booking.StartTime = startDate;
                booking.EndTime = endDate;  // Nu blir detta en tisdag

                booking = await _bookingRepository.CreateAsync(booking);
                return _mapper.Map<BookingDto>(booking);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create booking");
                return BadRequest($"Failed to create booking: {ex.Message}");
            }
        }
        [HttpGet("{id}")]
        public async Task<ActionResult<BookingDto>> GetBooking(int id)
        {
            var booking = await _bookingRepository.GetByIdAsync(id);
            if (booking == null)
                return NotFound();

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (booking.UserId != userId && !User.IsInRole("Admin"))
                return Forbid();

            return _mapper.Map<BookingDto>(booking);
        }

        [HttpGet("my-bookings")]
        public async Task<ActionResult<List<BookingDto>>> GetMyBookings()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var bookings = await _bookingRepository.GetUserBookingsAsync(userId);

            return _mapper.Map<List<BookingDto>>(bookings);
        }

        [HttpGet("all-bookings")]
        public async Task<ActionResult<List<BookingDto>>> GetAllBookings()
        {
            var bookings = await _bookingRepository.GetAllBookingsAsync();
            // Använd AutoMapper istället för manuell mappning
            return _mapper.Map<List<BookingDto>>(bookings);
        }

        [HttpGet("current-holder/{robotId}")]
        public async Task<ActionResult<CurrentHolderDto>> GetCurrentHolder(int robotId, [FromQuery] DateTime date)
        {
            try
            {
                var latestBooking = await _bookingRepository.GetLatestBookingForRobotAsync(robotId, date);

                if (latestBooking == null)
                    return NotFound("Ingen bokning hittades för denna robot.");

                var user = latestBooking.User;
                if (user == null)
                    return NotFound("Ingen användare är associerad med bokningen.");

                return _mapper.Map<CurrentHolderDto>(latestBooking);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Misslyckades att hämta nuvarande innehavare.");
                return BadRequest($"Ett fel uppstod: {ex.Message}");
            }
        }
        [HttpGet("next-booking/{robotId}")]
        public async Task<ActionResult<NextBookingDto>> GetNextBooking(int robotId, [FromQuery] DateTime date)
        {
            try
            {
                var nextBooking = await _bookingRepository.GetNextBookingForRobotAsync(robotId, date);
                if (nextBooking == null)
                {
                    return NotFound("Ingen framtida bokning för roboten.");
                }

                var nextBookingDto = new NextBookingDto
                {
                    FirstName = nextBooking.User.FirstName,
                    LastName = nextBooking.User.LastName,
                    Company = nextBooking.User.Company,
                    Phone = nextBooking.User.Phone,
                    Email = nextBooking.User.Email,
                    StartTime = nextBooking.StartTime.ToString("yyyy-MM-dd HH:mm"),
                    EndTime = nextBooking.EndTime.ToString("yyyy-MM-dd HH:mm"),
                    Description = nextBooking.Description,
                    Status = nextBooking.Status.ToString()
                };
                return Ok(nextBookingDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ett fel uppstod när nästa bokning hämtades.");
                return BadRequest("Ett fel uppstod.");
            }
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBooking(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var booking = await _bookingRepository.GetByIdAsync(id);

            if (booking == null)
                return NotFound();

            // Kontrollera att det är användarens egen bokning
            if (booking.UserId != userId && !User.IsInRole("Admin"))
                return Forbid();

            await _bookingRepository.DeleteAsync(booking);
            return NoContent();
        }
    }
}

