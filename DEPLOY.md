# Deployment Guide

## Prerequisites

- **Node.js** 20.x
- **yarn** 1.22+ (classic)
- **Docker + Docker Compose** (for PostgreSQL and Redis)
- **Git**

---

## Quick Start (Development / Testing)

### 1. Clone & Install

```bash
git clone <repo-url> gym-app
cd gym-app

cd apps/backend && yarn && cd ../..
cd apps/frontend && yarn && cd ../..
```

### 2. Start Database & Redis

```bash
docker compose up -d
```

Wait for both services to be healthy:

```bash
docker compose ps
# Name                      Status
# gym-postgres              healthy
# gym-redis                 healthy
```

### 3. Configure Environment

```bash
cp apps/backend/.env.example apps/backend/.env
```

The `.env` file is read automatically by Prisma in `apps/backend/`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gym_app
REDIS_URL=redis://localhost:6379
NODE_ENV=development
PORT=4000
```

### 4. Generate Prisma Client & Create Tables

```bash
cd apps/backend
yarn prisma generate
yarn prisma db push
cd ../..
```

### 5. Seed Database (Optional)

```bash
cd apps/backend
yarn ts-node src/scripts/seed.ts
cd ../..
```

Creates 10 students, routines, exercise logs, and session reports.

### 6. Start the App

Terminal 1 — Backend (puerto 4000):

```bash
cd apps/backend
yarn dev
```

Terminal 2 — Frontend (puerto 5173):

```bash
cd apps/frontend
yarn dev
```

### 7. Verify

```bash
# Backend health
curl http://localhost:4000/health
# → {"status":"healthy","timestamp":"...","uptime":...,"environment":"development"}

curl http://localhost:4000/health/ready
# → {"status":"ready","timestamp":"...","checks":{"database":"ok","redis":"ok","n8n":"ok"}}

# API — list students (requires seed data)
curl http://localhost:4000/api/students

# Frontend (redirige automaticamente a /students/current-student/history)
open http://localhost:5173
```

---

## Available Commands

### Root

| Command | Description |
|---------|-------------|
| `yarn build` | Typecheck + compile backend, then build frontend |
| `yarn typecheck` | TypeScript check on both projects |
| `yarn lint` | ESLint on both projects |
| `yarn test` | Run Jest tests on both projects |

### Backend (`apps/backend`)

| Command | Description |
|---------|-------------|
| `yarn dev` | Start with hot-reload via ts-node-dev |
| `yarn build` | Typecheck + compile to `dist/` |
| `yarn typecheck` | `tsc --noEmit` |
| `yarn test` | Jest |
| `yarn prisma generate` | Generate Prisma client |
| `yarn prisma db push` | Push schema to database |
| `yarn ts-node src/scripts/seed.ts` | Seed test data |

### Frontend (`apps/frontend`)

| Command | Description |
|---------|-------------|
| `yarn dev` | Vite dev server with HMR (proxy `/api` → `:4000`) |
| `yarn build` | Typecheck + Vite production build |
| `yarn typecheck` | `tsc --noEmit` |

---

## Production Build

### Build the artifacts

```bash
# Backend — compiles to apps/backend/dist/
cd apps/backend && yarn build && cd ../..

# Frontend — compiles to apps/frontend/dist/
cd apps/frontend && yarn build && cd ../..
```

### Docker Images

```bash
# Backend
docker build -t gym-backend:latest \
  -f apps/backend/Dockerfile.prod \
  apps/backend

# Frontend
docker build -t gym-frontend:latest \
  -f apps/frontend/Dockerfile.prod \
  apps/frontend
```

### Docker Compose (Full Stack)

Create `docker-compose.prod.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: gym_app
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
    networks:
      - gym-network

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
    networks:
      - gym-network

  backend:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile.prod
    environment:
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/gym_app
      REDIS_URL: redis://redis:6379
      N8N_CALLBACK_SECRET: ${N8N_CALLBACK_SECRET}
      NODE_ENV: production
      PORT: 4000
    ports:
      - "4000:4000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - gym-network

  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - gym-network

volumes:
  postgres_data:

networks:
  gym-network:
    driver: bridge
```

Run:

```bash
# Create .env.production with your secrets
POSTGRES_PASSWORD=your-secure-password
N8N_CALLBACK_SECRET=your-hmac-secret

# Deploy
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations
docker compose -f docker-compose.prod.yml exec backend yarn prisma db push

# Seed
docker compose -f docker-compose.prod.yml exec backend yarn ts-node src/scripts/seed.ts
```

---

## VPS Deploy (Single Server)

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Clone
git clone <repo-url> gym-app
cd gym-app

# Build & run
docker compose -f docker-compose.prod.yml up -d --build

# SSL with Let's Encrypt + nginx on host
sudo apt install nginx certbot python3-certbot-nginx
sudo certbot --nginx -d gym.yourdomain.com
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `prisma: command not found` | Install it: `cd apps/backend && yarn add -D prisma@5` |
| `Environment variable not found: DATABASE_URL` | Crear `apps/backend/.env` con `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gym_app` |
| Backend won't connect to DB | Check PostgreSQL is running: `docker compose ps`. The `.env DATABASE_URL` must use `localhost`, not `postgres` |
| Error de peer dependencies en `yarn` | Están resueltos — `@mui/icons-material` agregado explicitamente, `eslint-plugin-react-hooks` actualizado a v5 |
| Pagina en blanco | Abrir F12 (consola). Verificar backend en `:4000` y proxy de Vite en `vite.config.ts` |
