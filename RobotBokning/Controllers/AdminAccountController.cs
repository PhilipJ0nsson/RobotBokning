using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RobotBokning.DTOs;
using RobotBokning.Models;
using RobotBokning.Repositories;
using System.Security.Claims;

namespace RobotBokning.Controllers
{
    // Controller for admin-only user management operations
    [ApiController]
    [Route("api/admin/users")]
    [Authorize(Roles = "Admin")]
    public class AdminAccountController : ControllerBase
    {
        // Dependencies for user management
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;
        private readonly IMapper _mapper;

        public AdminAccountController(
            IUserRepository userRepository,
            IConfiguration configuration,
            IMapper mapper)
        {
            _userRepository = userRepository;
            _configuration = configuration;
            _mapper = mapper;
        }

        // Get list of all users
        [HttpGet]
        public async Task<ActionResult<List<UserDto>>> GetAllUsers()
        {
            var users = await _userRepository.GetAllUsersAsync();
            var userDtos = new List<UserDto>();

            foreach (var user in users)
            {
                var userDto = _mapper.Map<UserDto>(user);
                var roles = await _userRepository.GetUserRoles(user);
                userDto.IsAdmin = roles.Contains("Admin");
                userDtos.Add(userDto);
            }

            return userDtos;
        }

        // Create regular user account
        [HttpPost]
        public async Task<ActionResult<UserDto>> CreateUser(RegisterDto registerDto)
        {
            if (await _userRepository.GetByEmailAsync(registerDto.Email) != null)
                return BadRequest("E-postadressen finns redan registrerad");

            var user = _mapper.Map<ApplicationUser>(registerDto);
            user.UserName = registerDto.Email;
            user.Created = DateTime.Now;
            user.IsActive = true;

            try
            {
                user = await _userRepository.CreateAsync(user, registerDto.Password);
                return _mapper.Map<UserDto>(user);
            }
            catch (ApplicationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // Create admin user account
        [HttpPost("admin")]
        public async Task<ActionResult<UserDto>> CreateAdmin(RegisterDto registerDto)
        {
            if (await _userRepository.GetByEmailAsync(registerDto.Email) != null)
                return BadRequest("E-postadressen finns redan registrerad");

            var user = _mapper.Map<ApplicationUser>(registerDto);
            user.UserName = registerDto.Email;
            user.Created = DateTime.Now;
            user.IsActive = true;
            user.EmailConfirmed = true;

            try
            {
                user = await _userRepository.CreateAsync(user, registerDto.Password);
                var roleResult = await _userRepository.AddToRoleAsync(user, "Admin");

                if (!roleResult)
                    return BadRequest("Kunde inte lägga till administratörsrollen");

                return _mapper.Map<UserDto>(user);
            }
            catch (ApplicationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // Update user information
        [HttpPut("{id}")]
        public async Task<ActionResult<UserDto>> UpdateUser(string id, UpdateUserDto updateDto)
        {
            var user = await _userRepository.GetUserByIdAsync(id);
            if (user == null)
                return NotFound("Användaren hittades inte");

            user.FirstName = updateDto.FirstName;
            user.LastName = updateDto.LastName;
            user.Company = updateDto.Company;

            var result = await _userRepository.UpdateUserAsync(user);
            if (!result)
                return BadRequest("Kunde inte uppdatera användaren");

            return _mapper.Map<UserDto>(user);
        }

        // Delete user account
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var user = await _userRepository.GetUserByIdAsync(id);
            if (user == null)
                return NotFound("Användaren hittades inte");

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (user.Id == currentUserId)
                return BadRequest("Du kan inte ta bort ditt eget konto via admin-gränssnittet");

            var result = await _userRepository.DeleteUserAsync(user);
            if (!result)
                return BadRequest("Kunde inte ta bort användaren");

            return NoContent();
        }
    }
}