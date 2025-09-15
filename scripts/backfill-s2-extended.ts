import { PrismaClient } from "@prisma/client";
import { tokenAtLevel } from "../src/utils/s2.util";

const prisma = new PrismaClient();

async function run() {
  console.log("Starting extended S2 token backfill...");
  
  const BATCH = 1000;
  let processed = 0;
  
  for (;;) {
    const rows = await prisma.property.findMany({
      where: {
        OR: [
          { s2L6: null }, { s2L6: "" },
          { s2L8: null }, { s2L8: "" },
          { s2L10: null }, { s2L10: "" }
        ],
      } as any,
      select: { id: true, locationLat: true, locationLng: true },
      take: BATCH,
    });
    
    if (!rows.length) {
      console.log("No more properties to process. Extended backfill complete!");
      break;
    }

    console.log(`Processing batch of ${rows.length} properties...`);

    await prisma.$transaction(
      rows.map((p) =>
        prisma.property.update({
          where: { id: p.id },
          data: {
            s2L6: tokenAtLevel(p.locationLat, p.locationLng, 6),
            s2L8: tokenAtLevel(p.locationLat, p.locationLng, 8),
            s2L10: tokenAtLevel(p.locationLat, p.locationLng, 10),
          },
        })
      )
    );
    
    processed += rows.length;
    console.log(`Processed ${processed} properties total`);
  }
  
  await prisma.$disconnect();
  console.log("Extended backfill completed successfully!");
}

run().catch(async (e) => {
  console.error("Extended backfill failed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
