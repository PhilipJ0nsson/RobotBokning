FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["RobotBokning.csproj", "./"]
RUN dotnet restore "RobotBokning.csproj"
COPY . .
RUN dotnet build "RobotBokning.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "RobotBokning.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Skapa wwwroot-mapparna för dokumentuppladdningar
RUN mkdir -p /app/wwwroot/uploads/images
RUN mkdir -p /app/wwwroot/uploads/pdf 
RUN mkdir -p /app/wwwroot/uploads/text
RUN chmod -R 777 /app/wwwroot

ENTRYPOINT ["dotnet", "RobotBokning.dll"]