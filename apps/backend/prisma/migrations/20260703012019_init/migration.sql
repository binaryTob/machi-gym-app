-- CreateEnum
CREATE TYPE "ExerciseCompletion" AS ENUM ('SOBRADO', 'AL_LIMITE', 'CON_DIFICULTAD', 'NO_PUDO_TERMINARLO_BIEN');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'ERROR');

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "height" INTEGER NOT NULL,
    "age" INTEGER NOT NULL,
    "lifestyle" TEXT NOT NULL,
    "limitations" TEXT,
    "weeklyFrequency" INTEGER NOT NULL DEFAULT 3,
    "windowSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routines" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "n8nRunId" TEXT,

    CONSTRAINT "routines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" TEXT NOT NULL,
    "restSeconds" INTEGER NOT NULL DEFAULT 90,
    "order" INTEGER NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_logs" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "completion" "ExerciseCompletion" NOT NULL,
    "actualSets" INTEGER,
    "actualReps" TEXT,
    "weightKg" DECIMAL(5,2),
    "rpe" INTEGER,
    "notes" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_reports" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_logs" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "routineId" TEXT,
    "payload" JSONB NOT NULL,
    "response" JSONB,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "webhookUrl" TEXT NOT NULL,
    "callbackUrl" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE INDEX "students_email_idx" ON "students"("email");

-- CreateIndex
CREATE INDEX "students_weeklyFrequency_idx" ON "students"("weeklyFrequency");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_studentId_key" ON "student_profiles"("studentId");

-- CreateIndex
CREATE INDEX "routines_studentId_status_idx" ON "routines"("studentId", "status");

-- CreateIndex
CREATE INDEX "routines_generatedAt_idx" ON "routines"("generatedAt");

-- CreateIndex
CREATE INDEX "exercises_routineId_order_idx" ON "exercises"("routineId", "order");

-- CreateIndex
CREATE INDEX "exercise_logs_studentId_performedAt_idx" ON "exercise_logs"("studentId", "performedAt");

-- CreateIndex
CREATE INDEX "exercise_logs_exerciseId_performedAt_idx" ON "exercise_logs"("exerciseId", "performedAt");

-- CreateIndex
CREATE INDEX "session_reports_studentId_createdAt_idx" ON "session_reports"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "integration_logs_studentId_status_idx" ON "integration_logs"("studentId", "status");

-- CreateIndex
CREATE INDEX "integration_logs_routineId_idx" ON "integration_logs"("routineId");

-- CreateIndex
CREATE INDEX "integration_logs_status_retryCount_idx" ON "integration_logs"("status", "retryCount");

-- CreateIndex
CREATE INDEX "integration_logs_createdAt_idx" ON "integration_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routines" ADD CONSTRAINT "routines_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_reports" ADD CONSTRAINT "session_reports_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_logs" ADD CONSTRAINT "integration_logs_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;
