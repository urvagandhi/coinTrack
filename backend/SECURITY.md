# Environment Setup

## Security Notice
This project uses environment variables to store sensitive configuration like database credentials. Never commit actual credentials to version control.

## Setup Instructions

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` file with your actual MongoDB credentials:
   ```bash
   MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/?retryWrites=true&w=majority&appName=YourApp
   MONGODB_DATABASE=Finance
   ```

3. Make sure your `.env` file is in `.gitignore` (already configured)

## Running the Application

The application will automatically load environment variables from:
1. System environment variables
2. `.env` file (if present)
3. Default values (localhost MongoDB for development)

## MongoDB Connection

- **Production**: Use MONGODB_URI environment variable
- **Development**: Defaults to `mongodb://localhost:27017/finance`
- **Testing**: Defaults to `mongodb://localhost:27017/finance_test`
