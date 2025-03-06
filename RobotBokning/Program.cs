using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using RobotBokning.Data;
using RobotBokning.Models;
using RobotBokning.Repositories;
using RobotBokning.Services;
using System.Text;

namespace RobotBokning
{
    public class Program
    {
        public static async Task<WebApplication> MigrateDatabase(WebApplication app)
        {
            using (var scope = app.Services.CreateScope())
            {
                var retryCount = 0;
                const int maxRetries = 5;

                while (retryCount < maxRetries)
                {
                    try
                    {
                        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

                        logger.LogInformation("Starting database migration attempt {RetryCount}...", retryCount + 1);

                        if (context.Database.GetPendingMigrations().Any())
                        {
                            await context.Database.MigrateAsync();
                            logger.LogInformation("Database migration completed successfully.");
                        }
                        else
                        {
                            logger.LogInformation("No pending migrations found.");
                        }

                        break; // Successful, exit loop
                    }
                    catch (Exception ex)
                    {
                        retryCount++;
                        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
                        logger.LogError(ex, "Migration attempt {RetryCount} failed.", retryCount);

                        if (retryCount >= maxRetries)
                        {
                            logger.LogError("Max retry attempts reached. Migration failed.");
                            throw;
                        }

                        // Exponential backoff
                        await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, retryCount)));
                    }
                }
            }
            return app;
        }

        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();

            builder.Services.AddSingleton<IWebHostEnvironment>(builder.Environment);

            builder.Services.AddScoped<IBookingRepository, BookingRepository>();
            builder.Services.AddScoped<IRobotRepository, RobotRepository>();
            builder.Services.AddScoped<IUserRepository, UserRepository>();
            builder.Services.AddScoped<IDocumentRepository, DocumentRepository>();
            builder.Services.AddAutoMapper(typeof(Program).Assembly);
            builder.Services.AddTransient<IEmailSender, EmailService>();

            builder.Services.Configure<IISServerOptions>(options =>
            {
                options.MaxRequestBodySize = 30 * 1024 * 1024; // 30 MB
            });

            builder.Services.Configure<KestrelServerOptions>(options =>
            {
                options.Limits.MaxRequestBodySize = 30 * 1024 * 1024; // 30 MB
            });

            builder.Services.Configure<FormOptions>(options =>
            {
                options.MultipartBodyLengthLimit = 30 * 1024 * 1024; // 30 MB
            });

            // Verifiera att JWT-nyckeln finns
            var jwtKey = builder.Configuration["JWT:SecretKey"];
            if (string.IsNullOrEmpty(jwtKey))
            {
                throw new Exception("JWT:SecretKey is missing in configuration!");
            }

            // Database configuration med retry policy
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"),
                    sqlServerOptionsAction: sqlOptions =>
                    {
                        sqlOptions.EnableRetryOnFailure(
                            maxRetryCount: 5,
                            maxRetryDelay: TimeSpan.FromSeconds(30),
                            errorNumbersToAdd: null);
                        sqlOptions.CommandTimeout(30);
                    }));

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowViteApp",
                    builder => builder
                        .WithOrigins(
                            "http://localhost:5173",
                            "http://localhost",
                            "http://frontend", // container name
                            "http://frontend:4173",  // for container-to-container communication 4173 is Vite default prod port
                            "http://localhost:4173"  // for host machine access
                        )
                        .AllowAnyMethod()
                        .AllowAnyHeader());
            });

            builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
            {
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequiredLength = 6;
            })
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.SaveToken = true;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };
            });

            builder.Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "Robot Booking API", Version = "v1" });

                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT"
                });

                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            });

            builder.Services.AddLogging(logging =>
            {
                logging.ClearProviders();
                logging.AddConsole();
                logging.AddDebug();
            });

            var app = builder.Build();

            // K�r databasmigrering f�re app.Run()
            await MigrateDatabase(app);

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();
            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(
                Path.Combine(builder.Environment.WebRootPath, "uploads")),
                RequestPath = "/uploads"
            });
            app.UseStaticFiles();
            app.UseRouting();
            app.UseCors("AllowViteApp");
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            // K�r seed efter migrering men f�re app.Run()
            await SeedAdmin(app);
            await SeedRobot(app);

            app.Run();
        }

        private static async Task SeedAdmin(WebApplication app)
        {
            using (var scope = app.Services.CreateScope())
            {
                try
                {
                    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
                    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
                    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

                    logger.LogInformation("Starting admin seeding...");

                    // Skapa roller om de inte finns
                    string[] roles = { "Admin", "User" };
                    foreach (var role in roles)
                    {
                        if (!await roleManager.RoleExistsAsync(role))
                        {
                            await roleManager.CreateAsync(new IdentityRole(role));
                            logger.LogInformation($"Created role: {role}");
                        }
                    }

                    // Mer tillförlitlig kontroll - hämta alla användare och kolla deras roller
                    bool adminExists = false;
                    var allUsers = userManager.Users.ToList();

                    logger.LogInformation($"Found {allUsers.Count} total users in database");

                    foreach (var user in allUsers)
                    {
                        if (await userManager.IsInRoleAsync(user, "Admin"))
                        {
                            adminExists = true;
                            logger.LogInformation($"Found existing admin user: {user.Email}");
                            break;
                        }
                    }

                    if (adminExists)
                    {
                        logger.LogInformation("Admin user(s) already exist. Skipping admin seeding.");
                        return;
                    }

                    // Om ingen admin finns, skapa en
                    logger.LogInformation("No admin users found. Creating default admin...");
                    var adminEmail = "admin@example.com";

                    var admin = new ApplicationUser
                    {
                        UserName = adminEmail,
                        Email = adminEmail,
                        FirstName = "Admin",
                        LastName = "User",
                        Company = "Admin Company", // Sätt detta enligt behov
                        Phone = "0000000000",      // Sätt detta enligt behov
                        EmailConfirmed = true,
                        Created = DateTime.Now,
                        IsActive = true,
                        Bookings = new List<Booking>() // Initiera för att undvika null-referens
                    };

                    var result = await userManager.CreateAsync(admin, "Password!1");
                    if (result.Succeeded)
                    {
                        var roleResult = await userManager.AddToRoleAsync(admin, "Admin");
                        if (roleResult.Succeeded)
                        {
                            logger.LogInformation("Admin user created and role assigned successfully");
                        }
                        else
                        {
                            logger.LogError("Failed to assign Admin role: {Errors}",
                                string.Join(", ", roleResult.Errors.Select(e => e.Description)));
                        }
                    }
                    else
                    {
                        logger.LogError("Failed to create admin user: {Errors}",
                            string.Join(", ", result.Errors.Select(e => e.Description)));
                    }
                }
                catch (Exception ex)
                {
                    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
                    logger.LogError(ex, "An error occurred while seeding the admin user");

                    // Logga också inner exception om den finns
                    if (ex.InnerException != null)
                    {
                        logger.LogError("Inner exception: {Message}", ex.InnerException.Message);
                    }

                    throw;
                }
            }
        }
        private static async Task SeedRobot(WebApplication app)
        {
            using (var scope = app.Services.CreateScope())
            {
                try
                {
                    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

                    logger.LogInformation("Starting robot seeding...");

                    if (!context.Robots.Any(r => r.Name == "Mobile Aloha"))
                    {
                        var mobileAloha = new Robot
                        {
                            Name = "Mobile Aloha",
                            Description = "A versatile mobile robot platform for research and development",
                            IsAvailable = true,
                        };

                        context.Robots.Add(mobileAloha);
                        await context.SaveChangesAsync();
                        logger.LogInformation("Mobile Aloha robot created successfully");
                    }
                    else
                    {
                        logger.LogInformation("Mobile Aloha robot already exists");
                    }
                }
                catch (Exception ex)
                {
                    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
                    logger.LogError(ex, "An error occurred while seeding the robot");
                    throw;
                }
            }
        }
    }
}

