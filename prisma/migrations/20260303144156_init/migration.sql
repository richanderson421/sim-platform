-- CreateEnum
CREATE TYPE "public"."SystemRole" AS ENUM ('SYSTEM_ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "public"."RoleScope" AS ENUM ('ORGANIZATION', 'INSTANCE');

-- CreateEnum
CREATE TYPE "public"."InstanceRole" AS ENUM ('OWNER', 'TA', 'PLAYER');

-- CreateEnum
CREATE TYPE "public"."EnrollmentRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'REVOKED');

-- CreateEnum
CREATE TYPE "public"."InstanceStatus" AS ENUM ('DRAFT', 'ENROLLMENT_OPEN', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."RoundStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "systemRole" "public"."SystemRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RoleAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" "public"."RoleScope" NOT NULL,
    "organizationId" TEXT,
    "instanceId" TEXT,
    "role" "public"."InstanceRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GameType" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GameTypeVersion" (
    "id" TEXT NOT NULL,
    "gameTypeId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "configJson" JSONB NOT NULL,
    "roundCount" INTEGER NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "GameTypeVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GameInstance" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "gameTypeVersionId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "organizationId" TEXT,
    "status" "public"."InstanceStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InstanceSettings" (
    "id" TEXT NOT NULL,
    "gameInstanceId" TEXT NOT NULL,
    "autoApproveEnrollments" BOOLEAN NOT NULL DEFAULT false,
    "requireStudentId" BOOLEAN NOT NULL DEFAULT false,
    "allowDisplayName" BOOLEAN NOT NULL DEFAULT true,
    "peerVisibility" BOOLEAN NOT NULL DEFAULT false,
    "allowLateSubmissions" BOOLEAN NOT NULL DEFAULT false,
    "lateGraceMinutes" INTEGER NOT NULL DEFAULT 0,
    "resultsVisibleAfterRoundClose" BOOLEAN NOT NULL DEFAULT true,
    "anonymizeOnArchive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstanceSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EnrollmentRequest" (
    "id" TEXT NOT NULL,
    "gameInstanceId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "studentId" TEXT,
    "status" "public"."EnrollmentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "deniedReason" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrollmentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Enrollment" (
    "id" TEXT NOT NULL,
    "gameInstanceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "public"."EnrollmentRequestStatus" NOT NULL DEFAULT 'APPROVED',
    "studentId" TEXT,
    "displayName" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Round" (
    "id" TEXT NOT NULL,
    "gameInstanceId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "public"."RoundStatus" NOT NULL DEFAULT 'DRAFT',
    "openAt" TIMESTAMP(3),
    "closeAt" TIMESTAMP(3),
    "reopenedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContentModule" (
    "id" TEXT NOT NULL,
    "gameTypeVersionId" TEXT,
    "gameInstanceId" TEXT,
    "roundId" TEXT,
    "title" TEXT NOT NULL,
    "markdown" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DecisionSubmission" (
    "id" TEXT NOT NULL,
    "gameInstanceId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "isLate" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Result" (
    "id" TEXT NOT NULL,
    "gameInstanceId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "userId" TEXT,
    "score" DOUBLE PRECISION,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "gameInstanceId" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "public"."Organization"("slug");

-- CreateIndex
CREATE INDEX "RoleAssignment_userId_scope_idx" ON "public"."RoleAssignment"("userId", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "RoleAssignment_userId_instanceId_role_key" ON "public"."RoleAssignment"("userId", "instanceId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "GameType_key_key" ON "public"."GameType"("key");

-- CreateIndex
CREATE UNIQUE INDEX "GameTypeVersion_gameTypeId_versionNumber_key" ON "public"."GameTypeVersion"("gameTypeId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "GameInstance_slug_key" ON "public"."GameInstance"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "InstanceSettings_gameInstanceId_key" ON "public"."InstanceSettings"("gameInstanceId");

-- CreateIndex
CREATE INDEX "EnrollmentRequest_gameInstanceId_status_idx" ON "public"."EnrollmentRequest"("gameInstanceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_gameInstanceId_userId_key" ON "public"."Enrollment"("gameInstanceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Round_gameInstanceId_number_key" ON "public"."Round"("gameInstanceId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "DecisionSubmission_roundId_userId_key" ON "public"."DecisionSubmission"("roundId", "userId");

-- CreateIndex
CREATE INDEX "Result_gameInstanceId_roundId_idx" ON "public"."Result"("gameInstanceId", "roundId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "public"."RoleAssignment" ADD CONSTRAINT "RoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoleAssignment" ADD CONSTRAINT "RoleAssignment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoleAssignment" ADD CONSTRAINT "RoleAssignment_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "public"."GameInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameType" ADD CONSTRAINT "GameType_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameTypeVersion" ADD CONSTRAINT "GameTypeVersion_gameTypeId_fkey" FOREIGN KEY ("gameTypeId") REFERENCES "public"."GameType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameTypeVersion" ADD CONSTRAINT "GameTypeVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameInstance" ADD CONSTRAINT "GameInstance_gameTypeVersionId_fkey" FOREIGN KEY ("gameTypeVersionId") REFERENCES "public"."GameTypeVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameInstance" ADD CONSTRAINT "GameInstance_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameInstance" ADD CONSTRAINT "GameInstance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InstanceSettings" ADD CONSTRAINT "InstanceSettings_gameInstanceId_fkey" FOREIGN KEY ("gameInstanceId") REFERENCES "public"."GameInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EnrollmentRequest" ADD CONSTRAINT "EnrollmentRequest_gameInstanceId_fkey" FOREIGN KEY ("gameInstanceId") REFERENCES "public"."GameInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EnrollmentRequest" ADD CONSTRAINT "EnrollmentRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EnrollmentRequest" ADD CONSTRAINT "EnrollmentRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Enrollment" ADD CONSTRAINT "Enrollment_gameInstanceId_fkey" FOREIGN KEY ("gameInstanceId") REFERENCES "public"."GameInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Enrollment" ADD CONSTRAINT "Enrollment_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Round" ADD CONSTRAINT "Round_gameInstanceId_fkey" FOREIGN KEY ("gameInstanceId") REFERENCES "public"."GameInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentModule" ADD CONSTRAINT "ContentModule_gameTypeVersionId_fkey" FOREIGN KEY ("gameTypeVersionId") REFERENCES "public"."GameTypeVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentModule" ADD CONSTRAINT "ContentModule_gameInstanceId_fkey" FOREIGN KEY ("gameInstanceId") REFERENCES "public"."GameInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentModule" ADD CONSTRAINT "ContentModule_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "public"."Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DecisionSubmission" ADD CONSTRAINT "DecisionSubmission_gameInstanceId_fkey" FOREIGN KEY ("gameInstanceId") REFERENCES "public"."GameInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DecisionSubmission" ADD CONSTRAINT "DecisionSubmission_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "public"."Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DecisionSubmission" ADD CONSTRAINT "DecisionSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Result" ADD CONSTRAINT "Result_gameInstanceId_fkey" FOREIGN KEY ("gameInstanceId") REFERENCES "public"."GameInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Result" ADD CONSTRAINT "Result_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "public"."Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Result" ADD CONSTRAINT "Result_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_gameInstanceId_fkey" FOREIGN KEY ("gameInstanceId") REFERENCES "public"."GameInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
