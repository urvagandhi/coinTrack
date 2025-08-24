---

# Finance Dashboard Backend

A robust Spring Boot backend for the CoinTrack personal finance platform, featuring secure user authentication, MongoDB integration, and seamless Zerodha API connectivity.

---

## 🚀 Features

- **JWT Authentication**: Secure login and protected endpoints.
- **User Management**: Register, login, and manage user profiles.
- **Zerodha Integration**: Link accounts, fetch holdings, positions, orders, and SIPs.
- **MongoDB**: Flexible, cloud-ready data storage.
- **Production-Ready Security**: BCrypt password hashing, CORS, and secrets management.

---

## 🗂️ Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/urva/myfinance/coinTrack/
│   │   │   ├── Config/         # SecurityConfig, JwtFilter
│   │   │   ├── Controller/     # LoginController, UserController, ZerodhaController
│   │   │   ├── Model/          # User, UserPrincipal, DatabaseSequence, ZerodhaAccount
│   │   │   ├── Repository/     # UserRepository, ZerodhaAccountRepository
│   │   │   └── Service/        # UserService, JWTService, ZerodhaService, etc.
│   │   └── resources/
│   │       ├── application.properties           # Sensitive config (gitignored)
│   │       ├── application-secret.properties    # Secrets-Example (gitignored, see below)
│   │       └── ...
│   └── test/
│       └── java/com/urva/myfinance/coinTrack/
└── README.md
```

---

## ⚙️ Configuration & Secrets

**Never commit real secrets!**

- `application.properties`: General config (safe for sharing, but gitignored).
- `application-secret.properties`: Place all sensitive info here (MongoDB URI, Zerodha API keys, etc).
  - Not tracked by git.
  - Copy from `application-secret.properties.example` and fill in your values.

**Example:**

```properties
spring.data.mongodb.uri=mongodb+srv://<username>:<password>@cluster.mongodb.net/Finance
zerodha.api.key=your_kite_api_key
zerodha.api.secret=your_kite_api_secret
zerodha.redirect.url=http://localhost:8080/api/kite/callback
```

---

## 🔒 Security

- **JWT**: All protected endpoints require a valid token in the `Authorization` header.
- **Password Hashing**: BCrypt for all user passwords.
- **CORS/CSRF**: Configured for safe frontend-backend communication.
- **Secrets**: Use `application-secret.properties` for all credentials.

---

## 🛠️ How It Works

1. **User Registration & Login**:

   - Register via `/api/register`, login via `/login`.
   - Receive a JWT for all further requests.
2. **Zerodha Account Linking**:

   - Redirect user to Zerodha login, receive `requestToken` in callback.
   - Call `/api/zerodha/connect` with `requestToken` and `appUserId`.
   - Fetch holdings, positions, orders, and SIPs using dedicated endpoints.
3. **Token Expiry**:

   - Zerodha tokens are valid for the trading day.
   - If expired, user is prompted to re-login with Zerodha.
4. **Security:**- All sensitive endpoints require a valid JWT.

   - Passwords are hashed using BCrypt.
   - CORS and CSRF are configured for secure frontend-backend communication.

---

## 📚 API Endpoints

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

## 🏗️ Development & Deployment

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

## 🧑‍💻 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run tests to ensure everything works
6. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License.

- **Password Hashing:** User passwords are stored securely using BCrypt.
- **CORS/CSRF:** Configured for secure frontend-backend communication.
- **Secrets Management:** Never commit real secrets. Use `application-secret.properties` and keep it out of git.
