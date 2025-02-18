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
                            "http://localhost:5173"
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

            // Kör databasmigrering före app.Run()
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

            // Kör seed efter migrering men före app.Run()
            await SeedAdmin(app);

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

                    string[] roles = { "Admin", "User" };
                    foreach (var role in roles)
                    {
                        if (!await roleManager.RoleExistsAsync(role))
                        {
                            await roleManager.CreateAsync(new IdentityRole(role));
                            logger.LogInformation($"Created role: {role}");
                        }
                    }

                    var adminEmail = "admin@example.com";
                    var adminUser = await userManager.FindByEmailAsync(adminEmail);

                    if (adminUser == null)
                    {
                        var admin = new ApplicationUser
                        {
                            UserName = adminEmail,
                            Email = adminEmail,
                            FirstName = "Admin",
                            LastName = "User",
                            EmailConfirmed = true,
                            Created = DateTime.Now,
                            IsActive = true
                        };

                        var result = await userManager.CreateAsync(admin, "Password!1");
                        if (result.Succeeded)
                        {
                            await userManager.AddToRoleAsync(admin, "Admin");
                            logger.LogInformation("Admin user created successfully");
                        }
                        else
                        {
                            logger.LogError("Failed to create admin user: {Errors}",
                                string.Join(", ", result.Errors.Select(e => e.Description)));
                        }
                    }
                }
                catch (Exception ex)
                {
                    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
                    logger.LogError(ex, "An error occurred while seeding the admin user");
                    throw;
                }
            }
        }
    }
}


//using Microsoft.AspNetCore.Authentication.JwtBearer;
//using Microsoft.AspNetCore.Http.Features;
//using Microsoft.AspNetCore.Identity;
//using Microsoft.AspNetCore.Identity.UI.Services;
//using Microsoft.AspNetCore.Server.Kestrel.Core;
//using Microsoft.EntityFrameworkCore;
//using Microsoft.Extensions.FileProviders;
//using Microsoft.IdentityModel.Tokens;
//using Microsoft.OpenApi.Models;
//using RobotBokning.Data;
//using RobotBokning.Models;
//using RobotBokning.Repositories;
//using RobotBokning.Services;
//using System.Text;

//namespace RobotBokning
//{
//    public class Program
//    {
//        public static async Task Main(string[] args)
//        {
//            var builder = WebApplication.CreateBuilder(args);

//            // Add services to the container.
//            builder.Services.AddControllers();
//            builder.Services.AddEndpointsApiExplorer();

//            builder.Services.AddSingleton<IWebHostEnvironment>(builder.Environment);

//            builder.Services.AddScoped<IBookingRepository, BookingRepository>();
//            builder.Services.AddScoped<IRobotRepository, RobotRepository>();
//            builder.Services.AddScoped<IUserRepository, UserRepository>();
//            builder.Services.AddScoped<IDocumentRepository, DocumentRepository>();
//            builder.Services.AddAutoMapper(typeof(Program).Assembly);
//            builder.Services.AddTransient<IEmailSender, EmailService>();

//            builder.Services.Configure<IISServerOptions>(options =>
//            {
//                options.MaxRequestBodySize = 30 * 1024 * 1024; // 30 MB
//            });

//            // Och för Kestrel
//            builder.Services.Configure<KestrelServerOptions>(options =>
//            {
//                options.Limits.MaxRequestBodySize = 30 * 1024 * 1024; // 30 MB
//            });

//            // För form/multipart hantering
//            builder.Services.Configure<FormOptions>(options =>
//            {
//                options.MultipartBodyLengthLimit = 30 * 1024 * 1024; // 30 MB
//            });

//            // Verifiera att JWT-nyckeln finns
//            var jwtKey = builder.Configuration["JWT:SecretKey"];
//            if (string.IsNullOrEmpty(jwtKey))
//            {
//                throw new Exception("JWT:SecretKey is missing in configuration!");
//            }

//            // Database configuration
//            builder.Services.AddDbContext<ApplicationDbContext>(options =>
//                options.UseSqlServer(builder.Configuration.GetConnectionString("DBConnection")));

//            // Enklare CORS-konfiguration
//            builder.Services.AddCors(options =>
//            {
//                options.AddPolicy("AllowAllOrigins", builder =>
//                {
//                    builder.AllowAnyOrigin()
//                           .AllowAnyMethod()
//                           .AllowAnyHeader();
//                });
//            });

//            // Identity configuration
//            builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
//            {
//                options.Password.RequireDigit = true;
//                options.Password.RequireLowercase = true;
//                options.Password.RequireUppercase = true;
//                options.Password.RequireNonAlphanumeric = false;
//                options.Password.RequiredLength = 6;
//            })
//            .AddEntityFrameworkStores<ApplicationDbContext>()
//            .AddDefaultTokenProviders();

//            // JWT Authentication configuration
//            builder.Services.AddAuthentication(options =>
//            {
//                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
//                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
//                options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
//            })
//            .AddJwtBearer(options =>
//            {
//                options.SaveToken = true;
//                options.TokenValidationParameters = new TokenValidationParameters
//                {
//                    ValidateIssuerSigningKey = true,
//                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
//                    ValidateIssuer = false,
//                    ValidateAudience = false,
//                    ValidateLifetime = true,
//                    ClockSkew = TimeSpan.Zero
//                };
//            });

//            // Swagger configuration
//            builder.Services.AddSwaggerGen(c =>
//            {
//                c.SwaggerDoc("v1", new OpenApiInfo { Title = "Robot Booking API", Version = "v1" });

//                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
//                {
//                    Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
//                    Name = "Authorization",
//                    In = ParameterLocation.Header,
//                    Type = SecuritySchemeType.Http,
//                    Scheme = "bearer",
//                    BearerFormat = "JWT"
//                });

//                c.AddSecurityRequirement(new OpenApiSecurityRequirement
//            {
//                {
//                    new OpenApiSecurityScheme
//                    {
//                        Reference = new OpenApiReference
//                        {
//                            Type = ReferenceType.SecurityScheme,
//                            Id = "Bearer"
//                        }
//                    },
//                    Array.Empty<string>()
//                }
//            });
//            });
//            builder.Services.AddLogging(logging =>
//            {
//                logging.ClearProviders();
//                logging.AddConsole();
//                logging.AddDebug();
//            });

//            var app = builder.Build();

//            if (app.Environment.IsDevelopment())
//            {
//                app.UseSwagger();
//                app.UseSwaggerUI();
//            }


//            app.UseHttpsRedirection();
//            app.UseStaticFiles(new StaticFileOptions
//            {
//                FileProvider = new PhysicalFileProvider(
//                Path.Combine(builder.Environment.WebRootPath, "uploads")),
//                RequestPath = "/uploads"
//            });
//            app.UseStaticFiles();
//            app.UseRouting();
//            app.UseCors("AllowAllOrigins");
//            app.UseAuthentication();
//            app.UseAuthorization();


//            app.MapControllers();
//            await SeedAdmin(app);

//            app.Run();
//        }
//        private static async Task SeedAdmin(WebApplication app)
//        {
//            using (var scope = app.Services.CreateScope())
//            {
//                var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
//                var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

//                // Skapa både Admin och User roller
//                string[] roles = { "Admin", "User" };
//                foreach (var role in roles)
//                {
//                    if (!await roleManager.RoleExistsAsync(role))
//                    {
//                        await roleManager.CreateAsync(new IdentityRole(role));
//                    }
//                }

//                var adminEmail = "admin@example.com";
//                var adminUser = await userManager.FindByEmailAsync(adminEmail);

//                if (adminUser == null)
//                {
//                    var admin = new ApplicationUser
//                    {
//                        UserName = adminEmail,
//                        Email = adminEmail,
//                        FirstName = "Admin",
//                        LastName = "User",
//                        EmailConfirmed = true,
//                        Created = DateTime.Now,
//                        IsActive = true
//                    };

//                    var result = await userManager.CreateAsync(admin, "Password!1"); // Ändra lösenord!
//                    if (result.Succeeded)
//                    {
//                        await userManager.AddToRoleAsync(admin, "Admin");
//                    }
//                }
//            }
//        }
//    }
//}
