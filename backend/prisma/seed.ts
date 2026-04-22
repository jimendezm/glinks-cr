import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  let count = await prisma.planCatalog.createMany({
    data: [
      { plan: '4-4' },
      { plan: '6-6' },
      { plan: '8-8' }
    ],
    skipDuplicates: true
  })
  console.log(`Created ${count} plans.`);

  count = await prisma.sectorCatalog.createMany({
    data: [
      { name: 'S1' },
      { name: 'S2' },
      { name: 'S3' }
    ],
    skipDuplicates: true
  })
  console.log(`Created ${count} sector antennas.`);

  count = await prisma.apTypeCatalog.createMany({
    data: [
      { ap_type: 'T1' },
      { ap_type: 'T2' },
    ],
    skipDuplicates: true
  })
  console.log(`Created ${count} AP types.`);

  count = await prisma.roleCatalog.createMany({
    data: [
      { role: 'Administrator' },
      { role: 'Technician' },
    ],
    skipDuplicates: true
  })
  console.log(`Created ${count} user roles.`);


}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
