# RobotBokning

A web application for robot booking management built with .NET backend and Vite + React frontend.

## Development Setup

### Prerequisites
- Git
- .NET 8 SDK
- Node.js (v20 recommended)
- Microsoft SQL Server
- npm

### Getting Started

1. Clone the repository:
```bash
git clone git@github.com:PhilipJ0nsson/RobotBokning.git
cd RobotBokning
```

2. Database Setup:
- Ensure Microsoft SQL Server is running on port 1433
- Update the connection string in appsettings.json if needed

3. Start the Backend:
```bash
cd RobotBokning
dotnet run
```
The backend API will start on http://localhost:5069

4. Start the Frontend:
```bash
cd UI
npm install
npm run dev
```
The Vite dev server will start and provide you with a local URL.

## Production Deployment

### Using Docker Compose

1. Ensure Docker and Docker Compose are installed on your system

2. Build and start the containers:
```bash
docker-compose up --build
```

This will:
- Start the SQL Server database
- Build and run the .NET backend
- Build and run the frontend with Nginx
- The application will be accessible on port 3456

### Environment Configuration

The application automatically handles API URLs:
- Development: Points to localhost:5069
- Production: Uses the appropriate proxy path

## Project Structure

```
RobotBokning/
├── RobotBokning/    # .NET Backend
├── UI/              # Vite + React Frontend
└── docker-compose.yml
```

## Technology Stack

- Backend:
  - .NET 8
  - Entity Framework Core
  - SQL Server

- Frontend:
  - Vite
  - React
  - TypeScript
  - Axios

- Deployment:
  - Docker
  - Docker Compose
  - Nginx