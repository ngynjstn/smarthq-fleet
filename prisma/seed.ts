import { prisma } from "@/lib/prisma";

//our fleet. real GE model nums so it feels authentic to demo
const FLEET = [
  { id: "fridge-001", name: "Kitchen Fridge", type: "REFRIGERATOR", model: "PFE28KYNFS" },
  { id: "washer-001", name: "Laundry Washer", type: "WASHER",       model: "GFW850SPNRS" },
  { id: "dryer-001",  name: "Laundry Dryer",  type: "DRYER",        model: "GFD85ESPNRS" },
  { id: "oven-001",   name: "Wall Oven",      type: "OVEN",         model: "JTS5000SNSS" },
];

async function main() {
    // upsert
    //using a fixe if makes the script idempotent
    //loop the same idepemptoent upsert over each appliance
    for (const appliance of FLEET) {
    await prisma.appliance.upsert({
      where: { id: appliance.id },
      update: {},
      create: appliance,
    });
    console.log("Seeded:", appliance.name);
  }
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });