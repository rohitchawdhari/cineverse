# CineVerse

## Project Overview

CineVerse is a React + Vite frontend for a movie ticket booking platform. It provides a responsive user experience for movie discovery, booking management, authentication, and admin operations while integrating with a Java Spring Boot backend.

## Features

- Responsive movie catalog and booking pages
- User login and password reset flows
- Admin dashboard support for theater and show management
- Email verification and booking confirmation support
- Axios-based API communication with backend services
- Production-ready Vite build configuration

## Tech Stack

- React 19
- Vite 4+
- React Router DOM
- Axios
- ESLint
- JavaScript (ESM)

## Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/rohitchawdhari/cineverse.git
   ```
2. Navigate to the frontend directory:
   ```bash
   cd cineverse
   ```
3. Install dependencies:
   ```bash
   npm ci
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open the local URL shown in the terminal (typically `http://localhost:5173`).

## Deployment Steps

1. Ensure the backend APIs are running and available.
2. From the frontend directory, build the production bundle:
   ```bash
   npm run build
   ```
3. Preview the build locally if needed:
   ```bash
   npm run preview
   ```
4. Deploy the generated `dist/` directory to your hosting provider.

## GitHub Actions CI/CD

This repository includes a GitHub Actions workflow at `.github/workflows/deploy.yml`.

The workflow:

- runs on push to the `main` branch
- checks out the repository
- sets up Node.js
- installs frontend dependencies with `npm ci`
- builds the Vite frontend with `npm run build`

## GitHub Repository Links

- Repository: https://github.com/rohitchawdhari/cineverse

## Notes

This README covers the frontend app only. The backend lives in the `cineverse-backend/` directory and is expected to run alongside the frontend during full-stack operation.
