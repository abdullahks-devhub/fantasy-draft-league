# Wrestling Fantasy League (V4)

A production-ready monorepo for managing a 10-player professional wrestling fantasy league. Built with Fastify, Prisma, React, and TanStack Query.

## 🚀 Architecture

- **Backend (apps/api)**: Fastify API with Prisma ORM. Handles scoring logic, automated scraping, waiver wire resolution, and trade execution.
- **Frontend (apps/web)**: React with Tailwind CSS and TanStack Query. Features a dark-mode premium interface with real-time data integration.
- **Database**: PostgreSQL (Prisma).
- **Automation**: BullMQ for handling background scrapers and point generation.

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL instance
- Redis instance (for BullMQ)

### Installation

1. Clone the repo.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `apps/api/.env` and `apps/web/.env`:
   - `DATABASE_URL`: Your Postgres connection string.
   - `REDIS_URL`: Your Redis connection string.
   - `JWT_SECRET`: Secret key for admin authentication.
   - `VITE_API_URL`: URL of the running API (e.g., `http://localhost:3000`).

4. Run migrations:
   ```bash
   cd apps/api && npx prisma migrate dev
   ```

5. Start development servers:
   ```bash
   npm run dev
   ```

## 🛡️ Admin Access

The `/admin` route is protected by JWT authentication. 
1. Use the `POST /auth/register` endpoint initially to create your admin user.
2. Login at `/login` to access the Ops Center.

## 📈 System Features

- **Automated Scraper**: Triggers daily to fetch results from Cagematch.net.
- **Conflict Resolution**: Waiver wire handling for multiple players claiming the same free agent.
- **Season Archives**: View historical standings and rosters from previous years.
- **Hot List**: Real-time trending analysis of top-performing wrestlers.

## 📄 License

MIT
