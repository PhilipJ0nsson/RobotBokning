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
    [ApiController]
    [Route("api/account")]
    [EnableCors] // Lägg till denna rad
    public class AccountController : ControllerBase
    {
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

            var userDto = _mapper.Map<UserDto>(user);
            userDto.Token = await GenerateJwtToken(user);

            return userDto;
        }

        [HttpPost("login")]
        public async Task<ActionResult<UserDto>> Login(LoginDto loginDto)
        {
            var user = await _userRepository.GetByEmailAsync(loginDto.Email);
            if (user == null)
                return Unauthorized("Invalid email");

            if (!await _userRepository.CheckPasswordAsync(user, loginDto.Password))
                return Unauthorized("Invalid password");

            var userDto = _mapper.Map<UserDto>(user);
            userDto.Token = await GenerateJwtToken(user);  // Nu async

            return userDto;
        }

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
            userDto.IsAdmin = roles.Contains("Admin");  // Sätt IsAdmin baserat på roller

            return userDto;
        }

        private async Task<string> GenerateJwtToken(ApplicationUser user)
        {
            if (user == null)
                throw new ArgumentNullException(nameof(user));

            var jwtSettings = _configuration["JWT:SecretKey"];
            if (string.IsNullOrEmpty(jwtSettings))
                throw new InvalidOperationException("JWT:SecretKey is not configured");

            // Hämta användarens roller
            var roles = await _userRepository.GetUserRoles(user);

            var claims = new List<Claim>
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id),
        new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
        new Claim(ClaimTypes.GivenName, user.FirstName ?? string.Empty),
        new Claim(ClaimTypes.Surname, user.LastName ?? string.Empty)
    };

            // Lägg till roller i claims
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
        [Authorize]
        [HttpPut("update")]
        public async Task<ActionResult<UserDto>> UpdateUser(UpdateUserDto updateDto)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userRepository.GetUserByIdAsync(currentUserId);

            if (user == null)
                return NotFound();

            // Uppdatera användaruppgifter
            user.FirstName = updateDto.FirstName;
            user.LastName = updateDto.LastName;
            user.Company = updateDto.Company;
            user.Phone = updateDto.Phone;
            // Email uppdateras inte eftersom det används som användarnamn

            var result = await _userRepository.UpdateUserAsync(user);
            if (!result)
                return BadRequest("Failed to update user");

            var userDto = _mapper.Map<UserDto>(user);
            userDto.Token = await GenerateJwtToken(user);

            return userDto;
        }

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
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto model)
        {
            var user = await _userRepository.GetByEmailAsync(model.Email);
            if (user == null)
                return Ok();
            var token = await _userRepository.GeneratePasswordResetTokenAsync(user);
            var resetLink = $"{_configuration["AppSettings:ClientBaseUrl"]}/reset-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(model.Email)}";
            await _emailSender.SendEmailAsync(
                user.Email,
                "Återställ ditt lösenord",
                $"<h2>Återställ ditt lösenord</h2><p>Klicka <a href='{resetLink}'>här</a> för att återställa ditt lösenord.</p>");
            return Ok();
        }
    }
}
