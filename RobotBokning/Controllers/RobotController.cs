﻿using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RobotBokning.Data;
using RobotBokning.DTOs;
using RobotBokning.Models;
using RobotBokning.Repositories;
using System.Security.Claims;

namespace RobotBokning.Controllers
{
    // Controller for managing robots and their availability
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class RobotController : ControllerBase
    {
        // Dependencies for robot management
        private readonly IRobotRepository _robotRepository;
        private readonly IBookingRepository _bookingRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<RobotController> _logger;

        public RobotController(
            IRobotRepository robotRepository,
            IBookingRepository bookingRepository,
            IMapper mapper,
            ILogger<RobotController> logger)
        {
            _robotRepository = robotRepository;
            _bookingRepository = bookingRepository;
            _mapper = mapper;
            _logger = logger;
        }

        // Get all robots with availability info
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RobotDto>>> GetRobots()
        {
            var robots = await _robotRepository.GetRobotsAsync();
            if (!robots.Any())
                return NotFound("Inga robotar hittades i systemet");

            var robotDtos = _mapper.Map<List<RobotDto>>(robots);
            foreach (var robotDto in robotDtos)
            {
                robotDto.NextAvailableTime = await _robotRepository.GetNextAvailableTimeAsync();
            }

            return Ok(robotDtos);
        }

        // Get calendar data for robot bookings
        [HttpGet("calendar")]
        public async Task<ActionResult<CalendarResponseDto>> GetCalendarData(
            [FromQuery] DateTime start,
            [FromQuery] DateTime end)
        {
            var robot = await _robotRepository.GetRobotByIdAsync(1);
            if (robot == null)
                return NotFound("Roboten hittades inte");

            var bookings = await _bookingRepository.GetBookingsForPeriodAsync(start, end);
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var events = _mapper.Map<List<CalendarEventDto>>(bookings);

            foreach (var evt in events)
            {
                evt.IsCurrentUserBooking = bookings
                    .First(b => b.Id == evt.Id)
                    .User.Id == userId;
            }

            return new CalendarResponseDto
            {
                Events = events,
                RobotAvailable = robot.IsAvailable,
                BusinessHours = new BusinessHoursDto
                {
                    DaysOfWeek = new[] { 1, 2, 3, 4, 5 },
                    StartTime = "08:00",
                    EndTime = "17:00"
                }
            };
        }

        // Create new robot (admin only)
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<RobotDto>> CreateRobot(CreateRobotDto dto)
        {
            var robot = _mapper.Map<Robot>(dto);
            robot.IsAvailable = true;

            var createdRobot = await _robotRepository.CreateRobotAsync(robot);
            _logger.LogInformation($"Admin created new robot: {robot.Name}");

            var robotDto = _mapper.Map<RobotDto>(createdRobot);
            robotDto.NextAvailableTime = await _robotRepository.GetNextAvailableTimeAsync();

            return CreatedAtAction(nameof(GetRobotById), new { id = createdRobot.Id }, robotDto);
        }

        // Get specific robot details
        [HttpGet("{id}")]
        public async Task<ActionResult<RobotDto>> GetRobotById(int id)
        {
            var robot = await _robotRepository.GetRobotByIdAsync(id);
            if (robot == null)
                return NotFound("Roboten hittades inte");

            var robotDto = _mapper.Map<RobotDto>(robot);
            robotDto.NextAvailableTime = await _robotRepository.GetNextAvailableTimeAsync();

            return Ok(robotDto);
        }

        // Update robot details (admin only)
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<ActionResult<RobotDto>> UpdateRobot(int id, UpdateRobotDto updateDto)
        {
            var robot = await _robotRepository.GetRobotByIdAsync(id);
            if (robot == null)
                return NotFound("Roboten hittades inte");

            _mapper.Map(updateDto, robot);

            await _robotRepository.UpdateRobotAsync(robot);
            _logger.LogInformation($"Admin updated robot: {robot.Name}");

            var robotDto = _mapper.Map<RobotDto>(robot);
            robotDto.NextAvailableTime = await _robotRepository.GetNextAvailableTimeAsync();

            return Ok(robotDto);
        }

        // Delete robot (admin only)
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRobot(int id)
        {
            var robot = await _robotRepository.GetRobotByIdAsync(id);
            if (robot == null)
                return NotFound("Roboten hittades inte");

            if (await _robotRepository.HasActiveBookings(id))
                return BadRequest("Kan inte ta bort robot med aktiva bokningar");

            await _robotRepository.DeleteRobotAsync(id);
            _logger.LogInformation($"Admin deleted robot: {robot.Name}");

            return NoContent();
        }
    }
}