# Finance Dashboard

A full-stack personal finance management application with secure user authentication, data visualization, and modern web technologies.

## Project Structure

This project is organized as a monorepo with separate frontend and backend applications:

```
finance_dashboard/
├── backend/                 # Spring Boot REST API
│   ├── src/
│   ├── pom.xml
│   ├── mvnw, mvnw.cmd
│   └── README.md
├── frontend/                # React TypeScript SPA
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   └── README.md
├── .gitignore
├── .gitattributes
└── README.md               # This file
```

## Technologies

### Backend
- **Java 21**
- **Spring Boot 3.5.5**
- **Spring Security** with JWT authentication
- **Spring Data MongoDB** for database operations
- **Maven** for dependency management
- **Lombok** for reducing boilerplate code

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Modern CSS** for styling
- **Component-based architecture**

## Quick Start

### Prerequisites
- Java 21 or higher
- Node.js 18+ and npm
- MongoDB (local or cloud instance)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd finance_dashboard
```

### 2. Setup Backend
```bash
cd backend
./mvnw clean install
./mvnw spring-boot:run
```
The backend API will be available at `http://localhost:8080`

### 3. Setup Frontend (in a new terminal)
```bash
cd frontend
npm install
npm run dev
```
The frontend will be available at `http://localhost:5173`

## Features

### Authentication & Security
- JWT-based user authentication
- Secure password handling
- Role-based access control
- Protected API endpoints

### Dashboard Features
- Account overview and balance tracking
- Transaction management
- Expense categorization and charts
- Quick financial actions
- Responsive design for mobile and desktop

### Technical Features
- RESTful API design
- MongoDB for flexible data storage
- Real-time data updates
- Component-based frontend architecture
- Hot module replacement for development

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Health Check
- `GET /actuator/health` - Application health status

## Development

### Backend Development
```bash
cd backend
./mvnw spring-boot:run
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Running Tests
```bash
# Backend tests
cd backend
./mvnw test

# Frontend tests (if available)
cd frontend
npm test
```

### Building for Production

#### Backend
```bash
cd backend
./mvnw clean package -DskipTests
```

#### Frontend
```bash
cd frontend
npm run build
```

## Database Configuration

Update `backend/src/main/resources/application.properties`:

```properties
# Local MongoDB
spring.data.mongodb.uri=mongodb://localhost:27017/finance_dashboard

# MongoDB Atlas (cloud)
spring.data.mongodb.uri=mongodb+srv://username:password@cluster.mongodb.net/finance_dashboard
```

## Project Setup Notes

- The original package name `com.urva.myfinance.finance-dashboard` was invalid and has been changed to `com.urva.myfinance.finance_dashboard`
- Maven wrapper files are included for consistent builds across environments
- ESLint and TypeScript configurations are set up for code quality
- Development tools are configured for hot reloading and debugging

## Architecture

### Backend Architecture
- **Controller Layer**: REST API endpoints
- **Service Layer**: Business logic
- **Repository Layer**: Data access
- **Model Layer**: Entity definitions
- **Security Layer**: Authentication and authorization

### Frontend Architecture
- **Components**: Reusable UI components
- **Pages**: Route-based page components
- **Services**: API communication
- **Utilities**: Helper functions
- **Assets**: Static resources

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or support, please open an issue in this repository.
