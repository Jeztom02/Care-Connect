# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/45e8fcf3-9dad-4b25-b4c3-17a70c3153cf

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/45e8fcf3-9dad-4b25-b4c3-17a70c3153cf) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Running frontend and backend locally

### Prerequisites

- Node.js 18+ and npm 9+

### Frontend (Vite React)

```sh
npm install
npm run dev
# App: http://localhost:8080
```

### Backend (Express + TypeScript)

```sh
cd server
npm install
npm run dev
# API: http://localhost:3001
```

### Frontend <-> Backend proxy

The Vite dev server proxies requests from `/api/*` to the backend at `http://localhost:3001`.

You can call the API from the frontend like:

```ts
fetch('/api/health')
```

### Configuration

Backend accepts the following environment variables (optional):

- `PORT` (default `3001`)
- `ORIGIN` (default `http://localhost:8080`)

## Authentication (JWT + Roles)

The backend issues JWTs on login and enforces role-based access.

### Seeded users (for local dev)

- Admin: `admin@care.local` / `admin123`
- Doctor: `doctor@care.local` / `doctor123`
- Nurse: `nurse@care.local` / `nurse123`
- Patient: `patient@care.local` / `patient123`

### Endpoints

- `POST /api/auth/login` → body `{ email, password }` → returns `{ token, user }`
- `GET /api/auth/me` → requires `Authorization: Bearer <token>`
- `GET /api/patients` → requires roles: `doctor`, `nurse`, or `admin`

Example (PowerShell):

```powershell
$body = @{ email='doctor@care.local'; password='doctor123' } | ConvertTo-Json
$resp = Invoke-RestMethod http://localhost:3001/api/auth/login -Method Post -Body $body -ContentType 'application/json'
$token = $resp.token
Invoke-RestMethod http://localhost:3001/api/patients -Headers @{ Authorization = "Bearer $token" }
```

## Database (MongoDB via Mongoose)

1) Set `MONGODB_URI` in `server/.env` (or env var):

```
MONGODB_URI="mongodb://127.0.0.1:27017/compassion"
JWT_SECRET="change-me"
ORIGIN="http://localhost:8080"
PORT="3001"
```

2) From `server/`, install and seed:

```sh
npm install
npm run seed
```

3) Start the API:

```sh
npm run dev
```

Collections/models: `User`, `Patient`, `Appointment`, `Message`, `Alert`. The seed inserts users (admin/doctor/nurse/patient/family), sample patients, appointments, messages, and alerts.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/45e8fcf3-9dad-4b25-b4c3-17a70c3153cf) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
