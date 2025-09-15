import { PrismaClient } from "@prisma/client";
import { tokenAtLevel } from "../src/utils/s2.util";

const prisma = new PrismaClient();

async function run() {
  console.log("Starting S2 token backfill...");
  
  const BATCH = 1000;
  let processed = 0;
  
  for (;;) {
    const rows = await prisma.property.findMany({
      where: {
        OR: [{ s2L12: null }, { s2L12: "" }, { s2L16: null }, { s2L16: "" }],
      } as any,
      select: { id: true, locationLat: true, locationLng: true },
      take: BATCH,
    });
    
    if (!rows.length) {
      console.log("No more properties to process. Backfill complete!");
      break;
    }

    console.log(`Processing batch of ${rows.length} properties...`);

    await prisma.$transaction(
      rows.map((p) =>
        prisma.property.update({
          where: { id: p.id },
          data: {
            s2L12: tokenAtLevel(p.locationLat, p.locationLng, 12),
            s2L16: tokenAtLevel(p.locationLat, p.locationLng, 16),
          },
        })
      )
    );
    
    processed += rows.length;
    console.log(`Processed ${processed} properties total`);
  }
  
  await prisma.$disconnect();
  console.log("Backfill completed successfully!");
}

run().catch(async (e) => {
  console.error("Backfill failed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
