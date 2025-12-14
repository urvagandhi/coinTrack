/**
 * PACKAGE STRUCTURE REORGANIZATION PLAN
 * =====================================
 *
 * This file documents the target domain-driven package structure.
 * The reorganization is planned for a future phase.
 *
 * CURRENT STRUCTURE:
 * com.urva.myfinance.coinTrack/
 * ├── Config/ (security + general configs mixed)
 * ├── Controller/ (all controllers)
 * ├── DTO/ (all DTOs)
 * ├── Exception/ (GlobalExceptionHandler)
 * ├── Model/ (all entities)
 * ├── Repository/ (all repositories)
 * ├── Service/ (all services)
 * ├── Utils/ (utility classes)
 * └── common/ (cross-cutting concerns)
 *
 * TARGET STRUCTURE:
 * com.urva.myfinance.coinTrack/
 * ├── common/
 * │ ├── config/ (RestTemplateConfig, CorsConfig, EncryptionConfig)
 * │ ├── exception/ (DomainException hierarchy)
 * │ ├── filter/ (RequestIdFilter)
 * │ ├── response/ (ApiResponse, ApiErrorResponse)
 * │ └── util/ (LoggingConstants)
 * │
 * ├── security/
 * │ ├── config/ (SecurityConfig)
 * │ ├── filter/ (JwtFilter)
 * │ └── service/ (JWTService, MyUserDetailsService)
 * │
 * ├── user/
 * │ ├── controller/ (UserController, LoginController)
 * │ ├── dto/ (LoginRequest, LoginResponse, etc.)
 * │ ├── model/ (User)
 * │ ├── repository/ (UserRepository)
 * │ └── service/ (UserAuthenticationService, etc.)
 * │
 * ├── broker/
 * │ ├── controller/ (BrokerConnectController, etc.)
 * │ ├── dto/ (BrokerStatusResponse, etc.)
 * │ ├── model/ (Broker, BrokerAccount)
 * │ ├── repository/ (BrokerAccountRepository)
 * │ ├── service/ (BrokerServiceFactory, BrokerService)
 * │ └── provider/ (ZerodhaBrokerService, etc.)
 * │
 * ├── portfolio/
 * │ ├── controller/ (PortfolioController, ManualRefreshController)
 * │ ├── dto/ (PortfolioSummaryResponse, etc.)
 * │ ├── model/ (Holding, Position)
 * │ ├── repository/ (HoldingRepository, PositionRepository)
 * │ └── service/ (PortfolioSummaryService, etc.)
 * │
 * └── note/
 * ├── controller/ (NoteController)
 * ├── model/ (Note)
 * ├── repository/ (NoteRepository)
 * └── service/ (NoteService)
 *
 * MIGRATION STEPS:
 * 1. Create new package directories
 * 2. Move files one domain at a time
 * 3. Update imports in moved files
 * 4. Update imports in dependent files
 * 5. Run mvn compile after each domain move
 * 6. Run mvn test after all moves
 *
 * RISK: High - requires updating imports across entire codebase.
 * STATUS: Deferred to avoid breaking changes. Core functionality complete.
 */
package com.urva.myfinance.coinTrack.common.config;
