# coinTrack Backend

Spring Boot backend for the CoinTrack personal finance platform, featuring secure user authentication, MongoDB integration, and Zerodha API connectivity.

---

## Features

- JWT Authentication: Secure login and protected endpoints
- User Management: Register, login, and manage user profiles
- Zerodha Integration: Link accounts, fetch holdings, positions, orders, and SIPs
- MongoDB: Flexible, cloud-ready data storage
- Production-Ready Security: BCrypt password hashing, CORS, and secrets management

---

## Project Structure

```
backend/
├── src/main/java/com/urva/myfinance/coinTrack/
│   ├── Config/         # SecurityConfig, JwtFilter
│   ├── Controller/     # LoginController, UserController, ZerodhaController
│   ├── DTO/            # Data Transfer Objects
│   ├── Model/          # User, UserPrincipal, DatabaseSequence, ZerodhaAccount
│   ├── Repository/     # UserRepository, ZerodhaAccountRepository
│   └── Service/        # UserService, JWTService, ZerodhaService, etc.
├── src/main/resources/
│   ├── application.properties           # General config (gitignored)
│   ├── application-secret.properties    # Secrets (gitignored)
│   ├── static/
│   └── templates/
├── pom.xml
├── mvnw, mvnw.cmd
└── README.md
```

---

## Configuration & Secrets

- Never commit real secrets!
- All sensitive info (MongoDB URI, Zerodha API keys, JWT secret) goes in `application-secret.properties` (gitignored).

**Example `application-secret.properties`:**

```properties
spring.data.mongodb.uri=mongodb+srv://<username>:<password>@cluster.mongodb.net/Finance
zerodha.api.key=your_kite_api_key
zerodha.api.secret=your_kite_api_secret
jwt.secret=your-very-strong-secret
zerodha.redirect.url=http://localhost:8080/api/kite/callback
```

---

## Security

- All protected endpoints require a valid JWT in the `Authorization` header
- Passwords are hashed using BCrypt
- CORS/CSRF configured for safe frontend-backend communication

---

## API Endpoints

**Authentication**
- `POST /login` — User login
- `POST /api/register` — User registration

**User**
- `GET /api/users/profile` — Get profile
- `PUT /api/users/profile` — Update profile

**Zerodha**
- `POST /api/zerodha/connect` — Link Zerodha account
- `GET /api/zerodha/me` — Link status
- `GET /api/zerodha/holdings` — Holdings
- `GET /api/zerodha/positions` — Positions
- `GET /api/zerodha/orders` — Orders
- `GET /api/zerodha/sips` — Mutual fund SIPs

**Health**
- `GET /actuator/health` — Health check

---

## Development & Deployment

### Build & Run

```bash
./mvnw clean install
./mvnw spring-boot:run
```

### Running Tests

```bash
./mvnw test
```

### Production Build

```bash
./mvnw clean package -DskipTests
java -jar target/coinTrack-0.0.1-SNAPSHOT.jar
```

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run tests to ensure everything works
6. Submit a pull request

---

## License

MIT License – see LICENSE file.
