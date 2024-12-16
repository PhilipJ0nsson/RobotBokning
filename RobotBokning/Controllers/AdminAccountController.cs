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
    [ApiController]
    [Route("api/admin/users")]
    [Authorize(Roles = "Admin")]
    public class AdminAccountController : ControllerBase
    {
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

        [HttpGet]
        public async Task<ActionResult<List<UserDto>>> GetAllUsers()
        {
            var users = await _userRepository.GetAllUsersAsync();
            return _mapper.Map<List<UserDto>>(users);
        }

        [HttpPost]
        public async Task<ActionResult<UserDto>> CreateUser(RegisterDto registerDto)
        {
            if (await _userRepository.GetByEmailAsync(registerDto.Email) != null)
                return BadRequest("Email already exists");

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

        [HttpPost("admin")]
        public async Task<ActionResult<UserDto>> CreateAdmin(RegisterDto registerDto)
        {
            if (await _userRepository.GetByEmailAsync(registerDto.Email) != null)
                return BadRequest("Email already exists");

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
                    return BadRequest("Failed to add admin role");

                return _mapper.Map<UserDto>(user);
            }
            catch (ApplicationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<UserDto>> UpdateUser(string id, UpdateUserDto updateDto)
        {
            var user = await _userRepository.GetUserByIdAsync(id);
            if (user == null)
                return NotFound();

            user.FirstName = updateDto.FirstName;
            user.LastName = updateDto.LastName;
            user.Company = updateDto.Company;

            var result = await _userRepository.UpdateUserAsync(user);
            if (!result)
                return BadRequest("Failed to update user");

            return _mapper.Map<UserDto>(user);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var user = await _userRepository.GetUserByIdAsync(id);
            if (user == null)
                return NotFound();

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (user.Id == currentUserId)
                return BadRequest("Cannot delete your own account through admin endpoint");

            var result = await _userRepository.DeleteUserAsync(user);
            if (!result)
                return BadRequest("Failed to delete user");

            return NoContent();
        }
    }
}
