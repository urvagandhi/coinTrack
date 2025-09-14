# coinTrack

Professional, secure, and extensible personal finance management platform.

---

## Project Structure

```
coinTrack/
├── backend/   # Spring Boot REST API (Java 21)
│   ├── src/main/java/com/urva/myfinance/coinTrack/
│   │   ├── Config/         # Security & JWT config
│   │   ├── Controller/     # REST controllers
│   │   ├── DTO/            # Data Transfer Objects
│   │   ├── Model/          # Entity models
│   │   ├── Repository/     # MongoDB repositories
│   │   └── Service/        # Business logic & Zerodha integration
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   ├── application-secret.properties  # Secrets (gitignored)
│   │   ├── static/
│   │   └── templates/
│   ├── pom.xml
│   ├── mvnw, mvnw.cmd
│   └── README.md
├── frontend/  # Next.js 14+ (React)
│   ├── app/           # Pages & layouts
│   ├── components/    # Reusable UI components
│   ├── contexts/      # React context providers
│   ├── lib/           # Utility libraries
│   ├── public/        # Static assets
│   ├── package.json
│   └── README.md
├── .gitignore
├── .gitattributes
└── README.md
```

---

## Technologies

- **Backend:** Java 21, Spring Boot 3.5.5, Spring Security (JWT), Spring Data MongoDB, Maven, Lombok
- **Frontend:** Next.js 14+, React, Tailwind CSS
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
- Node.js 18+
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

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# App: http://localhost:3000
```

---

## Development & Testing

### Backend

```bash
cd backend
./mvnw spring-boot:run
./mvnw test
```

### Frontend

```bash
cd frontend
npm run dev
npm run test # If tests are implemented
```

---

## Architecture

- **Backend:**
	- Controller Layer: REST API endpoints
	- Service Layer: Business logic, Zerodha integration
	- Repository Layer: MongoDB data access
	- Model Layer: Entity definitions
	- Security Layer: JWT authentication, role-based access
- **Frontend:**
	- Next.js App Router structure
	- AuthGuard for protected routes
	- Context API for authentication state
	- Modular components and layouts

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
