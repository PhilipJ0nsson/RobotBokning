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
    // Controller for managing robot bookings, requires authentication
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class BookingsController : ControllerBase
    {
        // Dependencies for booking management
        private readonly IBookingRepository _bookingRepository;
        private readonly IRobotRepository _robotRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<BookingsController> _logger;
        private readonly IUserRepository _userRepository;

        public BookingsController(
            IBookingRepository bookingRepository,
            IRobotRepository robotRepository,
            IMapper mapper,
            ILogger<BookingsController> logger,
            IUserRepository userRepository)
        {
            _bookingRepository = bookingRepository;
            _robotRepository = robotRepository;
            _mapper = mapper;
            _logger = logger;
            _userRepository = userRepository;
        }

        // Create new booking - only allows Wednesday starts
        [HttpPost]
        public async Task<ActionResult<BookingDto>> CreateBooking(CreateBookingDto dto)
        {
            try
            {
                var startDate = dto.StartTime.Date;

                // Validate booking day
                if (startDate.DayOfWeek != DayOfWeek.Wednesday)
                {
                    return BadRequest("Bokningar kan endast starta på onsdagar");
                }

                // Check robot availability
                var robot = await _robotRepository.GetRobotByIdAsync(dto.RobotId);
                if (robot == null)
                {
                    return BadRequest("Ogiltig robot-ID");
                }
                if (!robot.IsAvailable)
                {
                    return BadRequest("Roboten är inte tillgänglig för bokning");
                }

                var endDate = startDate.AddDays(6);

                // Check if time slot is available
                var isAvailable = await _bookingRepository.IsTimeSlotAvailableAsync(dto.RobotId, startDate, endDate);
                if (!isAvailable)
                {
                    return BadRequest("Vald vecka är inte tillgänglig");
                }

                // Create booking
                var booking = _mapper.Map<Booking>(dto);
                booking.UserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                booking.Status = BookingStatus.Scheduled;
                booking.StartTime = startDate;
                booking.EndTime = endDate;

                booking = await _bookingRepository.CreateAsync(booking);
                return CreatedAtAction(nameof(GetBooking), new { id = booking.Id }, _mapper.Map<BookingDto>(booking));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create booking for robot {RobotId}", dto.RobotId);
                return BadRequest($"Kunde inte skapa bokning: {ex.Message}");
            }
        }

        // Get specific booking details
        [HttpGet("{id}")]
        public async Task<ActionResult<BookingDto>> GetBooking(int id)
        {
            var booking = await _bookingRepository.GetByIdAsync(id);
            if (booking == null)
                return NotFound("Bokningen hittades inte");

            // Check user permission
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (booking.UserId != userId && !User.IsInRole("Admin"))
                return Forbid();

            return _mapper.Map<BookingDto>(booking);
        }

        // Get current user's bookings
        [HttpGet("my-bookings")]
        public async Task<ActionResult<List<BookingDto>>> GetMyBookings()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var bookings = await _bookingRepository.GetUserBookingsAsync(userId);
            return _mapper.Map<List<BookingDto>>(bookings);
        }

        // Get all bookings (admin access)
        [HttpGet("all-bookings")]
        public async Task<ActionResult<List<BookingDto>>> GetAllBookings()
        {
            var bookings = await _bookingRepository.GetAllBookingsAsync();
            return _mapper.Map<List<BookingDto>>(bookings);
        }

        // Get current robot holder
        [HttpGet("current-holder/{robotId}")]
        public async Task<ActionResult<CurrentHolderDto>> GetCurrentHolder(int robotId)
        {
            try
            {
                var latestBooking = await _bookingRepository.GetLatestBookingForRobotAsync(robotId);

                if (latestBooking == null)
                {
                    return Ok(null);
                }

                var user = latestBooking.User;
                if (user == null)
                {
                    return NotFound("Ingen användare är associerad med bokningen.");
                }

                var result = _mapper.Map<CurrentHolderDto>(latestBooking);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Misslyckades att hämta nuvarande innehavare.");
                return BadRequest($"Ett fel uppstod: {ex.Message}");
            }
        }
        //[HttpGet("current-holder/{robotId}")]
        //public async Task<ActionResult<CurrentHolderDto>> GetCurrentHolder(int robotId, [FromQuery] DateTime date)
        //{
        //    try
        //    {
        //        var latestBooking = await _bookingRepository.GetLatestBookingForRobotAsync(robotId, date);

        //        if (latestBooking == null ||
        //            date < latestBooking.StartTime ||
        //            date > latestBooking.EndTime)
        //        {
        //            return Ok(null);
        //        }

        //        var user = latestBooking.User;
        //        if (user == null)
        //        {
        //            return NotFound("Ingen användare är associerad med bokningen.");
        //        }

        //        var result = _mapper.Map<CurrentHolderDto>(latestBooking);
        //        return Ok(result);
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Misslyckades att hämta nuvarande innehavare.");
        //        return BadRequest($"Ett fel uppstod: {ex.Message}");
        //    }
        //}

        // Delete booking
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBooking(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var booking = await _bookingRepository.GetByIdAsync(id);

            if (booking == null)
                return NotFound("Bokningen hittades inte");

            // Verify user permission
            if (booking.UserId != userId && !User.IsInRole("Admin"))
                return Forbid();

            await _bookingRepository.DeleteAsync(booking);
            return NoContent();
        }
    }
}