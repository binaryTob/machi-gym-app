# ARCHITECTURE.md

## 1. ARQUITECTURA DE RED Y DOCKER

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: gym-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: gym_app
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - gym-network

  redis:
    image: redis:7-alpine
    container_name: gym-redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - gym-network

  backend:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile.dev
    container_name: gym-backend
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/gym_app
      REDIS_URL: redis://redis:6379
      N8N_WEBHOOK_URL: http://n8n:5678/webhook/gym-routine
      N8N_CALLBACK_SECRET: ${N8N_CALLBACK_SECRET}
      BACKEND_URL: http://backend:4000
      FRONTEND_URL: http://frontend:3000
      NODE_ENV: development
      PORT: 4000
    ports:
      - "4000:4000"
    volumes:
      - ./apps/backend:/app
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - gym-network
    command: yarn dev

  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile.dev
    container_name: gym-frontend
    environment:
      VITE_API_URL: http://backend:4000
      VITE_WS_URL: ws://backend:4000
    ports:
      - "3000:3000"
    volumes:
      - ./apps/frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    networks:
      - gym-network
    command: yarn dev

  n8n:
    image: n8nio/n8n:latest
    container_name: gym-n8n
    environment:
      N8N_BASIC_AUTH_ACTIVE: "true"
      N8N_BASIC_AUTH_USER: admin
      N8N_BASIC_AUTH_PASSWORD: ${N8N_PASSWORD}
      N8N_HOST: 0.0.0.0
      N8N_PORT: 5678
      N8N_PROTOCOL: http
      WEBHOOK_URL: http://n8n:5678/
      GENERIC_TIMEZONE: Europe/Madrid
    ports:
      - "5678:5678"
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      - backend
    networks:
      - gym-network

volumes:
  postgres_data:
  n8n_data:

networks:
  gym-network:
    driver: bridge
```

### Variables de Entorno (.env.example)

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/gym_app

# Redis (BullMQ)
REDIS_URL=redis://redis:6379

# n8n
N8N_WEBHOOK_URL=http://n8n:5678/webhook/gym-routine
N8N_CALLBACK_SECRET=tu-clave-secreta-hmac-sha256-aqui
N8N_PASSWORD=admin123

# Backend
BACKEND_URL=http://backend:4000
PORT=4000
NODE_ENV=development

# Frontend
FRONTEND_URL=http://frontend:3000
VITE_API_URL=http://frontend:3000
```

### Red Interna Aislada

- **Nombre:** `gym-network` (driver: bridge)
- **Comunicación permitida:**
  - `backend` ↔ `postgres` (puerto 5432)
  - `backend` ↔ `redis` (puerto 6379)
  - `backend` ↔ `n8n` (puerto 5678) - **bidireccional directo**
  - `frontend` → `backend` (puerto 4000)
- **Sin exposición externa:** n8n y postgres no accesibles desde host salvo puertos mapeados explícitamente para desarrollo

---

## 2. MODELO DE DATOS (Prisma Schema)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum ExerciseCompletion {
  SOBRADO
  AL_LIMITE
  CON_DIFICULTAD
  NO_PUDO_TERMINARLO_BIEN
}

enum IntegrationStatus {
  PENDING
  PROCESSING
  SUCCESS
  ERROR
}

model Student {
  id              String   @id @default(cuid())
  email           String   @unique
  firstName       String
  lastName        String
  height          Int      // cm
  age             Int
  lifestyle       String   // sedentario, activo, muy_activo
  limitations     String?  // operaciones/limitaciones físicas
  weeklyFrequency Int      @default(3) // 3 o 5 días/semana
  windowSize      Int      // CALCULADO: weeklyFrequency * 2 (6-10 sesiones)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  profile         StudentProfile?
  routines        Routine[]
  sessionReports  SessionReport[]
  exerciseLogs    ExerciseLog[]
  integrationLogs IntegrationLog[]

  @@index([email])
  @@index([weeklyFrequency])
  @@map("students")
}

model StudentProfile {
  id        String   @id @default(cuid())
  studentId String   @unique
  student   Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("student_profiles")
}

model Routine {
  id          String   @id @default(cuid())
  studentId   String
  student     Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  name        String
  description String?
  status      String   @default("ACTIVE") // ACTIVE, ARCHIVED
  generatedAt DateTime @default(now())
  n8nRunId    String?  // Trazabilidad n8n
  exercises   Exercise[]

  @@index([studentId, status])
  @@index([generatedAt])
  @@map("routines")
}

model Exercise {
  id          String   @id @default(cuid())
  routineId   String
  routine     Routine  @relation(fields: [routineId], references: [id], onDelete: Cascade)
  name        String
  sets        Int
  reps        String   // ej: "8-12", "3x10", "AMRAP"
  restSeconds Int      @default(90)
  order       Int
  logs        ExerciseLog[]

  @@index([routineId, order])
  @@map("exercises")
}

model ExerciseLog {
  id              String             @id @default(cuid())
  exerciseId      String
  exercise        Exercise           @relation(fields: [exerciseId], references: [id], onDelete: Cascade)
  studentId       String
  student         Student            @relation(fields: [studentId], references: [id], onDelete: Cascade)
  completion      ExerciseCompletion
  actualSets      Int?
  actualReps      String?
  weightKg        Decimal?           @db.Decimal(5,2)
  rpe             Int?               // Rate of Perceived Exertion 1-10
  notes           String?
  performedAt     DateTime           @default(now())

  @@index([studentId, performedAt])
  @@index([exerciseId, performedAt])
  @@map("exercise_logs")
}

model SessionReport {
  id        String   @id @default(cuid())
  studentId String
  student   Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  content   String   @db.Text // Texto libre post-entrenamiento
  createdAt DateTime @default(now())

  @@index([studentId, createdAt])
  @@map("session_reports")
}

model IntegrationLog {
  id            String            @id @default(cuid())
  studentId     String?
  student       Student?          @relation(fields: [studentId], references: [id], onDelete: SetNull)
  routineId     String?
  payload       Json              // Request enviado a n8n
  response      Json?             // Respuesta de n8n
  status        IntegrationStatus @default(PENDING)
  errorMessage  String?
  retryCount    Int               @default(0)
  webhookUrl    String
  callbackUrl   String
  startedAt     DateTime          @default(now())
  completedAt   DateTime?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  @@index([studentId, status])
  @@index([routineId])
  @@index([status, retryCount])
  @@index([createdAt])
  @@map("integration_logs")
}
```

### Lógica de Cálculo de `windowSize`

```typescript
// En backend/src/services/student.service.ts
// Se ejecuta automáticamente al crear/actualizar Student

function calculateWindowSize(weeklyFrequency: number): number {
  // 2 semanas de historial = frecuencia semanal * 2
  // weeklyFrequency: 3 → windowSize = 6
  // weeklyFrequency: 5 → windowSize = 10
  return weeklyFrequency * 2;
}

// Middleware Prisma o hook en servicio
async function updateStudentWindowSize(studentId: string, weeklyFrequency: number) {
  return prisma.student.update({
    where: { id: studentId },
    data: { windowSize: calculateWindowSize(weeklyFrequency) }
  });
}
```

### Convenciones de Identificadores

- **Todos los IDs:** `cuid()` (colision-resistant, URL-safe, ordered)
- **Claves foráneas:** Mismo tipo que la PK referenciada (String)
- **Índices compuestos:** Optimizados para queries de historial reciente (`studentId + createdAt/performedAt`)

---

## 3. FLUJO DE INTEGRACIÓN ASÍNCRONO (n8n)

### Diagrama de Estados (Mermaid)

```mermaid
stateDiagram-v2
    [*] --> PENDING: POST /api/routines/generate
    PENDING --> PROCESSING: Dispatch webhook a n8n
    PROCESSING --> SUCCESS: n8n POST /api/webhooks/n8n/callback {status: SUCCESS}
    PROCESSING --> ERROR: n8n POST /api/webhooks/n8n/callback {status: ERROR} O timeout
    ERROR --> PENDING: Reintento (max 3, backoff exponencial)
    SUCCESS --> [*]
    ERROR --> [*]: Max reintentos agotados
```

### Endpoint Callback Dedicado

```typescript
// POST /api/webhooks/n8n/callback
// Headers requeridos:
//   X-N8N-Signature: <hmac-sha256(payload, N8N_CALLBACK_SECRET)>
//   Content-Type: application/json

interface N8nCallbackPayload {
  routineId: string;
  studentId: string;
  exercises: N8nExerciseDTO[];
  status: 'SUCCESS' | 'ERROR';
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

interface N8nExerciseDTO {
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  order: number;
}
```

**Validación de firma HMAC:**
```typescript
// backend/src/webhooks/n8n.callback.ts
import crypto from 'crypto';

function verifyN8nSignature(payload: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.N8N_CALLBACK_SECRET!)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

### Estrategia de Colas y Reintentos (BullMQ)

```typescript
// backend/src/queues/routine.queue.ts
import { Queue, Worker, Job } from 'bullmq';
import { routineWorker } from '../workers/routine.worker';

export const routineQueue = new Queue('routine-generation', {
  connection: { host: 'redis', port: 6379 },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60000 // 1min → 5min → 15min
    },
    removeOnComplete: 100,
    removeOnFail: 50
  }
});

// Worker procesa jobs
routineQueue.process('generate', routineWorker);

// Job data structure
interface RoutineJobData {
  studentId: string;
  routineId: string;
  webhookUrl: string;
  callbackUrl: string;
}
```

**Worker Logic:**
```typescript
// backend/src/workers/routine.worker.ts
export async function routineWorker(job: Job<RoutineJobData>) {
  const { studentId, routineId, webhookUrl, callbackUrl } = job.data;
  
  // 1. Actualizar IntegrationLog a PROCESSING
  await prisma.integrationLog.update({
    where: { routineId },
    data: { status: 'PROCESSING', retryCount: { increment: 1 } }
  });

  // 2. Preparar payload para n8n
  const student = await prisma.student.findUniqueOrThrow({ 
    where: { id: studentId },
    include: { profile: true }
  });
  
  const payload = buildN8nPayload(student);

  // 3. Dispatch webhook (no bloqueante, fire-and-forget con fetch)
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, callbackUrl })
  });

  if (!response.ok) {
    throw new Error(`n8n webhook failed: ${response.status}`);
  }
}
```

### Trazabilidad Completa via `IntegrationLog`

| Campo | Propósito |
|-------|-----------|
| `payload` | Request completo enviado a n8n (JSON) |
| `response` | Respuesta de n8n en callback (JSON) |
| `status` | Estado actual: PENDING → PROCESSING → SUCCESS/ERROR |
| `retryCount` | Contador de reintentos (max 3) |
| `errorMessage` | Detalle de error si falla |
| `webhookUrl` / `callbackUrl` | URLs usadas para debugging |
| `startedAt` / `completedAt` | Timing completo del proceso |

---

## 4. PLAN DE DESARROLLO EN 6 FASES

### Fase 1: Infraestructura & Base de Datos
**Objetivo:** Entorno Docker funcional, Prisma schema deployado, health checks pasando.

| Entregable | Criterio de Aceptación |
|------------|------------------------|
| `docker-compose.yml` | `yarn docker:up` levanta 4 servicios healthy |
| `prisma/schema.prisma` | `yarn db:migrate` aplica sin errores |
| Monorepo yarn workspaces | `yarn install` resuelve dependencias correctamente |
| Backend Express + TS strict | `yarn typecheck` pasa sin errores |
| Frontend Vite + React + Tailwind | `yarn dev` compila y sirve en :3000 |
| Variables de entorno tipadas (Zod) | `yarn env:validate` valida .env |

**Comando de verificación:** `yarn test:phase1` (vitest: health checks, prisma client, env validation)

---

### Fase 2: Student CRUD & Profile
**Objetivo:** API REST completa para alumnos con validación Zod y UI básica.

| Entregable | Criterio de Aceptación |
|------------|------------------------|
| Zod schemas (Create/Update/Response) | Validación estricta en todos los endpoints |
| StudentService (CRUD + windowSize auto) | Transacciones Prisma, cálculo windowSize correcto |
| Routes RESTful | GET/POST/PUT/DELETE /api/students + /:id/profile |
| Global error handler tipado | ZodError→400, Prisma errors→409/404, default→500 |
| Frontend: useStudents hook (TanStack Query) | Cache, invalidation, optimistic updates |
| Frontend: Form react-hook-form + zodResolver | Validación cliente/servidor consistente |
| Tests unit/integration/component | Cobertura >80% statements, >70% branches |

**Comando de verificación:** `yarn test:phase2`

---

### Fase 3: Rutinas & n8n Integration
**Objetivo:** Generación asíncrona de rutinas vía n8n con cola BullMQ y callback seguro.

| Entregable | Criterio de Aceptación |
|------------|------------------------|
| BullMQ queue + worker + Redis | Jobs procesados, retries exponenciales, DLQ |
| RoutineService.generate() | Crea Routine PENDING, encola job, retorna routineId |
| Worker dispatch webhook n8n | POST con payload completo, actualiza IntegrationLog PROCESSING |
| Callback endpoint HMAC | Valida firma, actualiza IntegrationLog SUCCESS/ERROR |
| SUCCESS: crea Exercises en lote | `createMany` transaccional, routine status ACTIVE |
| Frontend: useRoutines hook + polling | Estado tiempo real hasta SUCCESS/ERROR |
| Test E2E con mock n8n | nock intercepta webhook → callback → verifica BD |

**Comando de verificación:** `yarn test:phase3`

---

### Fase 4: Ejecutivo de Rutinas
**Objetivo:** Ejecución de rutinas de ejercicios con estado de 4 etapas y seguimiento de progreso.

| Entregable | Criterio de Aceptación |
|------------|------------------------|
| ExerciseCompletion enum (Zod nativeEnum) | 4 estados fijos validados en schema |
| Router /api/exercise-logs | Validación ownership (studentId = routine.owner) |
| Service exerciseLogService | CRUD operations, ownership validation, recalcular progreso |
| Page WorkoutSession | Cargar routine + ejercicios + exerciseLogs actuales |
| Component ExerciseCard | Mostrar detalles ejercicio + selector estado completación |
| Optimización estado rutina | Modificar estado rutina según progreso (EN_PROGRESO → COMPLETADA si todos logged) |

**Comando de verificación:** `yarn test:phase4`

---

### Fase 5: Session Reports & Historial Dinámico
**Objetivo:** Informe post-entrenamiento y ventana deslizante calculada por alumno.

| Entregable | Criterio de Aceptación |
|------------|------------------------|
| POST /api/session-reports | Guarda texto libre linked to student |
| GET /api/students/:id/history | Query optimizada con `take=windowSize` |
| HistoryService.getRecentSessions | Include Routine+Exercise+ExerciseLog+SessionReport |
| Frontend History page | Timeline agrupado por fecha, expandible, badges completion |
| windowSize auto-update | Middleware Prisma en create/update Student |
| Test: weeklyFrequency=3 → windowSize=6 | Crea 8 sesiones → GET devuelve últimas 6 |

**Comando de verificación:** `yarn test:phase5`

---

### Fase 6: Polish, Tests & Deploy
**Objetivo:** Producción-ready: CI/CD, Docker prod, lint, typecheck, E2E.

| Entregable | Criterio de Aceptación |
|------------|------------------------|
| CI/CD GitHub Actions | lint + typecheck + test + build + docker buildx |
| Dockerfile.prod multi-stage | Non-root user, distroless/base, imagen <500MB |
| Global error handler completo | RequestId en logs, error codes consistentes |
| OpenAPI spec (/api/docs) | Generado automáticamente (tsoa) |
| Health endpoints | /health (liveness), /health/ready (readiness+DB+Redis+n8n) |
| Seed script | `yarn db:seed` crea datos de prueba variados |
| E2E tests (Playwright) | Flujos críticos: alumno → rutina → entrenamiento → reporte |

**Comando de verificación:** `yarn lint && yarn typecheck && yarn test && yarn build && yarn docker:build:prod`

---

## 5. COOKBOOK DE PROMPTS PARA OPENCODE

### PROMPT FASE 1 — Infraestructura & Base de Datos

```
## Contexto
Crear archivos: docker-compose.yml, .env.example, prisma/schema.prisma, package.json (root + apps/backend + apps/frontend + packages/shared), tsconfig.json base, apps/backend/src/env.schema.ts

## Instrucciones
- Usa yarn workspaces para monorepo (apps/backend, apps/frontend, packages/shared)
- Prisma schema con modelos definidos en ARCHITECTURE.md sección 2, cuid() en todos los IDs
- Docker: healthchecks en todos los servicios, depends_on con condition: service_healthy
- Backend: Express + TypeScript strict, PrismaClient singleton en packages/shared, middleware error global tipado (ZodError→400, PrismaKnownErrors→409/404, default→500)
- Frontend: Vite + React 18 + Tailwind + TypeScript strict, path aliases @/*
- Variables de entorno tipadas con Zod en packages/shared/env.schema.ts
- Scripts package.json root: dev, build, test, lint, typecheck, docker:up, docker:down, db:generate, db:migrate, db:seed

## Verificación
yarn install && yarn docker:up && yarn db:generate && yarn db:migrate && yarn test:phase1
# test:phase1 = vitest run tests/phase1 (health checks, prisma client, env validation)
```

---

### PROMPT FASE 2 — Student CRUD & Profile

```
## Contexto
Modificar/crear: 
- apps/backend/src/routes/students.ts
- apps/backend/src/schemas/student.zod.ts
- apps/backend/src/services/student.service.ts
- apps/backend/src/middleware/validate.ts
- apps/frontend/src/hooks/useStudents.ts
- apps/frontend/src/pages/Students.tsx
- apps/frontend/src/components/StudentForm.tsx
- tests/phase2/*

## Instrucciones
- Zod schemas: CreateStudentDTO, UpdateStudentDTO, StudentResponseDTO (transform windowSize = weeklyFrequency * 2 en output)
- StudentService: métodos tipados (create, findAll, findById, update, delete), transacción Prisma para profile automático
- Routes: RESTful completo, middleware validateBody(schema), validateParams(idSchema), globalErrorHandler
- Frontend: useStudents hook con TanStack Query (cache 5min, staleWhileRevalidate), invalidation en mutaciones
- Form: react-hook-form + zodResolver, campos: firstName, lastName, email, height, age, lifestyle (select), limitations (textarea), weeklyFrequency (number 3|5)
- Tests: unit (service), integration (routes con supertest), component (form rendering + submit)

## Verificación
yarn test:phase2
# vitest run tests/phase2 --coverage (statements >80%, branches >70%)
```

---

### PROMPT FASE 3 — Rutinas & n8n Integration

```
## Contexto
Crear:
- apps/backend/src/routes/routines.ts
- apps/backend/src/services/routine.service.ts
- apps/backend/src/queues/routine.queue.ts
- apps/backend/src/workers/routine.worker.ts
- apps/backend/src/webhooks/n8n.callback.ts
- apps/backend/src/services/integration-log.service.ts
- apps/frontend/src/hooks/useRoutines.ts
- apps/frontend/src/pages/RoutineGenerator.tsx
- tests/phase3/*

## Instrucciones
- BullMQ: Queue 'routine-generation' con Redis (docker-compose ya incluye redis:7-alpine)
- RoutineService.generate(studentId): crea Routine {status: 'PENDING', n8nRunId: null}, encola job, retorna routineId
- Job data: { studentId, routineId, webhookUrl: process.env.N8N_WEBHOOK_URL, callbackUrl: `${process.env.BACKEND_URL}/api/webhooks/n8n/callback` }
- Worker: procesa job → buildN8nPayload(student) → fetch POST webhook → actualiza IntegrationLog PROCESSING
- Callback endpoint: valida HMAC (X-N8N-Signature), body N8nCallbackPayload, actualiza IntegrationLog
  - SUCCESS: createMany Exercises, Routine status ACTIVE, n8nRunId = metadata.runId
  - ERROR: Routine status ERROR, errorMessage guardado
- Retry policy: attempts=3, backoff={type:'exponential', delay:60000}
- Frontend: useRoutines hook con polling interval 2s (o SSE) hasta status !== PENDING/PROCESSING
- Test E2E: nock intercepta webhook n8n → responde 200 → POST callback → verifica Routine+Exercises creados + IntegrationLog SUCCESS

## Verificación
yarn test:phase3
# test E2E mock n8n: flujo completo PENDING → PROCESSING → SUCCESS → BD consistente
```

---

### PROMPT FASE 4 — Ejecución & Exercise Log

```
## Contexto
Crear:
- apps/backend/src/routes/exercise-logs.ts
- apps/backend/src/schemas/exercise-log.zod.ts
- apps/backend/src/services/exercise-log.service.ts
- apps/frontend/src/pages/WorkoutSession.tsx
- apps/frontend/src/components/ExerciseCard.tsx
- apps/frontend/src/components/CompletionSelector.tsx
- tests/phase4/*

## Instrucciones
- ExerciseCompletion enum exportado desde packages/shared (Zod nativeEnum)
- POST /api/exercise-logs: body { exerciseId, completion, actualSets?, actualReps?, weightKg?, rpe?, notes? }
- Validación: exerciseId existe en routine del student, completion ∈ enum, rpe 1-10
- PATCH /api/exercise-logs/:id: actualización parcial (auto-save)
- WorkoutSession page: params routineId, fetch routine con exercises ordenados
- ExerciseCard: nombre, sets/reps/rest, CompletionSelector (radio group 4 estados), inputs colapsables sets/reps/weight/rpe/notes
- Auto-save: debounce 500ms en onChange → PATCH, loading state visual
- Progreso: badge "X/Y ejercicios completados", botón "Finalizar sesión" disabled si !allLogged
- Tests: component ExerciseCard (render → select completion → verifica request + DB), integration (full flow)

## Verificación
yarn test:phase4
# test component: render ExerciseCard → select completion → verifica POST request + DB persist
```

---

### PROMPT FASE 5 — Session Reports & Historial Dinámico

```
## Contexto
Crear:
- apps/backend/src/routes/session-reports.ts
- apps/backend/src/schemas/session-report.zod.ts
- apps/backend/src/services/history.service.ts
- apps/frontend/src/pages/History.tsx
- apps/frontend/src/hooks/useHistory.ts
- apps/frontend/src/components/SessionTimeline.tsx
- tests/phase5/*

## Instrucciones
- POST /api/session-reports: { studentId, content } → SessionReport (texto libre, max 10000 chars)
- GET /api/students/:id/history?limit=:windowSize → últimas N sesiones
- HistoryService.getRecentSessions(studentId): 
  1. Obtiene student.windowSize
  2. Query única: Routine findMany where studentId, orderBy generatedAt desc, take windowSize, include exercises+logs+report
- Frontend History: SessionTimeline agrupado por fecha (date-fns), cada sesión expandible mostrando:
  - Rutina nombre + fecha
  - Lista ejercicios con badge completion (color coded: green=SOBRADO, yellow=AL_LIMITE, orange=CON_DIFICULTAD, red=NO_PUDO_TERMINARLO_BIEN)
  - SessionReport content si existe
- windowSize auto-update: Prisma middleware `student: { update: { windowSize: weeklyFrequency * 2 } }` en create/update Student
- Test: crea student weeklyFrequency=3 → windowSize=6 → crea 8 sesiones → GET history devuelve exactamente 6

## Verificación
yarn test:phase5
# test: student weeklyFrequency=3 → windowSize=6 → 8 sesiones creadas → GET history devuelve 6
```

---

### PROMPT FASE 6 — Polish, Tests & Deploy

```
## Contexto
Archivos transversales:
- .github/workflows/ci.yml
- apps/backend/Dockerfile.prod
- apps/frontend/Dockerfile.prod
- apps/backend/src/middleware/error-handler.ts
- apps/backend/src/middleware/request-id.ts
- apps/backend/src/docs/openapi.ts (o tsoa setup)
- apps/frontend/src/components/ui/* (shadcn/ui o custom)
- prisma/seed.ts
- tests/e2e/*

## Instrucciones
- CI: jobs paralelos (lint, typecheck, test, build), Docker buildx multi-platform, deploy staging en merge a main
- Dockerfile.prod: multi-stage (builder: node:20-alpine yarn install --prod + build → runner: gcr.io/distroless/nodejs20), non-root user, COPY --from=builder /app/dist /app
- Global error handler: requestId header (crypto.randomUUID()), logging estructurado (pino), ZodError→400 con issues[], Prisma P2003→409, P2025→404, default→500
- OpenAPI: tsoa o manual spec en /api/docs (Swagger UI)
- Health: GET /health (200 OK), GET /health/ready (checks DB+Redis+n8n reachable → 200/503)
- Seed: 10 students (mix weeklyFrequency 3/5), profiles, 3 rutinas cada uno con exercises, logs variados, reports
- E2E Playwright: 
  1. Crear alumno → generar rutina → esperar callback mock → ejecutar workout → guardar reporte → ver historial
  2. Validar windowSize dinámico cambiando weeklyFrequency

## Verificación
yarn lint && yarn typecheck && yarn test && yarn build && yarn docker:build:prod
# Todos exit code 0; imagen final < 500MB; health checks pasan en staging; E2E verde
```

---

## DECISIONES TÉCNICAS CLAVE (Registro)

| Tema | Decisión | Justificación |
|------|----------|---------------|
| **Queue** | BullMQ + Redis | Robusto, retries exponenciales, DLQ, observabilidad |
| **Auth** | JWT stateless (Fase 2+) | Escalable, sin sesión servidor, estándar industria |
| **n8n Auth Callback** | HMAC-SHA256 header | Verificación origen, anti-replay, estándar webhooks |
| **windowSize** | `weeklyFrequency * 2` | 2 semanas historial, simple, predecible |
| **Frontend State** | TanStack Query + React Context | Server state separado, cache automático, devtools |
| **Testing** | Vitest (unit/int) + Playwright (E2E) | Velocidad, TypeScript nativo, API moderna |
| **IDs** | `cuid()` | Colision-resistant, ordered, URL-safe, no sequential |
| **Validación** | Zod en runtime + tipos TS | Single source of truth, inferencia automática |

---

## ESTRUCTURA DE CARPETAS ESPERADA

```
gym-app/
├── .github/workflows/ci.yml
├── docker-compose.yml
├── .env.example
├── package.json    # "workspaces" field for monorepo
├── tsconfig.json
├── ARCHITECTURE.md
├── apps/
│   ├── backend/
│   │   ├── Dockerfile.dev
│   │   ├── Dockerfile.prod
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.ts
│   │       ├── config/
│   │       ├── middleware/
│   │       ├── routes/
│   │       ├── services/
│   │       ├── schemas/
│   │       ├── queues/
│   │       ├── workers/
│   │       ├── webhooks/
│   │       └── utils/
│   └── frontend/
│       ├── Dockerfile.dev
│       ├── Dockerfile.prod
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── pages/
│           ├── components/
│           ├── hooks/
│           ├── services/
│           └── types/
├── packages/
│   └── shared/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── env.schema.ts
│           ├── types/
│           ├── constants/
│           └── utils/
└── tests/
    ├── phase1/
    ├── phase2/
    ├── phase3/
    ├── phase4/
    ├── phase5/
    └── e2e/
```

---

*Documento generado automáticamente — Arquitectura v1.0 — Gym App*
