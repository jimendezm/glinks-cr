-- CreateTable
CREATE TABLE "PlanCatalog" (
    "id" SERIAL NOT NULL,
    "plan" TEXT NOT NULL,

    CONSTRAINT "PlanCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectorCatalog" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "SectorCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApTypeCatalog" (
    "id" SERIAL NOT NULL,
    "ap_type" TEXT NOT NULL,

    CONSTRAINT "ApTypeCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleCatalog" (
    "id" SERIAL NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "RoleCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" SERIAL NOT NULL,
    "national_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name_1" TEXT NOT NULL,
    "last_name_2" TEXT NOT NULL,
    "primary_phone" TEXT NOT NULL,
    "secondary_phone" TEXT,
    "email" TEXT,
    "address" TEXT NOT NULL,
    "installation_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plan_id" INTEGER NOT NULL,
    "sector_id" INTEGER NOT NULL,
    "ap_type_id" INTEGER NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "client_id" INTEGER,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Maintenance" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "client_id" INTEGER NOT NULL,
    "responsible_id" INTEGER NOT NULL,
    "new_router" INTEGER,
    "new_poe" INTEGER,

    CONSTRAINT "Maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanCatalog_plan_key" ON "PlanCatalog"("plan");

-- CreateIndex
CREATE UNIQUE INDEX "SectorCatalog_name_key" ON "SectorCatalog"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ApTypeCatalog_ap_type_key" ON "ApTypeCatalog"("ap_type");

-- CreateIndex
CREATE UNIQUE INDEX "RoleCatalog_role_key" ON "RoleCatalog"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Client_national_id_key" ON "Client"("national_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "PlanCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "SectorCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_ap_type_id_fkey" FOREIGN KEY ("ap_type_id") REFERENCES "ApTypeCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "RoleCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_responsible_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
