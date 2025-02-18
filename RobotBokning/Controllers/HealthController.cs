using Microsoft.AspNetCore.Mvc;

namespace RobotBokning.Controllers
{
    [ApiController]
    [Route("api/health")] // or just [Route("health")] if you want /health
    public class HealthController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetHealth()
        {
            return Ok(); // Returns a 200 OK status code with no body
        }
    }
}
