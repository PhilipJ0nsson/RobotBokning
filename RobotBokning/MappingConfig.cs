using AutoMapper;
using RobotBokning.DTOs;
using RobotBokning.Models;

namespace RobotBokning
{
    public class MappingConfig : Profile
    {
        public MappingConfig()
        {
            // Robot mappings
            CreateMap<Robot, RobotDto>()
                .ForMember(dest => dest.NextAvailableTime, opt => opt.Ignore()) // Hanteras separat pga async
                .ForMember(dest => dest.Documents, opt => opt.MapFrom(src => src.Documents));

            CreateMap<CreateRobotDto, Robot>()
                .ForMember(dest => dest.IsAvailable, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.Bookings, opt => opt.Ignore())
                .ForMember(dest => dest.Documents, opt => opt.Ignore());

            CreateMap<UpdateRobotDto, Robot>()
                .ForMember(dest => dest.Bookings, opt => opt.Ignore())
                .ForMember(dest => dest.Documents, opt => opt.Ignore());

            // Document mappings
            CreateMap<Document, DocumentDto>();

            // User mappings
            CreateMap<ApplicationUser, UserDto>()
                .ForMember(dest => dest.Token, opt => opt.Ignore()) // Token hanteras separat
                .ForMember(dest => dest.IsAdmin, opt => opt.Ignore()) // IsAdmin kommer att sättas separat i controllern
                .ForMember(dest => dest.Company, opt => opt.MapFrom(src => src.Company));


            CreateMap<RegisterDto, ApplicationUser>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.Email))
                .ForMember(dest => dest.Created, opt => opt.MapFrom(src => DateTime.Now))
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.Bookings, opt => opt.Ignore())
                .ForMember(dest => dest.Company, opt => opt.MapFrom(src => src.Company));

            // Booking mappings
            CreateMap<Booking, BookingDto>();
            CreateMap<ApplicationUser, BookingUserDto>();
            CreateMap<CreateBookingDto, Booking>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => BookingStatus.Scheduled))
                .ForMember(dest => dest.User, opt => opt.Ignore())
                .ForMember(dest => dest.Robot, opt => opt.Ignore())
                .ForMember(dest => dest.UserId, opt => opt.Ignore()); // Sätts i controller

            // Calendar mappings
            CreateMap<Booking, CalendarEventDto>()
                .ForMember(dest => dest.Title, opt => opt.MapFrom(src => $"Booked by {src.User.Email}"))
                .ForMember(dest => dest.Start, opt => opt.MapFrom(src => src.StartTime))
                .ForMember(dest => dest.End, opt => opt.MapFrom(src => src.EndTime))
                .ForMember(dest => dest.IsCurrentUserBooking, opt => opt.Ignore()); // Sätts i controller

            CreateMap<Booking, BookingDto>();

            // BusinessHours har inga mappningar eftersom den skapas direkt
            // CalendarResponseDto har inga mappningar eftersom den sätts samman i controller

            CreateMap<UpdateUserDto, ApplicationUser>();
            CreateMap<ApplicationUser, UserDto>();

            CreateMap<ApplicationUser, CurrentHolderDto>();
            CreateMap<Booking, CurrentHolderDto>()
                .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.User.FirstName))
                .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.User.LastName))
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.User.Email))
                .ForMember(dest => dest.Company, opt => opt.MapFrom(src => src.User.Company))
                .ForMember(dest => dest.Phone, opt => opt.MapFrom(src => src.User.Phone))
                .ForMember(dest => dest.StartTime, opt => opt.MapFrom(src => src.StartTime))
                .ForMember(dest => dest.EndTime, opt => opt.MapFrom(src => src.EndTime));
        }
    }
}
