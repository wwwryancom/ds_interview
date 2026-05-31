import { prisma } from "../src/db.js";
import { SEED_QUESTIONS } from "../src/seedData.js";
import { questionToDb } from "../src/mappers.js";
import { isValidCategory } from "../src/taxonomy.js";

async function main() {
  let upserts = 0;
  for (const q of SEED_QUESTIONS) {
    if (!isValidCategory(q.category)) {
      throw new Error(`Question ${q.id} has unknown category "${q.category}"`);
    }
    const data = questionToDb(q);
    await prisma.question.upsert({
      where: { id: q.id },
      create: data,
      update: data,
    });
    upserts += 1;
  }
  const total = await prisma.question.count();
  console.log(`Seeded/updated ${upserts} questions. Total in DB: ${total}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
