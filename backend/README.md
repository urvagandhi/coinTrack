# Finance Dashboard Backend

This is the backend service for the Finance Dashboard application built with Spring Boot.

## Technologies Used

- **Java 21**
- **Spring Boot 3.5.5**
- **Spring Security** with JWT authentication
- **Spring Data MongoDB** for database operations
- **Maven** for dependency management
- **Lombok** for reducing boilerplate code

## Key Features

- JWT-based authentication and authorization
- RESTful API endpoints
- MongoDB database integration
- User management system
- Security configuration with Spring Security
- Actuator endpoints for monitoring

## Prerequisites

- Java 21 or higher
- MongoDB (local or cloud instance)
- Maven 3.6+ (or use the included Maven wrapper)

## Getting Started

### 1. Clone and Setup
```bash
cd backend
```

### 2. Configure Database
Update `src/main/resources/application.properties` with your MongoDB connection details:
```properties
spring.data.mongodb.uri=mongodb://localhost:27017/finance_dashboard
# or for MongoDB Atlas
# spring.data.mongodb.uri=mongodb+srv://username:password@cluster.mongodb.net/finance_dashboard
```

### 3. Build the Project
```bash
# Using Maven wrapper (recommended)
./mvnw clean install

# Or using system Maven
mvn clean install
```

### 4. Run the Application
```bash
# Using Maven wrapper
./mvnw spring-boot:run

# Or using system Maven
mvn spring-boot:run

# Or run the JAR file
java -jar target/finance-dashboard-0.0.1-SNAPSHOT.jar
```

The application will start on `http://localhost:8080`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Health Check
- `GET /actuator/health` - Application health status

## Project Structure

```
src/
├── main/
│   ├── java/
│   │   └── com/urva/myfinance/finance_dashboard/
│   │       ├── FinanceDashboardApplication.java
│   │       ├── Config/
│   │       │   └── SecurityConfig.java
│   │       ├── Controllers/
│   │       │   ├── LoginController.java
│   │       │   └── UserController.java
│   │       ├── Model/
│   │       │   ├── User.java
│   │       │   ├── UserPrincipal.java
│   │       │   └── DatabaseSequence.java
│   │       ├── Repository/
│   │       │   └── UserRepository.java
│   │       └── Service/
│   │           ├── UserService.java
│   │           ├── JWTService.java
│   │           ├── CustomerUserDetailService.java
│   │           └── SequenceGeneratorService.java
│   └── resources/
│       ├── application.properties
│       ├── static/
│       └── templates/
└── test/
    └── java/
        └── com/urva/myfinance/finance_dashboard/
            └── FinanceDashboardApplicationTests.java
```

## Development

### Running Tests
```bash
./mvnw test
```

### Building for Production
```bash
./mvnw clean package -DskipTests
```

### Development Mode
For development with auto-restart on file changes:
```bash
./mvnw spring-boot:run -Dspring-boot.run.fork=false
```

## Configuration

### Application Properties
- `application.properties` - Main configuration
- `application-test.properties` - Test environment configuration

### Security
- JWT token expiration and secret key configuration
- CORS settings for frontend integration
- Authentication and authorization rules

## Contributing

1. Create a feature branch
2. Make your changes
3. Add tests for new functionality
4. Run tests to ensure everything works
5. Submit a pull request

## License

This project is licensed under the MIT License.
