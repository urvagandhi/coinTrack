# coinTrack

Professional, secure, and extensible personal finance management backend. 

Frontend will be implemented in the near future.

---

## Folder Structure

```
coinTrack/
├── backend/                  # Spring Boot REST API (Java 21)
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── com/urva/myfinance/coinTrack/
│   │       │       ├── Config/         # Security & JWT config
│   │       │       ├── Controllers/    # REST controllers
│   │       │       ├── Model/          # Entity models
│   │       │       ├── Repository/     # MongoDB repositories
│   │       │       └── Service/        # Business logic & Zerodha integration
│   │       └── resources/
│   │           ├── application-secret.properties  # Secrets (gitignored)
│   │           ├── static/
│   │           └── templates/
│   ├── pom.xml
│   ├── mvnw, mvnw.cmd
│   └── README.md
├── .gitignore
├── .gitattributes
└── README.md                  # Project documentation
```

---

## Technologies

- **Backend:** Java 21, Spring Boot 3.5.5, Spring Security (JWT), Spring Data MongoDB, Maven, Lombok
- **Database:** MongoDB (local or Atlas)
- **API Integration:** Zerodha Kite Connect

---

## Security & Secret Management

- All secrets (JWT, API keys, DB URIs) are stored in `application-secret.properties` (gitignored).
- Never commit secrets. If leaked, rotate and remove from git history.
- `.gitignore` is preconfigured for safety.

**Example `application-secret.properties`:**

```properties
jwt.secret=your-very-strong-secret
zerodha.api.key=your-kite-api-key
zerodha.api.secret=your-kite-api-secret
spring.data.mongodb.uri=mongodb+srv://<username>:<password>@cluster.mongodb.net/Finance
```

---

## Getting Started

### Prerequisites

- Java 21+
- MongoDB (local or Atlas)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd coinTrack
```

### 2. Backend Setup

```bash
cd backend
# Create application-secret.properties (see above)
./mvnw clean install
./mvnw spring-boot:run
# API: http://localhost:8080
```

### 3. Backend Setup

```
Will be Implemnted further
```

---

## Development & Testing

```bash
cd backend
./mvnw spring-boot:run
./mvnw test
```

---

## Architecture

- **Controller Layer:** REST API endpoints
- **Service Layer:** Business logic, Zerodha integration
- **Repository Layer:** MongoDB data access
- **Model Layer:** Entity definitions
- **Security Layer:** JWT authentication, role-based access

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit & push
4. Open a Pull Request

---

## License

MIT License – see LICENSE file.

---

## Contact

Open an issue for questions or support.

---
