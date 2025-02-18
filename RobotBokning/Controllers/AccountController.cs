using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using RobotBokning.DTOs;
using RobotBokning.Models;
using RobotBokning.Repositories;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace RobotBokning.Controllers
{
    // Account management controller handling user authentication and profile operations
    [ApiController]
    [Route("api/account")]
    [EnableCors]
    public class AccountController : ControllerBase
    {
        // Dependency injection for required services
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;
        private readonly IMapper _mapper;
        private readonly IEmailSender _emailSender;

        public AccountController(
            IUserRepository userRepository,
            IConfiguration configuration,
            IMapper mapper,
            IEmailSender emailSender)
        {
            _userRepository = userRepository;
            _configuration = configuration;
            _mapper = mapper;
            _emailSender = emailSender;
        }

        // Register new user with optional admin role
        [HttpPost("register")]
        public async Task<ActionResult<UserDto>> Register(RegisterDto registerDto)
        {
            if (await _userRepository.GetByEmailAsync(registerDto.Email) != null)
                return BadRequest("Email already exists");

            var user = _mapper.Map<ApplicationUser>(registerDto);
            user.UserName = registerDto.Email;
            user.Created = DateTime.Now;
            user.IsActive = true;

            user = await _userRepository.CreateAsync(user, registerDto.Password);

            // Add admin role if specified
            if (registerDto.IsAdmin)
            {
                var roleResult = await _userRepository.AddToRoleAsync(user, "Admin");
                if (!roleResult)
                    return BadRequest("Failed to add admin role");
            }

            var roles = await _userRepository.GetUserRoles(user);
            var userDto = _mapper.Map<UserDto>(user);
            userDto.IsAdmin = roles.Contains("Admin");
            userDto.Token = await GenerateJwtToken(user);

            return userDto;
        }

        // User login endpoint
        [HttpPost("login")]
        public async Task<ActionResult<UserDto>> Login(LoginDto loginDto)
        {
            var user = await _userRepository.GetByEmailAsync(loginDto.Email);
            if (user == null)
                return Unauthorized("Ogiltig email.");

            if (!await _userRepository.CheckPasswordAsync(user, loginDto.Password))
                return Unauthorized("Ogiltigt lösenord.");

            var userDto = _mapper.Map<UserDto>(user);
            userDto.Token = await GenerateJwtToken(user);

            return userDto;
        }

        // Get current user info
        [Authorize]
        [HttpGet("current")]
        public async Task<ActionResult<UserDto>> GetCurrentUser()
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            var user = await _userRepository.GetByEmailAsync(email);

            if (user == null)
                return NotFound();

            var roles = await _userRepository.GetUserRoles(user);
            var userDto = _mapper.Map<UserDto>(user);
            userDto.Token = await GenerateJwtToken(user);
            userDto.IsAdmin = roles.Contains("Admin");

            return userDto;
        }

        // Generate JWT token with user claims
        private async Task<string> GenerateJwtToken(ApplicationUser user)
        {
            if (user == null)
                throw new ArgumentNullException(nameof(user));

            var jwtSettings = _configuration["JWT:SecretKey"];
            if (string.IsNullOrEmpty(jwtSettings))
                throw new InvalidOperationException("JWT:SecretKey is not configured");

            var roles = await _userRepository.GetUserRoles(user);

            // Create claims for token
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
                new Claim(ClaimTypes.GivenName, user.FirstName ?? string.Empty),
                new Claim(ClaimTypes.Surname, user.LastName ?? string.Empty)
            };

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.Now.AddDays(7),
                SigningCredentials = creds
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }

        // Update user profile information
        [Authorize]
        [HttpPut("update")]
        public async Task<ActionResult<UserDto>> UpdateUser(UpdateUserDto updateDto)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userRepository.GetUserByIdAsync(currentUserId);

            if (user == null)
                return NotFound();

            user.FirstName = updateDto.FirstName;
            user.LastName = updateDto.LastName;
            user.Company = updateDto.Company;
            user.Phone = updateDto.Phone;

            var result = await _userRepository.UpdateUserAsync(user);
            if (!result)
                return BadRequest("Failed to update user");

            var userDto = _mapper.Map<UserDto>(user);
            userDto.Token = await GenerateJwtToken(user);

            return userDto;
        }

        // Delete user account
        [Authorize]
        [HttpDelete]
        public async Task<IActionResult> DeleteUser()
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userRepository.GetUserByIdAsync(currentUserId);

            if (user == null)
                return NotFound();

            var result = await _userRepository.DeleteUserAsync(user);
            if (!result)
                return BadRequest("Failed to delete user");

            return NoContent();
        }

        // Initiate password reset process
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto model)
        {
            var user = await _userRepository.GetByEmailAsync(model.Email);
            if (user == null)
                return Ok();

            // Generate reset link and send email
            var token = await _userRepository.GeneratePasswordResetTokenAsync(user);
            var resetLink = $"{_configuration["AppSettings:ClientBaseUrl"]}/reset-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(model.Email)}";
            await _emailSender.SendEmailAsync(
                user.Email,
                "Återställ ditt lösenord",
                $"<h2>Återställ ditt lösenord</h2><p>Klicka <a href='{resetLink}'>här</a> för att återställa ditt lösenord.</p>" +
                $"<p>Om du inte begärt att återställa ditt lösenord kan du bortse från detta mail.");

            return Ok();
        }

        // Reset password with token
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto model)
        {
            var user = await _userRepository.GetByEmailAsync(model.Email);
            if (user == null)
                return BadRequest("Ogiltig återställningslänk");

            var result = await _userRepository.ResetPasswordAsync(user, model.Token, model.NewPassword);
            if (!result)
                return BadRequest("Lösenordet måste innehålla minst en stor bokstav, en liten bokstav, en siffra och vara minst 6 tecken långt");

            return Ok();
        }

        // Change password for logged-in user
        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto model)
        {
            var user = await _userRepository.GetByEmailAsync(User.FindFirstValue(ClaimTypes.Email));
            if (user == null)
                return NotFound("Användare hittades inte");

            var isCurrentPasswordValid = await _userRepository.ValidatePasswordAsync(user, model.CurrentPassword);
            if (!isCurrentPasswordValid)
            {
                return BadRequest("Fel nuvarande lösenord");
            }

            var result = await _userRepository.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
            if (!result)
            {
                return BadRequest("Nya lösenordet måste innehålla minst en stor bokstav, en liten bokstav, en siffra och vara minst 6 tecken långt");
            }

            return Ok("Lösenordet har ändrats!");
        }
    }
}