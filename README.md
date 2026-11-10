# JobSeeker

India's all-in-one portal for **private and government jobs**. JobSeeker connects job seekers, employers, and administrators on a single platform with job discovery across all 28 states and 8 union territories.

---

## Features

**Job Seekers**
- Search and filter jobs by keyword, category, location, qualification, experience, job type, and work mode
- Browse private jobs, government jobs, companies, and detailed job pages
- Register / login with role-based access
- Manage profile and upload a resume (PDF)
- Apply to jobs with a cover letter
- Track application status (Submitted → Under Review → Shortlisted → Rejected / Hired)
- Save jobs and receive notifications

**Employers**
- Company profile management with logo upload
- Post, edit, and manage job listings
- Review applicants and update application status
- Dashboard with hiring stats

**Administrators**
- Manage users, employers, and jobs
- Approve / reject job postings
- Verify government job notifications
- Post official government jobs
- View all applications and contact messages

---

## Tech Stack

**Frontend**
- React 18 + Vite
- React Router v6
- Tailwind CSS
- Axios
- Lucide React icons

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication (`jsonwebtoken`)
- bcryptjs password hashing
- Multer file uploads
- Helmet, CORS, express-rate-limit, express-validator
- Morgan request logging

---

## Project Structure

```
JobSeeker/
├── client/                 # React + Vite frontend
│   ├── public/             # Static assets (favicon)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Auth & Toast context
│   │   ├── hooks/          # Custom hooks
│   │   ├── layouts/        # Public & dashboard layouts
│   │   ├── pages/          # Route pages (public, dashboard, employer, admin)
│   │   ├── services/       # API client & service modules
│   │   └── utils/          # Constants & formatters
│   └── vite.config.js      # Dev proxy → backend
├── server/                 # Express REST API
│   ├── config/             # DB connection
│   ├── controllers/        # Route handlers
│   ├── data/               # Static data (locations, categories)
│   ├── middleware/         # Auth, rate limiting, error handling, uploads
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API route definitions
│   ├── uploads/            # Logos, profiles, notification PDFs
│   ├── utils/              # Seed scripts, token helpers
│   └── server.js           # App entry point
├── package.json            # Root scripts (workspace-level)
└── README.md
```

---

## Prerequisites

- **Node.js** 18 or newer
- **npm** 9 or newer
- **MongoDB** — local instance or a MongoDB Atlas cluster

---

## Getting Started

### 1. Clone and install

```bash
git clone <your-repository-url>
cd "JobSeeker"
npm run install:all
```

`install:all` installs dependencies for both `server/` and `client/`.

### 2. Configure the server environment

Copy `server/.env.example` to `server/.env` and update the values:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/jobseeker?retryWrites=true&w=majority

JWT_SECRET=replace-this-with-a-long-random-secret-at-least-32-characters
JWT_EXPIRES_IN=7d

MAX_RESUME_MB=5
MAX_LOGO_MB=2

# Admin bootstrap (used by `npm run seed` / `npm run create-admin`)
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=xxxxxxxx
ADMIN_PHONE=9999999999
```

### 3. Configure the client environment

Copy `client/.env.example` to `client/.env`. In development the Vite dev server proxies `/api` and `/uploads` to `http://localhost:5000`, so the defaults work out of the box.

```env
VITE_API_URL
VITE_SERVER_URL
```

### 4. Seed the database

```bash
npm run seed
```

This creates the admin account defined in `server/.env`.

To also load demo employers, jobs, and a demo job seeker:

```bash
npm run seed:demo --prefix server
```

### 5. Run the app

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/api/health

---

## Demo Accounts (`npm run seed:demo --prefix server`)

| Role      | Email                        | Password    |
|-----------|------------------------------|-------------|
| Job Seeker| `demo.seeker@jobseeker.in`   | `Demo@12345`|
| Employer  | `demo.employer@jobseeker.in` | `Demo@12345`|
| Employer  | `hr.bharatinfotech@jobseeker.in` | `Demo@12345` |
| Employer  | `talent@keralacare.example`  | `Demo@12345`|
| Admin     | value of `ADMIN_EMAIL`       | value of `ADMIN_PASSWORD` |

> The demo job seeker has no resume uploaded — upload one from the **Resume** page to apply for private jobs.

---

## Available Scripts

Run from the project root:

| Script              | Description                                      |
|---------------------|--------------------------------------------------|
| `npm run install:all` | Install dependencies for server and client     |
| `npm run dev`         | Run backend and frontend together (concurrently)|
| `npm run dev:server`  | Run backend only with nodemon                   |
| `npm run dev:client`  | Run frontend only with Vite                     |
| `npm run build`       | Build the frontend for production                |
| `npm run seed`        | Seed admin account                               |
| `npm run start`       | Start the backend in production mode             |

Server-only scripts (inside `server/`):

| Script                  | Description                              |
|-------------------------|------------------------------------------|
| `npm run seed:demo`     | Seed admin + demo data                   |
| `npm run create-admin`  | Create / promote an admin user           |

---

## API Overview

All endpoints are prefixed with `/api`.

| Base Route            | Purpose                                  |
|-----------------------|------------------------------------------|
| `/api/auth`           | Register, login, current user            |
| `/api/users`          | User profile operations                  |
| `/api/locations`      | States, districts, cities                |
| `/api/jobs`           | Job listing, details, search & filter    |
| `/api/applications`   | Apply, list, update application status   |
| `/api/employer`       | Employer profile & job management        |
| `/api/admin`          | Admin management & moderation            |
| `/api/notifications`  | User notifications                       |
| `/api/saved-jobs`     | Saved jobs                               |
| `/api`                | Public routes (categories, companies, etc.) |
| `/api/health`         | Health check                             |

Authentication uses JWT sent in the `Authorization: Bearer <token>` header.

---

## Roles & Access

| Role        | Dashboard Base | Access                                      |
|-------------|----------------|---------------------------------------------|
| `jobseeker` | `/dashboard`   | Profile, resume, applications, saved jobs   |
| `employer`  | `/employer`    | Company profile, post/manage jobs, applicants |
| `admin`     | `/admin`       | Users, employers, jobs, approvals, messages |

---

## Security Notes

- Passwords are hashed with bcrypt; JWT secret must be ≥ 32 characters.
- API is rate-limited and hardened with Helmet.
- Resumes are **never served statically** — they are streamed only through protected, authorized API routes.
- Public static access is limited to company logos, profile images, and official notification PDFs.
- Never commit `.env` files or the `server/uploads/` directory (already ignored by `.gitignore`).

---

## Production Build

```bash
npm run build        # builds client into client/dist
npm run start        # starts the Express API
```

Serve `client/dist` through your web server / CDN and point `VITE_API_URL` (or `VITE_SERVER_URL`) at the deployed API. Set `CLIENT_URL` on the server to the deployed frontend origin(s) for CORS.

---

## License

This project is provided for educational and personal use. Add a license of your choice before distributing publicly.
