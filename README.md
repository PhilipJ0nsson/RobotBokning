# RobotBokning

A web application for robot booking management built with .NET backend and Vite + React frontend.

## Development Setup

### Prerequisites
* Git
* .NET 8 SDK
* Node.js (v18 recommended)
* Microsoft SQL Server
* npm

### Configuration Files
Before starting the application, you need to set up the following configuration files:

1. `appsettings.Development.json` (for development):
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Your_DB_Connection_String"
  },
  "JWT": {
    "SecretKey": "Your_JWT_Secret"
  },
  "Email": {
    "Username": "Your_Email_Username",
    "Password": "Your_Email_Password",
    "From": "Your_Email_Address"
  }
}
```

2. `.env` file (for production):
```env
DB_PASSWORD=your_db_password
JWT_SECRET_KEY=your_jwt_secret
EMAIL_USERNAME=your_email_username
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=your_email_address
```

### Getting Started

1. Clone the repository:
```bash
git clone git@github.com:PhilipJ0nsson/RobotBokning.git
cd RobotBokning
```

2. Database Setup:
   * Ensure Microsoft SQL Server is running on port 1433
   * Update the connection string in appsettings.Development.json
   * The application will automatically handle database migrations on startup

3. Start the Backend:
```bash
cd RobotBokning
dotnet run
```
The backend API will start on https://localhost:7285

4. Start the Frontend:
```bash
cd UI
npm install
npm run dev
```
The Vite dev server will start on http://localhost:5173

## Production Deployment

### Using Docker Compose

1. Ensure Docker and Docker Compose are installed on your system
2. Create a `.env` file based on `.env.example`
3. Build and start the containers:
```bash
docker-compose up --build
```

This will:
* Start the SQL Server database
* Build and run the .NET backend
* Build and run the frontend with Nginx
* Set up proper networking between containers
* Handle file uploads with volume mounting

The application will be accessible on:
* Frontend: http://localhost:80
* Backend API: http://localhost:5000

### Environment Configuration

The application uses different configurations for development and production:

* Development:
  * Backend API: https://localhost:7285
  * Frontend: http://localhost:5173
  * Database: Local SQL Server instance

* Production (Docker):
  * Frontend: http://localhost:80
  * Backend API: http://localhost:5000
  * Database: Containerized SQL Server

## Project Structure
```
RobotBokning/
├── RobotBokning/          # .NET Backend
│   ├── Controllers/       # API Controllers
│   ├── Models/           # Data Models
│   ├── Services/         # Business Logic
│   ├── Repositories/     # Data Access
│   └── wwwroot/         # Static Files
│       └── uploads/     # File Upload Directory
├── UI/                  # Vite + React Frontend
└── docker-compose.yml   # Docker Composition
```

## Technology Stack

### Backend
* .NET 8
* Entity Framework Core 8.0
* SQL Server 2022
* JWT Authentication
* AutoMapper
* Identity Framework
* Swagger/OpenAPI

### Frontend
* Vite 5
* React 18
* TypeScript
* Axios
* React Query
* Formik + Yup
* TailwindCSS
* React Router DOM

### Deployment & Infrastructure
* Docker
* Docker Compose
* Nginx
* Entity Framework Migrations
* Environment-based Configuration

## Features
* User Authentication & Authorization
* Role-based Access Control (Admin/User)
* File Upload Management
* Robot Booking System
* Email Notifications
* Automated Database Migrations
* Swagger API Documentation

## File Upload Limits
* Maximum file size: 30 MB
* Supported upload directories:
  * /uploads/images/
  * /uploads/pdf/
  * /uploads/text/
